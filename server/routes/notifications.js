import express from "express";
import Notification from "../models/Notification.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get my notifications
router.get("/", auth, async (req, res) => {
  const list = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20);
  const unread = await Notification.countDocuments({
    user: req.user.id,
    read: false,
  });
  res.json({ notifications: list, unread });
});

// Unread count only (lightweight for polling)
router.get("/unread", auth, async (req, res) => {
  const unread = await Notification.countDocuments({
    user: req.user.id,
    read: false,
  });
  res.json({ unread });
});

// Mark one as read
router.put("/:id/read", auth, async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { read: true },
    { new: true }
  );
  res.json(n);
});

// Mark all as read
router.put("/read-all", auth, async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, read: false },
    { read: true }
  );
  res.json({ msg: "All marked as read" });
});

// Clear all
router.delete("/clear", auth, async (req, res) => {
  await Notification.deleteMany({ user: req.user.id });
  res.json({ msg: "Cleared" });
});

export default router;