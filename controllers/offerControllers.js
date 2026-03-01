import Offer from "../models/Offer.js";
import Job from "../models/Job.js";
import Order from "../models/Order.js";

// @desc    Worker makes an offer on a job
// @route   POST /api/offers
// @access  Private (Workers only)
export const createOfferController = async (req, res) => {
    try {
        if (req.user.role !== "worker") {
            return res.status(403).json({ isStatus: false, msg: "Only workers can make offers" });
        }

        const { job_id, offered_price, inspection_type, inspection_fee, cover_note } = req.body;

        if (!job_id || !offered_price) {
            return res.status(400).json({ isStatus: false, msg: "job_id and offered_price are required" });
        }

        // Ensure Job exists and is open
        const job = await Job.findById(job_id);
        if (!job) {
            return res.status(404).json({ isStatus: false, msg: "Job not found" });
        }
        if (job.status !== "open") {
            return res.status(400).json({ isStatus: false, msg: "Job is no longer open for offers" });
        }

        // Ensure worker hasn't already applied
        const existingOffer = await Offer.findOne({ job_id, worker_id: req.user.id });
        if (existingOffer) {
            return res.status(400).json({ isStatus: false, msg: "You have already made an offer on this job" });
        }

        const offer = await Offer.create({
            job_id,
            worker_id: req.user.id,
            offered_price,
            inspection_type,
            inspection_fee: inspection_fee || 0,
            cover_note: cover_note || ""
        });

        res.status(201).json({
            isStatus: true,
            msg: "Offer submitted successfully",
            data: offer
        });
    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};

// @desc    Get all offers for a specific job (Customer view)
// @route   GET /api/offers/job/:jobId
// @access  Private (Customer who owns the job)
export const getJobOffersController = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ isStatus: false, msg: "Job not found" });
        }

        if (job.customer_id.toString() !== req.user.id) {
            return res.status(403).json({ isStatus: false, msg: "You can only view offers for your own jobs" });
        }

        const offers = await Offer.find({ job_id: req.params.jobId })
            .populate("worker_id", "full_name profile_photo_url rating_sum rating_count phone_number")
            .sort({ createdAt: -1 });

        res.status(200).json({
            isStatus: true,
            msg: "Offers fetched successfully",
            data: offers
        });
    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};

// @desc    Get all offers made by the logged-in worker
// @route   GET /api/offers/my-offers
// @access  Private (Workers only)
export const getMyOffersController = async (req, res) => {
    try {
        if (req.user.role !== "worker") {
            return res.status(403).json({ isStatus: false, msg: "Only workers have an offers history" });
        }

        const offers = await Offer.find({ worker_id: req.user.id })
            .populate({
                path: "job_id",
                populate: { path: "category_id", select: "name icon_url" }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            isStatus: true,
            msg: "My offers fetched",
            data: offers
        });
    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};

// @desc    Customer accepts an offer (Creates Order, closes Job)
// @route   PATCH /api/offers/:id/accept
// @access  Private (Customers only)
export const acceptOfferController = async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ isStatus: false, msg: "Only customers can accept offers" });
        }

        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ isStatus: false, msg: "Offer not found" });
        }

        const job = await Job.findById(offer.job_id);
        if (!job) {
            return res.status(404).json({ isStatus: false, msg: "Job not found" });
        }

        if (job.customer_id.toString() !== req.user.id) {
            return res.status(403).json({ isStatus: false, msg: "You do not own this job" });
        }

        if (job.status !== "open") {
            return res.status(400).json({ isStatus: false, msg: "Job is already closed or assigned" });
        }

        // 1. Update the accepted offer
        offer.status = "accepted";
        await offer.save();

        // 2. Reject all other offers for this job
        await Offer.updateMany(
            { job_id: job._id, _id: { $ne: offer._id } },
            { $set: { status: "rejected" } }
        );

        // 3. Update Job
        job.status = "in_progress";
        job.assigned_worker_id = offer.worker_id;
        job.final_agreed_price = offer.offered_price;
        await job.save();

        // 4. Create Order
        const order = await Order.create({
            job_id: job._id,
            customer_id: job.customer_id,
            worker_id: offer.worker_id,
            status: "active",
            total_price: offer.offered_price
        });

        res.status(200).json({
            isStatus: true,
            msg: "Offer accepted successfully. Order created.",
            data: { offer, order, job }
        });
    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};
