import express from "express";
import { verifyToken } from '../middlewares/authMiddleware.js'; // Assuming verifyUser was intended to be verifyToken or similar
const router = express.Router();

import userRoutes from "./userRoutes.js";
import appRoutes from "./appRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import jobRoutes from "./jobRoutes.js";
import offerRoutes from "./offerRoutes.js";
import orderRoutes from "./orderRoutes.js";
import messageRoutes from "./messageRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import workerAdRoutes from "./workerAdRoutes.js";
import adminRoutes from "./adminRoutes.js";

// Public or protected routes
router.use("/api/users", userRoutes);
router.use("/api/categories", categoryRoutes);
router.use("/api/jobs", jobRoutes);
router.use("/api/offers", offerRoutes);
router.use("/api/orders", orderRoutes);
router.use("/api/messages", messageRoutes);
router.use("/api/reviews", reviewRoutes);
router.use("/api/ads", workerAdRoutes);
router.use("/api/admin", adminRoutes);
router.use("/", appRoutes);

export default router;