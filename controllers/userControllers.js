import * as userServices from "../services.js";
import User from "../models/User.js";
import Verification from "../models/Verification.js";
import { v2 as cloudinary } from 'cloudinary';
import { signToken } from "../utils/jwt.js";
import crypto from "crypto";

// controller for signUp a user
const createUserController = async (req, res) => {
  try {
    const { full_name, email, password, role, phone_number, cnic_number, address, gender, age } = req.body;
    if (!full_name || !email || !password)
      return res.status(400).json({
        isStatus: false,
        msg: "Please provide full name, email, and password",
        data: null,
      });

    if (role === 'worker' && !cnic_number) {
      return res.status(400).json({
        isStatus: false,
        msg: "CNIC number is required for workers",
        data: null,
      });
    }

    // Clean up unverified expired accounts with same email, phone or cnic
    const cleanupQuery = {
      isVerified: false,
      verificationTokenExpires: { $lt: Date.now() },
      $or: [{ email }]
    };
    if (phone_number) cleanupQuery.$or.push({ phone_number });
    if (cnic_number) cleanupQuery.$or.push({ cnic_number });

    await User.deleteMany(cleanupQuery);

    const result = await userServices.createUser({ full_name, email, password, role, phone_number, cnic_number, address, gender, age });

    res.status(201).json({
      isStatus: true,
      msg: "User created successfully",
      data: result.user,
    });
  } catch (error) {
    if (error.message === "User already exists") {
      return res
        .status(409)
        .json({ isStatus: false, msg: error.message, data: null });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        isStatus: false,
        msg: `${field.replace('_', ' ')} is already in use.`,
        data: null,
      });
    }
    res.status(500).json({
      isStatus: false,
      msg: error.message || "Internal Server Error",
      data: null,
    });
  }
};

//controller for updating user info (general fields)
const updateUserController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone_number, address, gender, age } = req.body;

    const allowedFields = {};
    if (full_name !== undefined) allowedFields.full_name = full_name;
    if (phone_number !== undefined) allowedFields.phone_number = phone_number;
    if (address !== undefined) allowedFields.address = address;
    if (gender !== undefined) allowedFields.gender = gender;
    if (age !== undefined) allowedFields.age = Number(age);

    const user = await userServices.updateUser(userId, allowedFields);
    res
      .status(200)
      .json({ isStatus: true, msg: "Updated successfully", data: user });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        isStatus: false,
        msg: `${field.replace('_', ' ')} is already in use.`,
      });
    }
    res
      .status(500)
      .json({ isStatus: false, msg: error.message || "Internal Server Error" });
  }
};


const resetPasswordUserController = async (req, res) => {
  try {
    const { otp, password } = req.body;

    if (!otp || !password) {
      return res.status(400).json({
        isStatus: false,
        msg: "OTP and new password are required",
        data: null,
      });
    }

    // Hash the submitted OTP and find matching user
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const user = await User.findOne({
      passwordResetOtp: hashedOtp,
      passwordResetOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(401).json({
        isStatus: false,
        msg: "Invalid or expired OTP",
        data: null,
      });
    }

    // Reset password using user._id
    await userServices.reset(user._id, password);
    await User.findByIdAndUpdate(user._id, {
      passwordResetOtp: null,
      passwordResetOtpExpires: null,
    });

    return res.status(200).json({
      isStatus: true,
      msg: "Password updated successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      isStatus: false,
      msg: error.message || "Internal Server Error",
      data: null,
    });
  }
};

// controller for logging in a user
const getUserController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({
        isStatus: false,
        msg: "Please provide email and password",
        data: null,
      });
    const result = await userServices.getUser(email, password);

    // Set HTTP-only cookie (for web)
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res
      .status(200)
      .json({
        isStatus: true,
        msg: "Login successfully",
        data: {
          id: result.user.id,
          full_name: result.user.full_name,
          email: result.user.email,
          role: result.user.role,
          profile_photo_url: result.user.profile_photo_url,
          is_profile_approved: result.user.is_profile_approved,
          needsProfileCompletion: result.user.needsProfileCompletion,
          token: result.token
        }
      });
  } catch (error) {
    if (error.message === "User not found") {
      return res
        .status(404)
        .json({ isStatus: false, msg: error.message, data: null });
    }
    if (error.message === "Invalid credentials") {
      return res
        .status(401)
        .json({ isStatus: false, msg: error.message, data: null });
    }
    if (error.message === "Please verify your Email first") {
      return res.status(403).json({
        isStatus: false,
        msg: error.message,
      });
    }
    res.status(500).json({
      isStatus: false,
      msg: error.message || "Internal Server Error",
      data: null,
    });
  }
};

// controller for logging out a user
const logoutController = (req, res) => {
  res.clearCookie("token");
  res
    .status(200)
    .json({ isStatus: true, msg: "Logged out successfully", data: null });
};

const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ isStatus: false, msg: "Email required" });

    await userServices.forgotPassword(email);

    res.status(200).json({
      isStatus: true,
      msg: "Password reset token sent to your email",
      data: null,
    });
  } catch (error) {
    res.status(500).json({ isStatus: false, msg: error.message });
  }
};

const changePasswordController = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;
    if (!userId)
      return res
        .status(400)
        .json({ isStatus: false, msg: "User ID is missing from token" });
    if (!password)
      return res
        .status(400)
        .json({ isStatus: false, msg: "password is missing" });

    const result = await userServices.reset(userId, password);

    res.status(200).json({
      isStatus: true,
      msg: "Password has been successfully changed",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ isStatus: false, msg: error.message });
  }
};

const getProfileController = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ isStatus: false, msg: "User not found" });
    }

    res.status(200).json({
      isStatus: true,
      msg: "User is authenticated",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ isStatus: false, msg: error.message });
  }
};

// controller for verification Email
const verifyEmailController = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    if (!token)
      return res.status(400).json({ isStatus: false, msg: "token is missing" });
    const user = await userServices.verifyEmail(token);

    // Generate token for immediate login on mobile
    const loginToken = signToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      isStatus: true,
      msg: "Email verified successfully",
      data: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        isVerified: user.isVerified,
        token: loginToken
      },
    });
  } catch (error) {
    res.status(500).json({ isStatus: false, msg: error.message });
  }
};

// Upload profile image controller (now uses req.user.id instead of username)
const updateProfileImageController = async (req, res) => {
  try {
    const userId = req.user.id;

    const { profileImageUrl } = req.body;
    if (!profileImageUrl) {
      return res.status(400).json({ isStatus: false, msg: "Image URL is required" });
    }

    const user = await userServices.updateProfileImage(userId, profileImageUrl);

    res.status(200).json({
      isStatus: true,
      msg: "Profile image updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      isStatus: false,
      msg: error.message || "Internal Server Error",
    });
  }
};

// Get a Cloudinary signed upload signature
const signImageController = async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: 'hiresmart_profile_images',
      },
      process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      isStatus: true,
      msg: "Signature generated successfully",
      data: {
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY
      },
    });
  } catch (error) {
    res.status(500).json({
      isStatus: false,
      msg: "Failed to generate signature",
      error: error.message
    });
  }
};

// Save CNIC + selfie Cloudinary URLs to worker profile
const uploadCnicController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cnicFrontUrl, cnicBackUrl, selfieUrl } = req.body;

    if (!cnicFrontUrl || !cnicBackUrl || !selfieUrl) {
      return res.status(400).json({
        isStatus: false,
        msg: "cnicFrontUrl, cnicBackUrl and selfieUrl are all required",
      });
    }

    await userServices.updateCnicImages(userId, { cnicFrontUrl, cnicBackUrl, selfieUrl });

    res.status(200).json({
      isStatus: true,
      msg: "CNIC documents saved successfully",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      isStatus: false,
      msg: error.message || "Internal Server Error",
    });
  }
};

// Return verification status for the logged in worker
const getVerificationStatusController = async (req, res) => {
  try {
    const userId = req.user.id;
    const verification = await Verification.findOne({ worker_id: userId });

    if (!verification) {
      return res.status(200).json({
        isStatus: true,
        msg: "No verification document found",
        data: { status: "missing" }
      });
    }

    res.status(200).json({
      isStatus: true,
      msg: "Verification status retrieved",
      data: { status: verification.status }
    });
  } catch (error) {
    res.status(500).json({
      isStatus: false,
      msg: error.message || "Internal Server Error",
    });
  }
};

// Complete profile for a new Google user
const completeProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone_number, role, address, cnic_number, gender, age } = req.body;

    if (!role || !['customer', 'worker'].includes(role)) {
      return res.status(400).json({ isStatus: false, msg: "A valid role (customer or worker) is required" });
    }

    if (role === 'worker' && !cnic_number) {
      return res.status(400).json({ isStatus: false, msg: "CNIC number is required for workers" });
    }

    const user = await userServices.completeProfile(userId, { full_name, phone_number, role, address, cnic_number, gender, age });

    res.status(200).json({
      isStatus: true,
      msg: "Profile completed successfully",
      data: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        profile_photo_url: user.profile_photo_url,
        address: user.address,
        is_profile_approved: user.is_profile_approved,
        needsProfileCompletion: user.needsProfileCompletion,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        isStatus: false,
        msg: `${field.replace('_', ' ')} is already in use.`,
      });
    }
    res.status(500).json({
      isStatus: false,
      msg: error.message || "Internal Server Error",
    });
  }
};

// Resend verification OTP controller
const resendVerificationOtpController = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ isStatus: false, msg: "Email is required" });
    }

    await userServices.resendVerificationOtp(email);

    res.status(200).json({
      isStatus: true,
      msg: "Verification code resent successfully",
      data: null,
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ isStatus: false, msg: error.message });
    }
    if (error.message === "Email is already verified") {
      return res.status(400).json({ isStatus: false, msg: error.message });
    }
    res.status(500).json({
      isStatus: false,
      msg: error.message || "Internal Server Error",
    });
  }
};

export {
  createUserController,
  updateUserController,
  resetPasswordUserController,
  getUserController,
  logoutController,
  forgotPasswordController,
  getProfileController,
  changePasswordController,
  verifyEmailController,
  updateProfileImageController,
  signImageController,
  uploadCnicController,
  completeProfileController,
  getVerificationStatusController,
  resendVerificationOtpController,
};