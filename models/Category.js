const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true // e.g., "Plumbing", "AC Repair"
    },
    icon_url: { 
      type: String, 
      required: true // URL to the category image/icon shown on the home screen
    },
    description: { 
      type: String 
    },
    is_active: { 
      type: Boolean, 
      default: true // Admin can disable a category without deleting it
    },
    base_price_guideline: {
      type: Number, // Optional: Helps suggest a starting price to customers
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);