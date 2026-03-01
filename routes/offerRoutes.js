import express from "express";
import {
    createOfferController,
    getJobOffersController,
    getMyOffersController,
    acceptOfferController
} from "../controllers/offerControllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createOfferController);
router.get("/my-offers", verifyToken, getMyOffersController);
router.get("/job/:jobId", verifyToken, getJobOffersController);
router.patch("/:id/accept", verifyToken, acceptOfferController);

export default router;
