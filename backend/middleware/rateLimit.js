const WINDOW_MS = 60 * 1000;

const DEFAULTS = {
  max: 30,
  windowMs: WINDOW_MS,
};

const buckets = new Map();

function getBucket(key) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing) {
    const bucket = { count: 1, resetAt: now + DEFAULTS.windowMs };
    buckets.set(key, bucket);
    return bucket;
  }

  if (now > existing.resetAt) {
    existing.count = 1;
    existing.resetAt = now + DEFAULTS.windowMs;
    return existing;
  }

  return existing;
}

function rateLimit({ max = 30, windowMs = WINDOW_MS } = {}) {
  return function rateLimitMiddleware(req, res, next) {
    try {
      const ip = req.ip || req.connection?.remoteAddress || "unknown";
      const routeKey = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
      const method = req.method;
      const key = `${ip}:${method}:${routeKey}`;

      const bucket = getBucket(key);

      if (bucket.resetAt - Date.now() > windowMs) {
        bucket.resetAt = Date.now() + windowMs;
      }
      if (bucket.resetAt - Date.now() <= 0) {
        bucket.count = 1;
        bucket.resetAt = Date.now() + windowMs;
      }

      bucket.count += 1;

      if (bucket.count > max) {
        res.status(429).json({ error: "You are being ratelimited" });
        return;
      }

      next();
    } catch (err) {
      next();
    }
  };
}

module.exports = {
  rateLimit,
};

