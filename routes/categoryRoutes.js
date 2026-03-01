import express from "express";
import { getCategoriesController, createCategoryController, seedCategoriesController } from "../controllers/categoryControllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Allow public to seed the categories for demo purposes
router.post("/seed", seedCategoriesController);

router.post("/", verifyToken, createCategoryController); // Can be locked to admin later
router.get("/", verifyToken, getCategoriesController);

export default router;
