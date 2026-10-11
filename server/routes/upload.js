import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "../middleware/auth.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

router.post("/image", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("Upload: no file in request");
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const folder = req.body.folder || "skyline";
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;

    console.log("Uploading to Cloudinary folder:", folder);
    const result = await cloudinary.uploader.upload(dataUri, { folder });
    console.log("Upload success:", result.secure_url);

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;
