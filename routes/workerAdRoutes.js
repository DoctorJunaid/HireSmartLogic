import express from "express";
import { verifyToken as authenticate } from "../middlewares/authMiddleware.js";
import {
    createWorkerAdController,
    getMyAdsController,
    getWorkerAdsController
} from "../controllers/workerAdControllers.js";

const router = express.Router();

// General browse
router.get("/browse", getWorkerAdsController);

// Authenticated worker actions
router.post("/post-ad", authenticate, createWorkerAdController);
router.get("/my-ads", authenticate, getMyAdsController);

export default router;
