import express from "express";
import { verifyToken as authenticate } from "../middlewares/authMiddleware.js";
import {
    createWorkerAdController,
    getMyAdsController,
    getWorkerAdsController,
    getAdByIdController
} from "../controllers/workerAdControllers.js";

const router = express.Router();

// Static routes first (before :id param catch-all)
router.get("/browse", getWorkerAdsController);
router.get("/my-ads", authenticate, getMyAdsController);
router.post("/post-ad", authenticate, createWorkerAdController);

// Dynamic route last
router.get("/:id", getAdByIdController);

export default router;
