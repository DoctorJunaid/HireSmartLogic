// Simple in-memory rate limiter for OTP routes
// In a multi-instance production environment, use Redis + express-rate-limit

const rateLimitStore = new Map();

export const otpRateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes window
    const maxRequests = 5; // Max 5 allowed requests per window

    if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, {
            count: 1,
            resetTime: now + windowMs
        });
        return next();
    }

    const record = rateLimitStore.get(ip);

    // If window has passed, reset
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        return next();
    }

    // If within window and exceeds limit
    if (record.count >= maxRequests) {
        return res.status(429).json({
            isStatus: false,
            msg: "Too many requests from this IP. Please try again after 15 minutes."
        });
    }

    // Increment count
    record.count += 1;
    next();
};
