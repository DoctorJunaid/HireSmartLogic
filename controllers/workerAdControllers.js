import WorkerAd from "../models/WorkerAd.js";

// Worker posts a new service advertisement
const createWorkerAdController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { category_ids, title, description, experience_years, location_address, price_range, photos } = req.body;

        if (!category_ids || !Array.isArray(category_ids) || category_ids.length === 0 || !title || !description || !experience_years || !location_address || !price_range) {
            return res.status(400).json({ isStatus: false, msg: "Missing required advertisement fields. Select at least one category." });
        }

        const workerAd = new WorkerAd({
            worker_id: userId,
            category_ids,
            title,
            description,
            experience_years,
            location_address,
            price_range,
            photos
        });

        await workerAd.save();

        res.status(201).json({
            isStatus: true,
            msg: "Advertisement posted successfully",
            data: workerAd
        });
    } catch (error) {
        res.status(500).json({ isStatus: false, msg: error.message });
    }
};

// Worker sees their own advertisements
const getMyAdsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const ads = await WorkerAd.find({ worker_id: userId }).populate("category_ids", "name");

        res.status(200).json({
            isStatus: true,
            data: ads
        });
    } catch (error) {
        res.status(500).json({ isStatus: false, msg: error.message });
    }
};

// Generic browse for advertisements (Customer Screen)
const getWorkerAdsController = async (req, res) => {
    try {
        const { category_id } = req.query;
        const filter = { status: "active" };
        if (category_id) filter.category_ids = category_id; // Mongo can filter array for single element

        const ads = await WorkerAd.find(filter)
            .populate("worker_id", "full_name profile_photo_url rating_sum rating_count")
            .populate("category_ids", "name")
            .sort("-createdAt");

        res.status(200).json({
            isStatus: true,
            data: ads
        });
    } catch (error) {
        res.status(500).json({ isStatus: false, msg: error.message });
    }
};

export {
    createWorkerAdController,
    getMyAdsController,
    getWorkerAdsController
};
