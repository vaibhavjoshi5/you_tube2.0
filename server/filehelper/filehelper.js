"use strict";
import multer from "multer";

const MAX_VIDEO_SIZE = 4 * 1024 * 1024;
const storage = multer.memoryStorage();

const filefilter = (req, file, cb) => {
  if (file.mimetype === "video/mp4") {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
  }
};

const upload = multer({
  storage,
  fileFilter: filefilter,
  limits: { fileSize: MAX_VIDEO_SIZE, files: 1 },
});

export default upload;
