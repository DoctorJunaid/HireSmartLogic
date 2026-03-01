import User from '../models/User.js';
import Order from '../models/Order.js';
import Job from '../models/Job.js';
import Verification from '../models/Verification.js';
import Category from '../models/Category.js';
import WorkerAd from '../models/WorkerAd.js';
import Review from '../models/Review.js';
import Offer from '../models/Offer.js';

export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const totalWorkers = await User.countDocuments({ role: 'worker' });

        const totalJobs = await Job.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalCategories = await Category.countDocuments();
        const pendingVerifications = await Verification.countDocuments({ status: 'pending' });
        const totalAds = await WorkerAd.countDocuments();

        // Calculate revenue from completed orders
        const completedOrders = await Order.find({ status: 'completed' });
        const totalRevenue = completedOrders.reduce((acc, order) => acc + (order.total_price || 0), 0);

        // Get recent activity
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
        const recentOrders = await Order.find()
            .populate('customer_id', 'full_name email')
            .populate('worker_id', 'full_name')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            stats: {
                totalUsers,
                totalCustomers,
                totalWorkers,
                totalJobs,
                totalOrders,
                totalRevenue,
                totalCategories,
                pendingVerifications,
                totalAds,
            },
            recentUsers,
            recentOrders,
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ msg: "Server error fetching stats" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ msg: "Error fetching users" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.status(200).json({ msg: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Error deleting user" });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['customer', 'worker', 'admin'].includes(role)) {
            return res.status(400).json({ msg: "Invalid role" });
        }
        const user = await User.findByIdAndUpdate(id, { role }, { new: true });
        if (!user) return res.status(404).json({ msg: "User not found" });
        res.status(200).json({ msg: "Role updated", user });
    } catch (error) {
        res.status(500).json({ msg: "Error updating role" });
    }
};

export const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('customer_id', 'full_name email')
            .populate('category_id', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ msg: "Error fetching jobs" });
    }
};

export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        await Job.findByIdAndDelete(id);
        res.status(200).json({ msg: "Job deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Error deleting job" });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('customer_id', 'full_name email')
            .populate('worker_id', 'full_name email')
            .populate({
                path: 'job_id',
                select: 'title category_id',
                populate: { path: 'category_id', select: 'name' }
            })
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ msg: "Error fetching orders" });
    }
};

// ──── Verification Management ────

export const getVerifications = async (req, res) => {
    try {
        const verifications = await Verification.find()
            .populate('worker_id', 'full_name email phone_number profile_photo_url cnic_number')
            .populate('reviewed_by', 'full_name')
            .sort({ createdAt: -1 });
        res.status(200).json(verifications);
    } catch (error) {
        res.status(500).json({ msg: "Error fetching verifications" });
    }
};

export const approveVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        const verification = await Verification.findById(id);
        if (!verification) return res.status(404).json({ msg: "Verification not found" });

        verification.status = "approved";
        verification.reviewed_by = adminId;
        verification.reviewed_at = new Date();
        verification.admin_notes = req.body.notes || "Approved by admin";
        await verification.save();

        // Update user's profile approval
        await User.findByIdAndUpdate(verification.worker_id, { is_profile_approved: true });

        res.status(200).json({ msg: "Verification approved", verification });
    } catch (error) {
        res.status(500).json({ msg: "Error approving verification" });
    }
};

export const rejectVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        const { notes } = req.body;

        const verification = await Verification.findById(id);
        if (!verification) return res.status(404).json({ msg: "Verification not found" });

        verification.status = "rejected";
        verification.reviewed_by = adminId;
        verification.reviewed_at = new Date();
        verification.admin_notes = notes || "Rejected by admin";
        await verification.save();

        // Ensure user is not approved
        await User.findByIdAndUpdate(verification.worker_id, { is_profile_approved: false });

        res.status(200).json({ msg: "Verification rejected", verification });
    } catch (error) {
        res.status(500).json({ msg: "Error rejecting verification" });
    }
};

// ──── Category Management ────

export const getAdminCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ msg: "Error fetching categories" });
    }
};

export const createAdminCategory = async (req, res) => {
    try {
        const { name, icon_url, description, base_price_guideline } = req.body;
        if (!name || !icon_url) return res.status(400).json({ msg: "Name and icon_url are required" });

        const exists = await Category.findOne({ name });
        if (exists) return res.status(400).json({ msg: "Category already exists" });

        const category = await Category.create({ name, icon_url, description, base_price_guideline });
        res.status(201).json({ msg: "Category created", category });
    } catch (error) {
        res.status(500).json({ msg: "Error creating category" });
    }
};

export const updateAdminCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const update = {};
        if (req.body.name) update.name = req.body.name;
        if (req.body.icon_url) update.icon_url = req.body.icon_url;
        if (req.body.description !== undefined) update.description = req.body.description;
        if (req.body.base_price_guideline !== undefined) update.base_price_guideline = req.body.base_price_guideline;
        if (req.body.is_active !== undefined) update.is_active = req.body.is_active;

        const category = await Category.findByIdAndUpdate(id, update, { new: true });
        if (!category) return res.status(404).json({ msg: "Category not found" });
        res.status(200).json({ msg: "Category updated", category });
    } catch (error) {
        res.status(500).json({ msg: "Error updating category" });
    }
};

export const deleteAdminCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        res.status(200).json({ msg: "Category deleted" });
    } catch (error) {
        res.status(500).json({ msg: "Error deleting category" });
    }
};

// ──── Worker Ads Management ────

export const getAllAds = async (req, res) => {
    try {
        const ads = await WorkerAd.find()
            .populate('worker_id', 'full_name email profile_photo_url')
            .populate('category_ids', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(ads);
    } catch (error) {
        res.status(500).json({ msg: "Error fetching ads" });
    }
};

export const deleteAd = async (req, res) => {
    try {
        const { id } = req.params;
        await WorkerAd.findByIdAndDelete(id);
        res.status(200).json({ msg: "Ad deleted" });
    } catch (error) {
        res.status(500).json({ msg: "Error deleting ad" });
    }
};

// ──── Reviews Management ────

export const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('reviewer_id', 'full_name profile_photo_url')
            .populate('reviewee_id', 'full_name profile_photo_url')
            .sort({ createdAt: -1 });
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ msg: "Error fetching reviews" });
    }
};
