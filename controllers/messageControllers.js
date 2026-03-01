import Message from "../models/Message.js";
import Order from "../models/Order.js";
import Offer from "../models/Offer.js";
import Job from "../models/Job.js";
import WorkerAd from "../models/WorkerAd.js";
import { EventEmitter } from "events";
import mongoose from "mongoose";

export const messageEmitter = new EventEmitter();

// Helper: get conversation_key from job_id or ad_id
const getConversationKey = (job_id, ad_id) => {
    if (job_id) return `job_${job_id}`;
    if (ad_id) return `ad_${ad_id}`;
    return null;
};

// @desc    Send a message (supports both job and ad-based conversations)
// @route   POST /api/messages
// @access  Private
export const sendMessageController = async (req, res) => {
    try {
        const { job_id, ad_id, receiver_id, text_content, message_type, media_url } = req.body;
        const sender_id = req.user.id;

        if (!receiver_id || receiver_id === 'undefined' || !mongoose.isValidObjectId(receiver_id)) {
            return res.status(400).json({ isStatus: false, msg: "receiver_id must be a valid id" });
        }

        if (!job_id && !ad_id) {
            return res.status(400).json({ isStatus: false, msg: "Either job_id or ad_id is required" });
        }

        if (job_id && (!mongoose.isValidObjectId(job_id) || job_id === 'undefined')) {
            return res.status(400).json({ isStatus: false, msg: "job_id must be a valid id" });
        }

        if (ad_id && (!mongoose.isValidObjectId(ad_id) || ad_id === 'undefined')) {
            return res.status(400).json({ isStatus: false, msg: "ad_id must be a valid id" });
        }

        if (!text_content && !media_url) {
            return res.status(400).json({ isStatus: false, msg: "Message content is empty" });
        }

        // For ad-based messaging: just verify the ad exists and receiver is the worker
        if (ad_id && !job_id) {
            const ad = await WorkerAd.findById(ad_id);
            if (!ad) {
                return res.status(404).json({ isStatus: false, msg: "Ad not found" });
            }
            // Allow messaging: the sender contacts the ad worker, or ad worker replies
            const adWorkerId = ad.worker_id.toString();
            if (sender_id !== adWorkerId && receiver_id !== adWorkerId) {
                return res.status(403).json({ isStatus: false, msg: "Not authorized to message about this ad" });
            }
        }

        // For job-based messaging: validate job participants
        if (job_id) {
            const job = await Job.findById(job_id);
            if (!job) {
                return res.status(404).json({ isStatus: false, msg: "Job not found" });
            }

            let isAuthorizedParticipant = false;
            const customerId = job.customer_id.toString();
            let workerId = null;

            if (sender_id === customerId) {
                workerId = receiver_id;
            } else if (receiver_id === customerId) {
                workerId = sender_id;
            }

            if (workerId) {
                const offerCount = await Offer.countDocuments({ job_id, worker_id: workerId });
                if (offerCount > 0) isAuthorizedParticipant = true;
                const orderCount = await Order.countDocuments({ job_id, worker_id: workerId });
                if (orderCount > 0) isAuthorizedParticipant = true;
            }

            if (!isAuthorizedParticipant) {
                return res.status(403).json({ isStatus: false, msg: "Not authorized to message this user for this job" });
            }
        }

        const msgData = {
            sender_id,
            receiver_id,
            message_type: message_type || "text"
        };

        if (job_id) msgData.job_id = job_id;
        if (ad_id) msgData.ad_id = ad_id;
        if (text_content) msgData.text_content = text_content;
        if (media_url) msgData.media_url = media_url;

        const message = await Message.create(msgData);

        // If job-based, push to order embedded document
        if (job_id) {
            const customerId = sender_id;
            let workerId = receiver_id;
            const order = await Order.findOne({ job_id, worker_id: workerId });
            if (order) {
                order.messages.push({ sender_id, text: text_content || "[Media Content]" });
                await order.save();
            }
        }

        // Emit event for real-time
        const convKey = getConversationKey(job_id, ad_id);
        messageEmitter.emit(`newMessage_${convKey}`, message);

        res.status(201).json({ isStatus: true, msg: "Message sent", data: message });

    } catch (error) {
        res.status(500).json({ isStatus: false, msg: error.message || "Server Error" });
    }
};

// @desc    Get messages for a conversation (by job or ad)
// @route   GET /api/messages/:contextId  (with ?context=job|ad&other_user_id=xxx)
// @access  Private
export const getMessagesController = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;
        const otherUserId = req.query.other_user_id;
        const context = req.query.context || 'job'; // 'job' or 'ad'

        if (!otherUserId || otherUserId === 'undefined' || !mongoose.isValidObjectId(otherUserId)) {
            return res.status(400).json({ isStatus: false, msg: "other_user_id query param is required and must be valid" });
        }

        if (!jobId || jobId === 'undefined' || !mongoose.isValidObjectId(jobId)) {
            return res.status(400).json({ isStatus: false, msg: "jobId param is required and must be valid" });
        }

        // Build query based on context
        const contextFilter = context === 'ad'
            ? { ad_id: new mongoose.Types.ObjectId(jobId) }
            : { job_id: new mongoose.Types.ObjectId(jobId) };

        const messages = await Message.find({
            ...contextFilter,
            $or: [
                { sender_id: userId, receiver_id: otherUserId },
                { sender_id: otherUserId, receiver_id: userId }
            ]
        }).sort({ createdAt: 1 });

        // Mark unread messages as read
        const unreadIds = messages
            .filter(m => !m.is_read && m.sender_id.toString() !== userId)
            .map(m => m._id);
        if (unreadIds.length > 0) {
            await Message.updateMany({ _id: { $in: unreadIds } }, { $set: { is_read: true } });
        }

        res.status(200).json({ isStatus: true, msg: "Messages fetched", data: messages });

    } catch (error) {
        res.status(500).json({ isStatus: false, msg: error.message || "Server Error" });
    }
};

// @desc    Stream messages via SSE
// @route   GET /api/messages/stream/:jobId
// @access  Private
export const getMessageStreamController = async (req, res) => {
    try {
        const { jobId } = req.params;
        const context = req.query.context || 'job';

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        req.setTimeout(0);

        res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

        const convKey = context === 'ad' ? `ad_${jobId}` : `job_${jobId}`;
        const messageListener = (message) => {
            res.write(`data: ${JSON.stringify({ type: 'new_message', data: message })}\n\n`);
        };

        const eventName = `newMessage_${convKey}`;
        messageEmitter.on(eventName, messageListener);

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

// @desc    Get conversations list (supports both job and ad conversations)
// @route   GET /api/messages/conversations
// @access  Private
export const getConversationsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const userOid = new mongoose.Types.ObjectId(userId);

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender_id: userOid }, { receiver_id: userOid }]
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        // Group by either job_id or ad_id
                        job_id: "$job_id",
                        ad_id: "$ad_id",
                        // Also group by the "other" participant
                        other: {
                            $cond: [
                                { $eq: ["$sender_id", userOid] },
                                "$receiver_id",
                                "$sender_id"
                            ]
                        }
                    },
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$receiver_id", userOid] }, { $eq: ["$is_read", false] }] },
                                1, 0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id.other",
                    foreignField: "_id",
                    pipeline: [
                        { $project: { full_name: 1, profile_photo_url: 1, role: 1 } }
                    ],
                    as: "otherUser"
                }
            },
            { $unwind: "$otherUser" },
            // Optionally lookup job title
            {
                $lookup: {
                    from: "jobs",
                    localField: "_id.job_id",
                    foreignField: "_id",
                    pipeline: [{ $project: { title: 1 } }],
                    as: "jobInfo"
                }
            },
            // Optionally lookup ad title
            {
                $lookup: {
                    from: "workerads",
                    localField: "_id.ad_id",
                    foreignField: "_id",
                    pipeline: [{ $project: { title: 1 } }],
                    as: "adInfo"
                }
            },
            {
                $project: {
                    context_id: {
                        $cond: [
                            { $ne: ["$_id.job_id", null] },
                            "$_id.job_id",
                            "$_id.ad_id"
                        ]
                    },
                    context_type: {
                        $cond: [
                            { $ne: ["$_id.job_id", null] },
                            "job",
                            "ad"
                        ]
                    },
                    context_title: {
                        $cond: [
                            { $gt: [{ $size: "$jobInfo" }, 0] },
                            { $arrayElemAt: ["$jobInfo.title", 0] },
                            {
                                $cond: [
                                    { $gt: [{ $size: "$adInfo" }, 0] },
                                    { $arrayElemAt: ["$adInfo.title", 0] },
                                    "Direct Message"
                                ]
                            }
                        ]
                    },
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

        res.status(200).json({ isStatus: true, msg: "Conversations fetched", data: conversations });

    } catch (error) {
        res.status(500).json({ isStatus: false, msg: error.message || "Server Error" });
    }
};
