import Order from "../models/Order.js";

// @desc    Get all active/past orders for the logged-in user
// @route   GET /api/orders/my-orders
// @access  Private (Customers & Workers)
export const getMyOrdersController = async (req, res) => {
    try {
        const filter = req.user.role === "customer"
            ? { customer_id: req.user.id }
            : { worker_id: req.user.id };

        const orders = await Order.find(filter)
            .populate({
                path: "job_id",
                populate: { path: "category_id", select: "name icon_url" }
            })
            .populate("customer_id", "full_name profile_photo_url")
            .populate("worker_id", "full_name profile_photo_url phone_number")
            .sort({ createdAt: -1 });

        res.status(200).json({
            isStatus: true,
            msg: "Orders fetched successfully",
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};

// @desc    Update order status (e.g. mark completed)
// @route   PATCH /api/orders/:id/status
// @access  Private (Customers/Workers)
export const updateOrderStatusController = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["active", "completion_requested", "completed", "cancelled"].includes(status)) {
            return res.status(400).json({ isStatus: false, msg: "Invalid status" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ isStatus: false, msg: "Order not found" });
        }

        // Authorization: Ensure the user is either the customer or the worker
        if (
            order.customer_id.toString() !== req.user.id &&
            order.worker_id.toString() !== req.user.id
        ) {
            return res.status(403).json({ isStatus: false, msg: "Unauthorized" });
        }

        // Safety: If worker marks as completed, it should go to "completion_requested"
        let newStatus = status;
        if (status === "completed" && req.user.role === "worker") {
            newStatus = "completion_requested";
        }

        order.status = newStatus;
        await order.save();

        res.status(200).json({
            isStatus: true,
            msg: `Order marked as ${newStatus}`,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};

export const completeOrderController = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ isStatus: false, msg: "Order not found" });

        if (order.customer_id.toString() !== req.user.id && order.worker_id.toString() !== req.user.id) {
            return res.status(403).json({ isStatus: false, msg: "Unauthorized" });
        }

        let newStatus = "completed";
        if (req.user.role === "worker") newStatus = "completion_requested";

        order.status = newStatus;
        await order.save();
        res.status(200).json({ isStatus: true, msg: `Order marked as ${newStatus}`, data: order });
    } catch (error) {
        res.status(500).json({ isStatus: false, msg: error.message || "Server Error" });
    }
};

export const getOrderChatController = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ isStatus: false, msg: "Order not found" });
        res.status(200).json({ isStatus: true, data: order.messages });
    } catch (error) {
        res.status(500).json({ isStatus: false, msg: error.message || "Server Error" });
    }
};

export const sendMessageController = async (req, res) => {
    try {
        const { text } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ isStatus: false, msg: "Order not found" });

        order.messages.push({
            sender_id: req.user.id,
            text
        });
        await order.save();
        res.status(201).json({ isStatus: true, msg: "Message sent", data: order.messages });
    } catch (error) {
        res.status(500).json({ isStatus: false, msg: error.message || "Server Error" });
    }
};

export const createBookingController = (req, res) => {
    res.status(501).json({ isStatus: false, msg: "Moved to bookingControllers.js" });
};
