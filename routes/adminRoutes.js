import express from 'express';
import { verifyAdmin } from '../middlewares/authMiddleware.js';
import {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    getAllJobs,
    deleteJob,
    getAllOrders,
    getVerifications
} from '../controllers/adminController.js';

const router = express.Router();

// All routes here should be protected by verifyAdmin
router.use(verifyAdmin);

// Analytics / Dashboard
router.get('/stats', getDashboardStats);

// Users Management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Jobs / Posts Management
router.get('/jobs', getAllJobs);
router.delete('/jobs/:id', deleteJob);

// Orders / Interactions
router.get('/orders', getAllOrders);

// Verifications
router.get('/verifications', getVerifications);

export default router;
