const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    worker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cnic_front_image_url: {
      type: String,
      required: true, // URL from AWS S3 or Cloudinary
    },
    cnic_back_image_url: {
      type: String,
      required: true, 
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    admin_notes: {
      type: String,
      default: "", // For example: "Image too blurry, please re-upload"
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Links to the Admin who reviewed it
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Verification = mongoose.model("Verification", verificationSchema);
module.exports = Verification;