import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
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
    authType: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    phone_number: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
      match: /^(\+92|0)?3\d{9}$/,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
    },
    passwordResetOtp: {
      type: String,
      default: null,
    },
    passwordResetOtpExpires: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["customer", "worker", "admin"],
      default: "customer",
    },
    rating_sum: {
      type: Number,
      default: 0,
    },
    rating_count: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    address: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    age: {
      type: Number,
      min: 16,
    },
    needsProfileCompletion: {
      type: Boolean,
      default: false,
    },
    is_profile_approved: {
      type: Boolean,
      default: false,
    },
    is_phone_verified: {
      type: Boolean,
      default: false,
    },
    cnic_number: {
      type: String,
      unique: true,
      sparse: true,
      match: /^[0-9]{5}-[0-9]{7}-[0-9]$/,
      select: false,
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
export default User;
