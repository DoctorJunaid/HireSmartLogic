import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true // Good for quickly fetching a user's job history
  },
  assigned_worker_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  voice_note_url: {
    type: String,
    default: null
  },
  photos: [{
    type: String // Stores cloud URLs for images attached to the job
  }],
  job_type: { // e.g., "Plumbing", "Electrical"
    type: String,
    required: true,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // format MUST be [longitude, latitude]
      index: "2dsphere" // This is the magic index that allows the 5-10km radius search
    }
  },
  location_address: { // The human-readable address the user typed in
    type: String,
    required: true
  },
  pricing_mode: {
    type: String,
    enum: ["fixed", "bidding", "inspection_required"],
    required: true
  },
  initial_budget: {
    type: Number,
    // Only require an initial budget if the customer selected "fixed" pricing
    required: function () { return this.pricing_mode === "fixed"; }
  },
  final_agreed_price: {
    type: Number,
    default: null
  },
  inspection_fee: {
    type: Number,
    default: 0
  },
  is_emergency: {
    type: Boolean,
    default: false,
    index: true // Speeds up queries when broadcasting emergency alerts
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: [
      "open",
      "inspection_scheduled",
      "awaiting_customer_approval",
      "in_progress",
      "completed",
      "cancelled"
    ],
    default: "open",
    index: true
  }
}, { timestamps: true });

const Job = mongoose.model("Job", jobSchema);
export default Job;