import Review from "../models/Review.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

// @desc    Submit a review for a completed job
// @route   POST /api/reviews
// @access  Private
export const createReviewController = async (req, res) => {
    try {
        const { job_id, rating, comment } = req.body;
        const reviewer_id = req.user.id;

        if (!job_id || !rating) {
            return res.status(400).json({ isStatus: false, msg: "job_id and rating are required" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ isStatus: false, msg: "Rating must be between 1 and 5" });
        }

        const order = await Order.findOne({ job_id });
        if (!order) {
            return res.status(404).json({ isStatus: false, msg: "Order not found" });
        }

        if (order.status !== "completed") {
            return res.status(400).json({ isStatus: false, msg: "Can only review completed orders" });
        }

        let reviewee_id;
        if (order.customer_id.toString() === reviewer_id) {
            reviewee_id = order.worker_id;
        } else if (order.worker_id.toString() === reviewer_id) {
            reviewee_id = order.customer_id;
        } else {
            return res.status(403).json({ isStatus: false, msg: "Not authorized to review this job" });
        }

        // Prevent double reviewing
        const existingReview = await Review.findOne({ job_id, reviewer_id });
        if (existingReview) {
            return res.status(400).json({ isStatus: false, msg: "You have already submitted a review for this job" });
        }

        const review = await Review.create({
            job_id,
            reviewer_id,
            reviewee_id,
            rating,
            comment: comment || ""
        });

        // Update the user's aggregated rating scores
        await User.findByIdAndUpdate(reviewee_id, {
            $inc: { rating_sum: rating, rating_count: 1 }
        });

        // Also note down rating on the Order if it's from the Customer
        if (order.customer_id.toString() === reviewer_id) {
            order.rating = rating;
            await order.save();
        }

        res.status(201).json({
            isStatus: true,
            msg: "Review submitted successfully",
            data: review
        });

    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};
