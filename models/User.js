const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      index: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: 8,
      maxlength: 100,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    phone_number: {
      type: String,
      unique: true,
      index: true,
      sparse: true, // Prevents duplicate errors if a user signs up via Google and has no phone number yet
      match: /^(?:\+92|0)3\d{9}$/,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["customer", "worker", "admin"],
      required: true,
    },
    is_profile_approved: {
      type: Boolean, default: false
    },
    is_phone_verified: {
      type: Boolean,
      default: false
    },
    is_email_verified:
    {
      type: Boolean,
      default: false
    },
    cnic_number: {
      type: String,
      required: function () {
        return this.role === "worker";
      },
      unique: true,
      sparse: true,
      match: /^[0-9]{5}-[0-9]{7}-[0-9]$/, // Validates standard format: 12345-1234567-1
      select: false,
    },
    rating_count: {
      type: Number,
      default: 0,
    },
    rating_sum: {
      type: Number,
      default: 0,
    },
    profile_photo_url: {
      type: String,
    },
    current_location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Crucial: Ensures virtuals show up when sending res.json()
    toObject: { virtuals: true },
  },
);

// Calculate the average rating on the fly
userSchema.virtual("average_rating").get(function () {
  if (this.rating_count === 0) return 0;
  return parseFloat((this.rating_sum / this.rating_count).toFixed(1)); // Returns a clean 1-decimal float like 4.5
});

const User = mongoose.model("User", userSchema);
module.exports = User;
