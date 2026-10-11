import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const limitMessage = (message: string) => ({ success: false, message });

export const globalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: limitMessage("Too many requests. Please try again later."),
});

// Only failed attempts count, so a legitimate user isn't locked out by their own logins.
export const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: limitMessage("Too many login attempts. Please try again in 15 minutes."),
});

export const signupLimiter = rateLimit({
  windowMs: ONE_HOUR,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: limitMessage("Too many accounts created. Please try again later."),
});
