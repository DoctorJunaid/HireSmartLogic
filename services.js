import bcrypt from "bcryptjs";
import { signToken, tempToken } from "./utils/jwt.js";
import User from "./models/User.js";
import Verification from "./models/Verification.js";
import { sendMail, sendVerificationMail } from './utils/email.js'
import crypto from "crypto";


// Signin  user
const getUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");
  if (!user.isVerified) throw new Error("Please verify your Email first")

  const token = signToken({
    email: user.email,
    id: user._id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      profile_photo_url: user.profile_photo_url,
      is_profile_approved: user.is_profile_approved,
      needsProfileCompletion: user.needsProfileCompletion
    },
  };
};

// resetting user password by userId
const reset = async (userId, password) => {
  const newhashedPassword = await bcrypt.hash(password, 10);
  const user = await User.findByIdAndUpdate(
    userId,
    { password: newhashedPassword },
    { new: true },
  );
  if (!user) throw new Error("User not found");
  return user;
};

// create new user
const createUser = async ({ email, password, role = 'customer', phone_number, cnic_number, full_name, address, gender, age }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new Error("User already exists");
    } else {
      // Remove old unverified record to allow fresh sign-up
      await User.deleteOne({ _id: existingUser._id });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  // Generate 4-digit OTP for email verification
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const userData = {
    email,
    role,
    password: hashedPassword,
    verificationToken: hashedOtp,
    verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000
  };

  if (full_name) userData.full_name = full_name;
  if (address) userData.address = address;
  if (phone_number) userData.phone_number = phone_number;
  if (gender) userData.gender = gender;
  if (age) userData.age = age;
  if (cnic_number && role === 'worker') userData.cnic_number = cnic_number;

  const user = await User.create(userData);

  const subject = "Your HireSmart Verification Code";
  const message = `Your HireSmart verification code is: ${otp}. It expires in 24 hours.`;
  // Send email in the background so it doesn't block the API response
  sendVerificationMail(email, subject, message, otp).catch((err) => {
    console.error("Verification email failed:", err.message);
  });

  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
  };
};

const updateUser = async (userId, fields) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: fields },
    { new: true, runValidators: true },
  );

  if (!user) throw new Error("User not found");
  return user;
};

// generate temp reset token
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  // Generate 4-digit OTP for password reset
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  await User.findOneAndUpdate(
    { email },
    {
      passwordResetOtp: hashedOtp,
      passwordResetOtpExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
    }
  );

  const subject = "Your HireSmart Password Reset Code";
  const message = `Your HireSmart password reset code is: ${otp}. It expires in 15 minutes.`;
  // Send email in background without blocking response
  sendMail(email, subject, message, otp).catch((err) => {
    console.error("password reset email failed:", err.message);
  });

  return true;
};



const verifyEmail = async (otp) => {
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  const user = await User.findOneAndUpdate(
    {
      verificationToken: hashedOtp,
      verificationTokenExpires: { $gt: Date.now() },
      isVerified: false
    },
    {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null
    },
    { new: true }
  );
  if (!user) throw new Error("Invalid or expired OTP");
  return user;
}
// services for uploading profile image 
const updateProfileImage = async (userId, profileImageUrl) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { profile_photo_url: profileImageUrl },
    { new: true }
  );

  if (!user) throw new Error("User not found");

  return {
    id: user._id,
    email: user.email,
    profile_photo_url: user.profile_photo_url,
    role: user.role,
    full_name: user.full_name,
  };
};

// Save CNIC + selfie URLs (from Cloudinary) to a worker's Verification document
const updateCnicImages = async (userId, { cnicFrontUrl, cnicBackUrl, selfieUrl }) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.role !== 'worker') {
    throw new Error("Only workers require CNIC verification");
  }

  // Find existing verification or create new
  let verification = await Verification.findOne({ worker_id: userId });
  if (!verification) {
    verification = new Verification({ worker_id: userId });
  }

  if (cnicFrontUrl) verification.cnic_front_image_url = cnicFrontUrl;
  if (cnicBackUrl) verification.cnic_back_image_url = cnicBackUrl;
  if (selfieUrl) verification.selfie_image_url = selfieUrl;

  // Set to pending for admin review (Production Ready)
  verification.status = "pending";
  await verification.save();

  // User profile remains unapproved until admin reviews Verification document
  // user.is_profile_approved = false; // (Already false by default usually)
  await user.save();


  // If a selfie string was passed, we also want to optionally set it as their profile icon
  if (selfieUrl) {
    const isGooglePic = user.profile_photo_url?.includes('googleusercontent');
    const isDefaultPic = user.profile_photo_url?.includes('ui-avatars') || !user.profile_photo_url;

    if (isDefaultPic || isGooglePic) {
      user.profile_photo_url = selfieUrl;
      await user.save();
    }
  }

  return verification;
};

// Complete profile for a Google user (first login)
const completeProfile = async (userId, { full_name, phone_number, role, address, cnic_number, gender, age }) => {
  const update = { needsProfileCompletion: false };
  if (full_name) update.full_name = full_name;
  if (phone_number) update.phone_number = phone_number;
  if (role) update.role = role;
  if (address) update.address = address;
  if (gender) update.gender = gender;
  if (age) update.age = age;
  if (cnic_number && role === 'worker') update.cnic_number = cnic_number;

  const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true });
  if (!user) throw new Error("User not found");
  return user;
};

export {
  getUser,
  reset,
  createUser,
  updateUser,
  forgotPassword,
  verifyEmail,
  updateProfileImage,
  updateCnicImages,
  completeProfile,
};