import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        job_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        reviewer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reviewee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;
