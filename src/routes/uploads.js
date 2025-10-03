const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Ensure destination exists
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const destDir = path.join(__dirname, "..", "uploads", "carousel");
ensureDir(destDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, destDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^\w\-]+/g, "")
      .slice(0, 40);
    const uniq = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base || "image"}-${uniq}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Invalid file type: only images."));
    }
    cb(null, true);
  },
});

// POST /api/uploads/carousel  (form-data: file=<image>)
router.post("/carousel", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }
  const webPath = `/uploads/carousel/${req.file.filename}`;
  const base = `${req.protocol}://${req.get("host")}`;
  res
    .status(201)
    .json({ success: true, url: webPath, absoluteUrl: `${base}${webPath}` });
});

module.exports = router;
