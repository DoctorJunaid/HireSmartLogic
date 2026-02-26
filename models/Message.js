const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
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
      enum: ["text", "image", "voice"], // Tells the frontend how to render the message
      default: "text",
    },
    text_content: {
      type: String,
      default: "", // Used if message_type is "text"
    },
    media_url: {
      type: String,
      default: null, // Holds the Cloudinary URL if message_type is "image" or "voice"
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;