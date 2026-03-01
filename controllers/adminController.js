import User from '../models/User.js';
import Order from '../models/Order.js';
import Job from '../models/Job.js';
import Verification from '../models/Verification.js';

export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const totalWorkers = await User.countDocuments({ role: 'worker' });

        const totalJobs = await Job.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Calculate rough revenue (assuming orders have total_amount and status)
        const completedOrders = await Order.find({ status: 'completed' });
        const totalRevenue = completedOrders.reduce((acc, order) => acc + (order.total_amount || 0), 0);

        // Get recent activity (newest users, orders, etc.)
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

        res.status(200).json({
            stats: {
                totalUsers,
                totalCustomers,
                totalWorkers,
                totalJobs,
                totalOrders,
                totalRevenue
            },
            recentUsers
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

export const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find().populate('customer', 'full_name email').sort({ createdAt: -1 });
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
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ msg: "Error fetching orders" });
    }
};

export const getVerifications = async (req, res) => {
    try {
        const verifications = await Verification.find().populate('worker_id', 'full_name email');
        res.status(200).json(verifications);
    } catch (error) {
        res.status(500).json({ msg: "Error fetching verifications" });
    }
};
