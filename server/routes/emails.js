import express from "express";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";
import { sendMail } from "../utils/mailer.js";
import { customEmailTemplate } from "../utils/emailTemplates.js";
import { notifyMany } from "../utils/notify.js";

const router = express.Router();

router.post("/send", auth, requireRole("admin"), async (req, res) => {
  try {
    const { mode, roles, userIds, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ msg: "Subject and message are required" });
    }

    let recipients = [];

    if (mode === "everyone") {
      recipients = await User.find().select("_id name email");
    } else if (mode === "role") {
      if (!roles || roles.length === 0) {
        return res.status(400).json({ msg: "Select at least one role" });
      }
      recipients = await User.find({ role: { $in: roles } }).select("_id name email");
    } else if (mode === "selected") {
      if (!userIds || userIds.length === 0) {
        return res.status(400).json({ msg: "Select at least one recipient" });
      }
      recipients = await User.find({ _id: { $in: userIds } }).select("_id name email");
    } else {
      return res.status(400).json({ msg: "Invalid mode" });
    }

    recipients = recipients.filter((r) => r._id.toString() !== req.user.id);

    if (recipients.length === 0) {
      return res.status(400).json({ msg: "No recipients found" });
    }

    const template = customEmailTemplate({
      subject,
      message,
      senderName: req.user.name,
    });

    let sent = 0;
    for (const r of recipients) {
      const result = await sendMail({
        to: r.email,
        subject: template.subject,
        html: template.html,
      });
      if (result.success) sent++;
    }

    await notifyMany(
      recipients.map((r) => r._id),
      {
        type: "announcement",
        title: `📧 ${subject}`,
        message: message.slice(0, 120),
        link: "/",
        priority: "normal",
      }
    );

    const io = req.app.get("io");
    if (io) {
      io.emit("notification", {
        type: "announcement",
        title: `📧 ${subject}`,
        message: message.slice(0, 120),
      });
    }

    res.json({
      msg: `✅ Sent to ${sent} of ${recipients.length} recipients`,
      sent,
      total: recipients.length,
    });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.post("/preview", auth, requireRole("admin"), async (req, res) => {
  try {
    const { mode, roles, userIds } = req.body;
    let recipients = [];

    if (mode === "everyone") {
      recipients = await User.find().select("_id name email role avatar").sort({ name: 1 });
    } else if (mode === "role") {
      recipients = await User.find({ role: { $in: roles || [] } })
        .select("_id name email role avatar")
        .sort({ name: 1 });
    } else if (mode === "selected") {
      recipients = await User.find({ _id: { $in: userIds || [] } })
        .select("_id name email role avatar")
        .sort({ name: 1 });
    }

    recipients = recipients.filter((r) => r._id.toString() !== req.user.id);

    res.json({ recipients, count: recipients.length });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;