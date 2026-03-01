import express from "express";
const router = express.Router();
import { unexpectedRouteController } from "../controllers/appControllers.js";


router.use(unexpectedRouteController);



export default router;