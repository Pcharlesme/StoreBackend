import { NextFunction, Request, Response } from "express";
import { MongoServerError } from "mongodb";
import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
};

// Express identifies error handlers by their 4-argument signature, so `_next` must stay.
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Unique index violation, e.g. two concurrent signups with the same email
  if (err instanceof MongoServerError && err.code === 11000) {
    return res.status(409).json({ success: false, message: "Resource already exists" });
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ success: false, message: "Malformed JSON body" });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: "Internal server error" });
};
