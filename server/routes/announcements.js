import express from "express";
import Announcement from "../models/Announcement.js";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";
import { sendMail } from "../utils/mailer.js";
import { announcementEmail } from "../utils/emailTemplates.js";
import { notifyMany } from "../utils/notify.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const list = await Announcement.find()
    .populate("author", "name")
    .sort({ pinned: -1, createdAt: -1 });
  res.json(list);
});

router.post("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const ann = await Announcement.create({
      ...req.body,
      author: req.user.id,
    });
    const populated = await ann.populate("author", "name");

    // ✅ Real-time broadcast (Socket.io)
    req.app.get("io").emit("new-announcement", populated);

    // ✅ Get all users
    const users = await User.find().select("_id email name");

    // ✅ Create in-app notifications for all users
    const notificationData = {
      type: "announcement",
      title: ann.title,
      message: ann.body?.slice(0, 120),
      link: "/announcements",
      priority: ann.pinned ? "high" : "normal",
    };
    await notifyMany(
      users.map((u) => u._id),
      notificationData
    );

    // ✅ Real-time notify via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.emit("notification", {
        ...notificationData,
        createdAt: new Date().toISOString(),
      });
    }

    // ✅ Email every member (fire-and-forget)
    const tpl = announcementEmail(populated);
    users.forEach((u) => {
      sendMail({ to: u.email, ...tpl }).catch(() => {});
    });

    res.json(populated);
  } catch (err) {
    console.error("Announcement error:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

export default router;