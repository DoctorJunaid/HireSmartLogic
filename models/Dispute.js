const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    raised_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    against_user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    reason: {
      type: String,
      enum: ["no_show", "poor_quality", "payment_issue", "inappropriate_behavior", "other"],
      required: true,
    },
    description: { type: String, required: true },
    evidence_photos: [{ type: String }], // Cloudinary URLs of the broken pipe, etc.
    
    status: {
      type: String,
      enum: ["open", "investigating", "resolved", "closed"],
      default: "open",
    },
    admin_resolution: { 
      type: String, 
      default: "" // Admin types how they fixed it (e.g., "Banned worker, refunded customer")
    },
    resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // The admin who handled it
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);