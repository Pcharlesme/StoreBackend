// import multer from "multer";

// const allowedMimeTypes = new Set([
//   "image/jpeg",
//   "image/png",
//   "image/webp",
// ]);

// export const upload = multer({
//   storage: multer.memoryStorage(), // Explicitly use memory storage
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5 MB
//     files: 1,                  // Optional: allow only one file
//   },
//   fileFilter(req, file, cb) {
//     if (!allowedMimeTypes.has(file.mimetype)) {
//       return cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
//     }

//     cb(null, true);
//   },
// });