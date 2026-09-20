const store = new Map();

export function rateLimit({ key, windowMs = 60_000, maxRequests = 20 }) {
  const now = Date.now();
  const bucket = store.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  store.set(key, bucket);

  if (bucket.count > maxRequests) {
    const error = new Error("Too many requests. Please try again later.");
    error.code = "RATE_LIMITED";
    throw error;
  }
}
