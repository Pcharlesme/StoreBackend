import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HttpError } from "../utils/httpError";

export const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Files stay in memory and are streamed straight to S3, never written to disk.
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: MAX_IMAGES,
    fields: 20,
    fieldSize: 10 * 1024,
  },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(HttpError.badRequest("Only JPEG, PNG and WebP images are allowed"));
    }
    cb(null, true);
  },
}).array("images", MAX_IMAGES);

export const requireImages = (req: Request, _res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    throw HttpError.badRequest("At least one image is required");
  }
  next();
};
