/**
 * Authentication Middleware (Skeleton)
 * Validates JWT tokens for API routes in a production environment.
 */
function protect(req, res, next) {
    // In a fully productionized setup with actual user accounts:
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token) return res.status(401).json({ error: 'Not authorized' });
    // try {
    //     req.user = jwt.verify(token, process.env.JWT_SECRET);
    //     next();
    // } catch (e) {
    //     res.status(401).json({ error: 'Token failed' });
    // }

    // For the current desktop IDE setup, we pass through.
    next();
}

/**
 * Basic Rate Limiter (Memory based skeleton)
 */
const requests = new Map();
function rateLimit(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 30;

    if (!requests.has(ip)) {
        requests.set(ip, []);
    }

    const history = requests.get(ip).filter(time => now - time < windowMs);
    history.push(now);
    requests.set(ip, history);

    if (history.length > maxRequests) {
        return res.status(429).json({ error: 'Too many requests, slow down.' });
    }

    next();
}

module.exports = {
    protect,
    rateLimit
};
