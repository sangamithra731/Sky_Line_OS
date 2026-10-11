import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Reimbursement from "../models/Reimbursement.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";
import { sendMail } from "../utils/mailer.js";
import { reimbursementApprovedEmail } from "../utils/emailTemplates.js";
import { notifyUser } from "../utils/notify.js";

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

// ============ SUBMIT CLAIM (anyone) ============
router.post("/", auth, upload.single("receipt"), async (req, res) => {
  try {
    let receiptUrl = "";
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "skyline-receipts",
      });
      receiptUrl = result.secure_url;
    }

    const r = await Reimbursement.create({
      user: req.user.id,
      amount: Number(req.body.amount),
      description: req.body.description,
      receiptUrl,
    });

    // Notify treasurer(s) — unless treasurer submitted it themselves
    if (req.user.role !== "treasurer") {
      const treasurers = await User.find({ role: "treasurer" }).select("_id");
      for (const t of treasurers) {
        await notifyUser(t._id, {
          type: "reimbursement",
          title: `🧾 New claim: $${r.amount.toFixed(2)}`,
          message: `${req.user.name} · ${r.description}`,
          link: "/reimbursements",
          priority: "high",
        });
      }
    } else {
      // Treasurer submitted their own → notify admins
      const admins = await User.find({ role: "admin" }).select("_id");
      for (const a of admins) {
        await notifyUser(a._id, {
          type: "reimbursement",
          title: `🧾 Treasurer claim: $${r.amount.toFixed(2)}`,
          message: `${req.user.name} · ${r.description}`,
          link: "/reimbursements",
          priority: "high",
        });
      }
    }

    res.json(r);
  } catch (err) {
    console.error("Reimbursement error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ============ LIST CLAIMS ============
// Treasurer + Admin see all, others see only their own
router.get("/", auth, async (req, res) => {
  try {
    const canSeeAll = ["treasurer", "admin"].includes(req.user.role);
    const q = canSeeAll ? {} : { user: req.user.id };
    const list = await Reimbursement.find(q)
      .populate("user", "name email avatar role")
      .populate("reviewedBy", "name role")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ============ APPROVE / REJECT ============
// Treasurer can approve anyone EXCEPT their own claims.
// Admin can approve ONLY treasurer's claims.
router.put("/:id", auth, async (req, res) => {
  try {
    const r = await Reimbursement.findById(req.params.id)
      .populate("user", "name email role");

    if (!r) return res.status(404).json({ msg: "Claim not found" });

    const claimantRole = r.user.role;
    const reviewerRole = req.user.role;
    const isOwnClaim = r.user._id.toString() === req.user.id;

    // Permission check
    let canReview = false;

    if (reviewerRole === "treasurer") {
      // Treasurer can approve anyone's claim EXCEPT their own
      canReview = !isOwnClaim;
    } else if (reviewerRole === "admin") {
      // Admin can ONLY approve treasurer's claims
      canReview = claimantRole === "treasurer";
    }

    if (!canReview) {
      return res.status(403).json({
        msg: isOwnClaim
          ? "You cannot approve your own claim"
          : reviewerRole === "admin"
          ? "Admins can only approve the treasurer's claims. Treasurer handles the rest."
          : "Only the treasurer (or admin for treasurer's claims) can approve",
      });
    }

    r.status = req.body.status;
    r.reviewedBy = req.user.id;
    await r.save();

    if (req.body.status === "approved") {
      // Record expense transaction
      await Transaction.create({
        type: "expense",
        amount: r.amount,
        category: "reimbursement",
        description: `Reimbursement: ${r.description}`,
        user: r.user._id,
        relatedTo: r._id,
        relatedModel: "Reimbursement",
        recordedBy: req.user.id,
      });

      // Notify claimant
      await notifyUser(r.user._id, {
        type: "reimbursement",
        title: `💰 Reimbursement approved: $${r.amount.toFixed(2)}`,
        message: r.description,
        link: "/reimbursements",
      });

      // Email claimant
      sendMail({
        to: r.user.email,
        ...reimbursementApprovedEmail(r.user, r),
      }).catch(() => {});
    } else if (req.body.status === "rejected") {
      await notifyUser(r.user._id, {
        type: "reimbursement",
        title: `❌ Reimbursement rejected`,
        message: `${r.description} · $${r.amount.toFixed(2)}`,
        link: "/reimbursements",
      });
    }

    const populated = await Reimbursement.findById(r._id)
      .populate("user", "name email avatar role")
      .populate("reviewedBy", "name role");

    res.json(populated);
  } catch (err) {
    console.error("Reimbursement review error:", err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;