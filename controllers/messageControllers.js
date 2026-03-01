import Message from "../models/Message.js";
import Order from "../models/Order.js";
import { EventEmitter } from "events";
import mongoose from "mongoose";


export const messageEmitter = new EventEmitter();

// @desc    Send a message within an order context
// @route   POST /api/messages
// @access  Private (Participants of the order)
export const sendMessageController = async (req, res) => {
    try {
        const { job_id, receiver_id, text_content, message_type, media_url } = req.body;
        const sender_id = req.user.id;

        if (!job_id || !receiver_id) {
            return res.status(400).json({ isStatus: false, msg: "job_id and receiver_id are required" });
        }

        if (!text_content && !media_url) {
            return res.status(400).json({ isStatus: false, msg: "Message content is empty" });
        }

        // Validate that sender and receiver are actually part of an active/completed order for this job
        const order = await Order.findOne({ job_id });
        if (!order) {
            return res.status(404).json({ isStatus: false, msg: "Order not found for this job" });
        }

        const isAuthorizedParticipant = (
            (order.customer_id.toString() === sender_id && order.worker_id.toString() === receiver_id) ||
            (order.worker_id.toString() === sender_id && order.customer_id.toString() === receiver_id)
        );

        if (!isAuthorizedParticipant) {
            return res.status(403).json({ isStatus: false, msg: "Not authorized to message this user for this job" });
        }

        const msgData = {
            job_id,
            sender_id,
            receiver_id,
            message_type: message_type || "text"
        };

        if (text_content) msgData.text_content = text_content;
        if (media_url) msgData.media_url = media_url;

        const message = await Message.create(msgData);

        // Also push to order embedded document for redundancy/easy fetch, if desired by architecture
        order.messages.push({
            sender_id,
            text: text_content || "[Media Content]"
        });
        await order.save();

        // Emit event for real-time SSE updates
        messageEmitter.emit(`newMessage_${job_id}`, message);

        res.status(201).json({
            isStatus: true,
            msg: "Message sent",
            data: message
        });

    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};

// @desc    Get messages for a specific job
// @route   GET /api/messages/:jobId
// @access  Private (Participants of the order)
export const getMessagesController = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;

        const order = await Order.findOne({ job_id: jobId });
        if (!order) {
            return res.status(404).json({ isStatus: false, msg: "Order not found for this job" });
        }

        if (order.customer_id.toString() !== userId && order.worker_id.toString() !== userId) {
            return res.status(403).json({ isStatus: false, msg: "Not authorized to view these messages" });
        }

        const messages = await Message.find({ job_id: jobId })
            .sort({ createdAt: 1 }); // Oldest first for chat UI

        // Mark unread messages as read
        const unreadIds = messages.filter(m => !m.is_read && m.sender_id.toString() !== userId).map(m => m._id);
        if (unreadIds.length > 0) {
            await Message.updateMany({ _id: { $in: unreadIds } }, { $set: { is_read: true } });
        }

        res.status(200).json({
            isStatus: true,
            msg: "Messages fetched",
            data: messages
        });

    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};

// @desc    Stream messages via Server-Sent Events (SSE)
// @route   GET /api/messages/stream/:jobId
// @access  Private
export const getMessageStreamController = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;

        // Verify order access
        const order = await Order.findOne({ job_id: jobId });
        if (!order || (order.customer_id.toString() !== userId && order.worker_id.toString() !== userId)) {
            return res.status(403).json({ isStatus: false, msg: "Not authorized to view messages" });
        }

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Disable timeout for this connection
        req.setTimeout(0);

        // Send an initial connected message to verify stream
        res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

        const messageListener = (message) => {
            res.write(`data: ${JSON.stringify({ type: 'new_message', data: message })}\n\n`);
        };

        const eventName = `newMessage_${jobId}`;
        messageEmitter.on(eventName, messageListener);

        // Cleanup on disconnect
        req.on('close', () => {
            messageEmitter.off(eventName, messageListener);
            res.end();
        });

    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ isStatus: false, msg: error.message || "Server Error" });
        }
    }
};

// @desc    Get list of conversations (latest message per job)
// @route   GET /api/messages/conversations
// @access  Private
export const getConversationsController = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all unique job_ids where the user is either sender or receiver
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender_id: new mongoose.Types.ObjectId(userId) },
                        { receiver_id: new mongoose.Types.ObjectId(userId) }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: "$job_id",
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$receiver_id", new mongoose.Types.ObjectId(userId)] }, { $eq: ["$is_read", false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: {
                        otherUserId: {
                            $cond: [
                                { $eq: ["$lastMessage.sender_id", new mongoose.Types.ObjectId(userId)] },
                                "$lastMessage.receiver_id",
                                "$lastMessage.sender_id"
                            ]
                        }
                    },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$otherUserId"] } } },
                        { $project: { full_name: 1, profile_photo_url: 1, role: 1 } }
                    ],
                    as: "otherUser"
                }
            },
            { $unwind: "$otherUser" },
            {
                $project: {
                    job_id: "$_id",
                    lastMessage: {
                        text_content: "$lastMessage.text_content",
                        createdAt: "$lastMessage.createdAt",
                        sender_id: "$lastMessage.sender_id"
                    },
                    unreadCount: 1,
                    otherUser: 1
                }
            },
            { $sort: { "lastMessage.createdAt": -1 } }
        ]);

        res.status(200).json({
            isStatus: true,
            msg: "Conversations fetched",
            data: conversations
        });

    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};

