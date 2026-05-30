const WINDOW_MS = 60 * 1000;

const DEFAULTS = {
  max: 30,
  windowMs: WINDOW_MS,
};

const buckets = new Map();

function getBucket(key, windowMs) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return bucket;
  }

  if (now > existing.resetAt) {
    existing.count = 1;
    existing.resetAt = now + windowMs;
    return existing;
  }

  return existing;
}

/**
 * @param {object} opts
 * @param {number} opts.max
 * @param {number} opts.windowMs
 * @param {(req: import('express').Request) => string} [opts.keyGenerator]
 */
function rateLimit({ max = 30, windowMs = WINDOW_MS, keyGenerator } = {}) {
  return function rateLimitMiddleware(req, res, next) {
    try {
      const routeKey = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
      const method = req.method;

      const fallbackIp = req.ip || req.connection?.remoteAddress || "unknown";
      const keyPart = typeof keyGenerator === "function" ? keyGenerator(req) : fallbackIp;
      const key = `${keyPart}:${method}:${routeKey}`;

      const bucket = getBucket(key, windowMs);

      bucket.count += 1;


      if (bucket.count > max) {
        res.status(429).json({
          error: "You are being ratelimited",
          retryAfterMs: Math.max(0, bucket.resetAt - Date.now()),
        });
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


