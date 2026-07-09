import rateLimit from "express-rate-limit";
import { success } from "zod";

export const LoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: true,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
});

export const GlobalLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: {
    success: false,
    message: "Too many request attempts try again in 15 minites ",
  },
});
