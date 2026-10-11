import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import Transaction from "../models/Transaction.js";
import Fundraiser from "../models/Fundraiser.js";
import { auth, requireRole } from "../middleware/auth.js";
import { sendMail } from "../utils/mailer.js";
import {
  welcomeEmail,
  renewalReminderEmail,
  loginNotificationEmail,
  duesPaidEmail,
  newMemberAlertEmail,
  roleChangedEmail,
  eventReminderEmail,
  monthlyDigestEmail,
  passwordResetEmail,
  duesReminderEmail,
} from "../utils/emailTemplates.js";
import { notifyMany } from "../utils/notify.js";

const router = express.Router();
const DEFAULT_DUES_AMOUNT = 500;

const sign = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// ============ REGISTER (public) ============
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "member" } = req.body;

    const allowedRoles = ["member", "volunteer"];
    const safeRole = allowedRoles.includes(role.toLowerCase())
      ? role.toLowerCase()
      : "member";

    if (await User.findOne({ email }))
      return res.status(400).json({ msg: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: safeRole,
    });

    sendMail({ to: email, ...welcomeEmail(user) }).catch((e) =>
      console.error("Welcome email failed:", e.message)
    );

    User.find({ role: "admin" })
      .select("email name")
      .then((admins) => {
        admins.forEach((admin) => {
          if (admin.email !== email) {
            sendMail({
              to: admin.email,
              ...newMemberAlertEmail(admin, user),
            }).catch(() => {});
          }
        });
      });

    res.json({
      token: sign(user),
      user: { ...user._doc, password: undefined },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ============ ADMIN CREATE (with role, dues, transaction) ============
router.post("/admin-create", auth, requireRole("admin"), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "member",
      duesPaid = false,
      duesAmount,
    } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ msg: "Name, email, and password are required" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const allowedRoles = ["member", "volunteer", "treasurer", "admin"];
    const safeRole = allowedRoles.includes(role.toLowerCase())
      ? role.toLowerCase()
      : "member";

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: safeRole,
      duesPaid,
      membershipStatus: duesPaid ? "active" : "pending",
      membershipExpiry: duesPaid
        ? new Date(Date.now() + 365 * 86400000)
        : undefined,
    });

    if (duesPaid) {
      const amount = Number(duesAmount) || DEFAULT_DUES_AMOUNT;
      await Transaction.create({
        type: "income",
        amount,
        category: "dues",
        description: `Dues paid by ${user.name}`,
        user: user._id,
        recordedBy: req.user.id,
      });
    }

    sendMail({ to: email, ...welcomeEmail(user) }).catch((e) =>
      console.error("Welcome email failed:", e.message)
    );

    res.json({
      msg: `Account created for ${user.name} as ${user.role}`,
      user: { ...user._doc, password: undefined },
    });
  } catch (err) {
    console.error("Admin create error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ============ LOGIN ============
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ msg: "Email, password, and role are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "No account found with this email" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ msg: "Incorrect password" });
    }

    if (user.role !== role.toLowerCase()) {
      return res.status(403).json({
        msg: `This email is registered as "${user.role}", not "${role}". Please select the correct role.`,
      });
    }

    sendMail({ to: email, ...loginNotificationEmail(user) }).catch((e) =>
      console.error("Login email failed:", e.message)
    );

    res.json({
      token: sign(user),
      user: { ...user._doc, password: undefined },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ============ ME ============
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

// ============ UPDATE PROFILE ============
router.put("/me", auth, async (req, res) => {
  try {
    const allowed = [
      "name",
      "phone",
      "avatar",
      "bio",
      "studentId",
      "upiId",
      "paymentPhone",
      "paymentNote",
    ];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ============ LIST MEMBERS ============
router.get("/members", auth, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// ============ PAYMENT INFO ============
router.get("/payment-info", auth, async (req, res) => {
  try {
    const admin = await User.findOne({
      role: "admin",
      upiId: { $exists: true, $ne: "" },
    }).select("upiId paymentPhone paymentNote name");

    res.json(
      admin || {
        upiId: "",
        paymentPhone: "",
        paymentNote: "Contact club admin for payment details",
        name: "Admin",
      }
    );
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ============ MARK DUES PAID ============
router.put(
  "/:id/dues",
  auth,
  requireRole("admin", "treasurer"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          duesPaid: true,
          membershipStatus: "active",
          membershipExpiry: new Date(Date.now() + 365 * 86400000),
        },
        { new: true }
      ).select("-password");

      if (!user) return res.status(404).json({ msg: "User not found" });

      const amount = Number(req.body.amount) || DEFAULT_DUES_AMOUNT;
      await Transaction.create({
        type: "income",
        amount,
        category: "dues",
        description: `Dues paid by ${user.name}`,
        user: user._id,
        recordedBy: req.user.id,
      });

      if (user.email) {
        sendMail({ to: user.email, ...duesPaidEmail(user) }).catch((e) =>
          console.error("Dues email failed:", e.message)
        );
      }

      res.json(user);
    } catch (err) {
      console.error("Dues error:", err);
      res.status(500).json({ msg: err.message });
    }
  }
);

// ============ CHANGE ROLE ============
router.put("/:id/role", auth, requireRole("admin"), async (req, res) => {
  const before = await User.findById(req.params.id);
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true }
  ).select("-password");

  if (before && before.role !== req.body.role && user) {
    sendMail({
      to: user.email,
      ...roleChangedEmail(user, before.role, req.body.role),
    }).catch(() => {});
  }

  res.json(user);
});

// ============ DELETE USER ============
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ msg: "You cannot delete your own account" });
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ msg: "User deleted" });
});

// ============ FORGOT PASSWORD (public) ============
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        msg: "If an account exists with this email, a reset link has been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = null;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    sendMail({
      to: user.email,
      ...passwordResetEmail(user, resetUrl),
    }).catch((e) => console.error("Reset email failed:", e.message));

    res.json({
      msg: "If an account exists with this email, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ============ RESET PASSWORD (public) ============
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ resetToken: token });
    if (!user) {
      return res.status(400).json({ msg: "Invalid reset link" });
    }

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ msg: "✅ Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ============ CHANGE PASSWORD (logged-in user) ============
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: "Both passwords are required" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ msg: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ msg: "✅ Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ============ ADMIN RESET ============
router.post(
  "/admin-reset/:userId",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ msg: "User not found" });

      const token = crypto.randomBytes(32).toString("hex");
      user.resetToken = token;
      user.resetTokenExpires = null;
      await user.save();

      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
      sendMail({
        to: user.email,
        ...passwordResetEmail(user, resetUrl),
      }).catch(() => {});

      res.json({
        msg: `✅ Reset link sent to ${user.email}`,
        resetUrl,
      });
    } catch (err) {
      console.error("Admin reset error:", err);
      res.status(500).json({ msg: err.message });
    }
  }
);

// ============ MANUAL: RENEWAL REMINDERS ============
router.post(
  "/test-reminders",
  auth,
  requireRole("admin"),
  async (req, res) => {
    const in30 = new Date(Date.now() + 30 * 86400000);
    const expiring = await User.find({
      membershipExpiry: { $lte: in30, $gte: new Date() },
    });
    let sent = 0;
    for (const u of expiring) {
      const r = await sendMail({ to: u.email, ...renewalReminderEmail(u) });
      if (r.success) sent++;
    }
    res.json({ sent, total: expiring.length });
  }
);

// ============ MANUAL: EVENT REMINDERS ============
router.post(
  "/test-event-reminders",
  auth,
  requireRole("admin"),
  async (req, res) => {
    const now = new Date();
    const in24 = new Date(now.getTime() + 24 * 3600 * 1000);
    const events = await Event.find({ eventDate: { $gte: now, $lte: in24 } });
    let sent = 0;
    for (const event of events) {
      const tickets = await Ticket.find({ event: event._id }).populate(
        "user",
        "name email"
      );
      for (const t of tickets) {
        if (t.user?.email) {
          await sendMail({
            to: t.user.email,
            ...eventReminderEmail(t.user, event, t),
          });
          sent++;
        }
      }
    }
    res.json({ sent, events: events.length });
  }
);

// ============ MANUAL: MONTHLY DIGEST ============
router.post("/test-digest", auth, requireRole("admin"), async (req, res) => {
  const monthAgo = new Date(Date.now() - 30 * 86400000);
  const newMembers = await User.countDocuments({
    createdAt: { $gte: monthAgo },
  });
  const totalMembers = await User.countDocuments();
  const upcomingEvents = await Event.find({
    eventDate: { $gte: new Date() },
  }).limit(5);
  const activeFundraisers = await Fundraiser.countDocuments({
    status: "active",
  });

  const stats = { newMembers, totalMembers, upcomingEvents, activeFundraisers };
  const users = await User.find().select("email name");

  let sent = 0;
  for (const u of users) {
    const r = await sendMail({ to: u.email, ...monthlyDigestEmail(u, stats) });
    if (r.success) sent++;
  }
  res.json({ sent, total: users.length });
});

// ============ SEND DUES REMINDERS ============
router.post(
  "/send-dues-reminders",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const unpaidUsers = await User.find({
        duesPaid: false,
        role: { $in: ["member", "volunteer"] },
        email: { $exists: true, $ne: "" },
      }).select("_id name email role");

      if (unpaidUsers.length === 0) {
        return res.json({ sent: 0, message: "Everyone has paid 🎉" });
      }

      const amount = req.body.amount || 500;
      const deadline = req.body.deadline || null;

      let sent = 0;
      let failed = 0;

      for (const user of unpaidUsers) {
        try {
          await sendMail({
            to: user.email,
            ...duesReminderEmail(user, amount, deadline),
          });
          sent++;
        } catch (err) {
          console.error(`Failed to email ${user.email}:`, err.message);
          failed++;
        }
      }

      await User.updateMany(
        { _id: { $in: unpaidUsers.map((u) => u._id) } },
        { lastDuesReminderAt: new Date() }
      );

      await notifyMany(
        unpaidUsers.map((u) => u._id),
        {
          type: "payment",
          title: "💰 Dues reminder",
          message: `Please pay your $${amount} club dues. Contact admin to settle.`,
          link: "/profile",
          priority: "high",
        }
      );

      res.json({
        sent,
        failed,
        total: unpaidUsers.length,
        message: `✅ Sent ${sent} reminder${sent !== 1 ? "s" : ""}`,
      });
    } catch (err) {
      console.error("Dues reminder error:", err);
      res.status(500).json({ msg: err.message });
    }
  }
);

// ============ GET UNPAID USERS ============
router.get(
  "/unpaid-dues",
  auth,
  requireRole("admin", "treasurer"),
  async (req, res) => {
    const unpaid = await User.find({
      duesPaid: false,
      role: { $in: ["member", "volunteer"] },
    })
      .select("name email role createdAt phone")
      .sort({ createdAt: 1 });

    res.json({
      users: unpaid,
      count: unpaid.length,
    });
  }
);

export default router;