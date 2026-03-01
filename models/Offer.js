import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    worker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    offered_price: {
      type: Number,
      required: true, // The initial price the worker asks for
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
    cover_note: {
      type: String,
      trim: true,
      default: "", // E.g., "I can be there in 10 mins, just need to buy a pipe."
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "negotiating"],
      default: "pending", // Notice how "completed" and "in_progress" are gone here!
    }
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;