import mongoose from "mongoose";

const workerAdSchema = new mongoose.Schema({
    worker_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    category_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true
    }],
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    experience_years: {
        type: Number,
        required: true
    },
    location_address: {
        type: String,
        required: true
    },
    price_range: {
        type: String, // e.g., "Rs. 2,000 - Rs. 4,000"
        required: true
    },
    photos: [{
        type: String
    }],
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
        index: true
    }
}, { timestamps: true });

const WorkerAd = mongoose.model("WorkerAd", workerAdSchema);
export default WorkerAd;
