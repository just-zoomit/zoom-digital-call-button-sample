import { RateLimiterMemory } from "rate-limiter-flexible";

const limiter = new RateLimiterMemory({
  points: 20,  // 20 requests
  duration: 60 // per 60 seconds
});

export function rateLimit(req, res, next) {
  const key = req.ip || "unknown";

  limiter.consume(key)
    .then(() => next())
    .catch(() => {
      res.status(429).json({ error: "Too many requests" });
    });
}

