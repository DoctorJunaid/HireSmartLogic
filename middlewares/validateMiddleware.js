export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        return res.status(400).json({
            isStatus: false,
            msg: error.errors ? error.errors[0].message : "Validation Error",
            errors: error.errors,
        });
    }
};
