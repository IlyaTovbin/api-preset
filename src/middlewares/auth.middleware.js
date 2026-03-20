import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { verifyAccessToken } from "../lib/jwt.js";

function rateLimitKeyGenerator(req) {
  if (process.env.NODE_ENV === "test") {
    const testKey = req.headers["x-test-rate-limit-key"];
    if (typeof testKey === "string" && testKey.length > 0) {
      return testKey;
    }
  }

  return ipKeyGenerator(req.ip);
}

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: rateLimitKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Try again later." },
});
