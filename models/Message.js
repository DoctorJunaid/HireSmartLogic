import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // Support both job-based and ad-based conversations
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      index: true,
    },
    ad_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkerAd",
      index: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message_type: {
      type: String,
      enum: ["text", "image", "voice"],
      default: "text",
    },
    text_content: {
      type: String,
      default: "",
    },
    media_url: {
      type: String,
      default: null,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// At least one context must be provided
messageSchema.pre('validate', function (next) {
  if (!this.job_id && !this.ad_id) {
    return next(new Error('Either job_id or ad_id is required'));
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);
export default Message;