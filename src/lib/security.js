import mongoose from "mongoose";

const rateLimitBuckets = new Map();

export function validateObjectId(value) {
  if (!value || !mongoose.Types.ObjectId.isValid(String(value))) {
    const error = new Error("Invalid resource identifier.");
    error.code = "INVALID_ID";
    throw error;
  }
  return String(value);
}

export function sanitizeAllowedFields(input = {}, allowedKeys = []) {
  if (!input || typeof input !== "object") return {};
  const sanitized = {};
  for (const key of allowedKeys) {
    if (input[key] !== undefined) sanitized[key] = input[key];
  }
  return sanitized;
}

export function rateLimit({ key, max = 10, windowMs = 60_000 }) {
  const storeKey = `rl:${key}`;
  const now = Date.now();
  const bucket = rateLimitBuckets.get(storeKey) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  rateLimitBuckets.set(storeKey, bucket);
  if (bucket.count > max) {
    const error = new Error("Too many requests. Please try again later.");
    error.code = "RATE_LIMITED";
    throw error;
  }
}
