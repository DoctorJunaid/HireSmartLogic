import express from "express";
import {
    getMyOrdersController,
    updateOrderStatusController,
    getOrderChatController,
    sendMessageController,
    completeOrderController
} from "../controllers/orderControllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/my-orders", verifyToken, getMyOrdersController);
router.patch("/:id/status", verifyToken, updateOrderStatusController);

// Chat & completion routes
router.get("/:id/chat", verifyToken, getOrderChatController);
router.post("/:id/chat", verifyToken, sendMessageController);
router.patch("/:id/complete", verifyToken, completeOrderController);

export default router;
