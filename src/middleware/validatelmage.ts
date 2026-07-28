import multer from "multer";

const Multer = multer();
const ValidateImage = <T>(image: T) => {
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });
  upload.array("images", 6);
};
