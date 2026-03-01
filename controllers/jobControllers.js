import Job from "../models/Job.js";
import User from "../models/User.js";
import Offer from "../models/Offer.js";

// @desc    Customer creates a new job
// @route   POST /api/jobs
// @access  Private (Customers only)
export const createJobController = async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ isStatus: false, msg: "Only customers can post jobs" });
        }

        const {
            title,
            description,
            job_type,
            location_address,
            latitude,
            longitude,
            pricing_mode,
            initial_budget,
            is_emergency,
            category_id,
            photos,
            voice_note_url
        } = req.body;

        if (!title || !job_type || !location_address || !pricing_mode || !category_id) {
            return res.status(400).json({ isStatus: false, msg: "Missing required fields" });
        }

        const jobData = {
            customer_id: req.user.id,
            title,
            description,
            job_type,
            location_address,
            pricing_mode,
            category_id,
            photos: photos || [],
            voice_note_url: voice_note_url || null,
            is_emergency: is_emergency || false
        };

        if (pricing_mode === "fixed" && initial_budget) {
            jobData.initial_budget = initial_budget;
        }

        if (latitude && longitude) {
            jobData.location = {
                type: "Point",
                coordinates: [longitude, latitude] // GeoJSON is [lng, lat]
            };
        }

        const job = await Job.create(jobData);

        res.status(201).json({
            isStatus: true,
            msg: "Job posted successfully",
            data: job
        });
    } catch (error) {
        console.error("Create Job Error:", error);
        res.status(500).json({
            isStatus: false,
            msg: process.env.NODE_ENV === "development" ? error.message : "An unexpected server error occurred. Please try again."
        });
    }
};

// @desc    Worker explores open jobs (feed)
// @route   GET /api/jobs
// @access  Private (Workers only)
export const getExploreJobsController = async (req, res) => {
    try {
        if (req.user.role !== "worker") {
            return res.status(403).json({ isStatus: false, msg: "Only workers can explore jobs" });
        }

        // In the future: Add geospatial querying and category filtering based on req.query
        const { category_id } = req.query;

        let filter = { status: "open" };
        if (category_id) filter.category_id = category_id;

        const jobs = await Job.find(filter)
            .populate("customer_id", "full_name profile_photo_url rating_sum rating_count")
            .populate("category_id", "name icon_url")
            .sort({ createdAt: -1 });

        res.status(200).json({
            isStatus: true,
            msg: "Jobs fetched successfully",
            data: jobs
        });
    } catch (error) {
        console.error("Get Explore Jobs Error:", error);
        res.status(500).json({
            isStatus: false,
            msg: process.env.NODE_ENV === "development" ? error.message : "An unexpected server error occurred. Please try again."
        });
    }
};

// @desc    Customer gets their own posted jobs
// @route   GET /api/jobs/my-jobs
// @access  Private (Customers only)
export const getMyJobsController = async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ isStatus: false, msg: "Only customers can view their jobs" });
        }

        const jobs = await Job.find({ customer_id: req.user.id })
            .populate("category_id", "name icon_url")
            .populate("assigned_worker_id", "full_name profile_photo_url phone_number")
            .sort({ createdAt: -1 });

        res.status(200).json({
            isStatus: true,
            msg: "My jobs fetched successfully",
            data: jobs
        });
    } catch (error) {
        console.error("Get My Jobs Error:", error);
        res.status(500).json({
            isStatus: false,
            msg: process.env.NODE_ENV === "development" ? error.message : "An unexpected server error occurred. Please try again."
        });
    }
};

// @desc    Get specific job details
// @route   GET /api/jobs/:id
// @access  Private
export const getJobDetailsController = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate("customer_id", "full_name profile_photo_url rating_sum rating_count")
            .populate("category_id", "name icon_url")
            .populate("assigned_worker_id", "full_name profile_photo_url phone_number");

        if (!job) {
            return res.status(404).json({ isStatus: false, msg: "Job not found" });
        }

        let metadata = {};
        if (req.user.role === "worker") {
            const offer = await Offer.findOne({ job_id: job._id, worker_id: req.user.id });
            if (offer) {
                metadata.has_offered = true;
                metadata.offer_id = offer._id;
                metadata.offer_status = offer.status;
            } else {
                metadata.has_offered = false;
            }
        }

        res.status(200).json({
            isStatus: true,
            msg: "Job details fetched",
            data: job,
            metadata
        });
    } catch (error) {
        console.error("Get Job Details Error:", error);
        res.status(500).json({
            isStatus: false,
            msg: process.env.NODE_ENV === "development" ? error.message : "An unexpected server error occurred. Please try again."
        });
    }
};
