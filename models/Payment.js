const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      unique: true, // One final payment record per job
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
    amount: {
      type: Number,
      required: true,
    },
    payment_method: {
      type: String,
      enum: ["cash", "easypaisa", "jazzcash", "card", "wallet"],
      required: true,
    },
    transaction_id: {
      type: String, // The receipt number from EasyPaisa/Stripe
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    platform_fee: {
      type: Number,
      default: 0, // In case you want to show how the app makes money!
    }
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;