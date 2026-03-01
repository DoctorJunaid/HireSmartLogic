import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        job_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        worker_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "active", "completion_requested", "completed", "cancelled"],
            default: "pending",
        },
        total_price: {
            type: Number,
            required: true,
        },
        inspection_type: {
            type: String,
            enum: ["free", "paid"],
            default: null
        },
        inspection_fee: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        messages: [
            {
                sender_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                text: {
                    type: String,
                    required: true,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                }
            }
        ]
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
