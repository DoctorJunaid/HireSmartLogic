import express from 'express';
import { verifyAdmin } from '../middlewares/authMiddleware.js';
import {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    updateUserRole,
    getAllJobs,
    deleteJob,
    getAllOrders,
    getVerifications,
    approveVerification,
    rejectVerification,
    getAdminCategories,
    createAdminCategory,
    updateAdminCategory,
    deleteAdminCategory,
    getAllAds,
    deleteAd,
    getAllReviews,
} from '../controllers/adminController.js';

const router = express.Router();

// All routes here should be protected by verifyAdmin
router.use(verifyAdmin);

// Analytics / Dashboard
router.get('/stats', getDashboardStats);

// Users Management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/role', updateUserRole);

// Jobs Management
router.get('/jobs', getAllJobs);
router.delete('/jobs/:id', deleteJob);

// Orders
router.get('/orders', getAllOrders);

// Verifications
router.get('/verifications', getVerifications);
router.patch('/verifications/:id/approve', approveVerification);
router.patch('/verifications/:id/reject', rejectVerification);

// Categories Management
router.get('/categories', getAdminCategories);
router.post('/categories', createAdminCategory);
router.patch('/categories/:id', updateAdminCategory);
router.delete('/categories/:id', deleteAdminCategory);

// Worker Ads
router.get('/ads', getAllAds);
router.delete('/ads/:id', deleteAd);

// Reviews
router.get('/reviews', getAllReviews);

export default router;
