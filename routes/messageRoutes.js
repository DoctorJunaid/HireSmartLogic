import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { sendMessageController, getMessagesController, getMessageStreamController, getConversationsController } from "../controllers/messageControllers.js";

const router = express.Router();

router.get("/conversations", verifyToken, getConversationsController);
router.post("/", verifyToken, sendMessageController);
router.get("/:jobId", verifyToken, getMessagesController);
router.get("/stream/:jobId", verifyToken, getMessageStreamController);


export default router;
