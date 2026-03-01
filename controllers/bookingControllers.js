import Order from "../models/Order.js";

// @desc    Create a new booking/order from a worker advertisement
// @route   POST /api/orders/booking
// @access  Private (Customer)
export const createBookingController = async (req, res) => {
    try {
        const { ad_id, worker_id, amount, booking_date, customer_details } = req.body;

        if (!ad_id || !worker_id || !amount) {
            return res.status(400).json({ isStatus: false, msg: "Missing required booking details." });
        }

        // Create the order directly as 'pending' or 'active'
        // In this flow, we create it as 'active' or 'pending' depending on how you want to handle approval
        // User requested "real api" flow matching the UI
        const order = new Order({
            job_id: ad_id, // We reuse job_id field for ad_id or we could add a separate ad_id field. 
            // For now let's keep it simple and reuse the model logic if possible or update it.
            customer_id: req.user.id,
            worker_id: worker_id,
            total_price: amount,
            status: "active", // Direct booking from AD makes it active
            messages: [{
                sender_id: req.user.id,
                text: `New Booking Request: ${customer_details?.note || "Follow design flow"} for ${booking_date || "asap"}`
            }]
        });

        await order.save();

        res.status(201).json({
            isStatus: true,
            msg: "Booking successful",
            data: order
        });
    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};
