import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { createReviewController } from "../controllers/reviewControllers.js";

const router = express.Router();

router.post("/", verifyToken, createReviewController);

export default router;
