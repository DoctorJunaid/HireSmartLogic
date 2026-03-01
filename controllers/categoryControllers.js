import Category from "../models/Category.js";

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public or Private (can be used by anyone to browse)
export const getCategoriesController = async (req, res) => {
    try {
        const categories = await Category.find({ is_active: true }).sort({ name: 1 });

        res.status(200).json({
            isStatus: true,
            msg: "Categories fetched successfully",
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};

// @desc    Create a category (Admin only typically, but we'll leave it open for seeding)
// @route   POST /api/categories
// @access  Private
export const createCategoryController = async (req, res) => {
    try {
        const { name, icon_url, description, base_price_guideline } = req.body;

        if (!name || !icon_url) {
            return res.status(400).json({ isStatus: false, msg: "Name and icon_url are required" });
        }

        const categoryExists = await Category.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ isStatus: false, msg: "Category already exists" });
        }

        const category = await Category.create({
            name,
            icon_url,
            description,
            base_price_guideline
        });

        res.status(201).json({
            isStatus: true,
            msg: "Category created",
            data: category
        });
    } catch (error) {
        res.status(500).json({
            isStatus: false,
            msg: error.message || "Server Error"
        });
    }
};

// @desc    Seed demo categories instantly
// @route   POST /api/categories/seed
// @access  Public (for demo purposes)
export const seedCategoriesController = async (req, res) => {
    try {
        const demoCategories = [
            {
                name: "Cleaning",
                icon_url: "https://cdn-icons-png.flaticon.com/512/2625/2625128.png",
                description: "Home & Office Cleaning",
                base_price_guideline: 1500
            },
            {
                name: "Plumbing",
                icon_url: "https://cdn-icons-png.flaticon.com/512/2859/2859068.png",
                description: "Pipe fixing & replacements",
                base_price_guideline: 2000
            },
            {
                name: "AC Repair",
                icon_url: "https://cdn-icons-png.flaticon.com/512/1066/1066373.png",
                description: "AC installation and gas refill",
                base_price_guideline: 3000
            },
            {
                name: "Carpenter",
                icon_url: "https://cdn-icons-png.flaticon.com/512/1004/1004273.png",
                description: "Woodwork and furniture fixing",
                base_price_guideline: 2500
            }
        ];

        // Clear existing to avoid duplicates if tapped multiple times
        await Category.deleteMany({});
        const inserted = await Category.insertMany(demoCategories);

        res.status(201).json({ isStatus: true, data: inserted, msg: 'Demo categories seeded successfully' });
    } catch (error) {
        res.status(500).json({ isStatus: false, msg: error.message || "Server error while seeding" });
    }
};
