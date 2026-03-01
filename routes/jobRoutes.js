import express from "express";
import {
    createJobController,
    getExploreJobsController,
    getMyJobsController,
    getJobDetailsController
} from "../controllers/jobControllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createJobController);
router.get("/", verifyToken, getExploreJobsController);
router.get("/my-jobs", verifyToken, getMyJobsController);
router.get("/:id", verifyToken, getJobDetailsController);

export default router;
