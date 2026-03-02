import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
const router = express.Router();
import {
  getUserController,
  createUserController,
  updateUserController,
  resetPasswordUserController,
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
} from "../controllers/userControllers.js";
import { googleMobileController } from "../controllers/googleMobileController.js";
import { otpRateLimiter } from "../middlewares/rateLimitMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { registerSchema, loginSchema, updateProfileSchema, completeProfileSchema } from "../validators/userValidator.js";


// Google Mobile Auth (React Native)
router.post("/google-mobile", googleMobileController);

// Auth routes
router.post("/signup", validate(registerSchema), createUserController);
router.post("/login", validate(loginSchema), getUserController);
router.post("/logout", logoutController);
router.patch("/password", resetPasswordUserController);
router.post("/forgot-password", otpRateLimiter, forgotPasswordController);


// Verification
router.get("/verify-email", otpRateLimiter, verifyEmailController);   // web fallback
router.post("/verify-email", otpRateLimiter, verifyEmailController);  // mobile (token in body)
router.post("/resend-otp", otpRateLimiter, resendVerificationOtpController);  // resend verification code

// Protected routes (require JWT)
router.get("/me", verifyToken, getProfileController);
router.patch("/me", verifyToken, validate(updateProfileSchema), updateUserController);
router.patch("/change-password", verifyToken, changePasswordController);
router.patch("/complete-profile", verifyToken, validate(completeProfileSchema), completeProfileController);

router.patch("/upload-cnic", verifyToken, uploadCnicController);
router.get("/verification-status", verifyToken, getVerificationStatusController);
router.patch("/upload-image", verifyToken, updateProfileImageController);
router.get("/sign-upload", verifyToken, signImageController);

export default router;