import express from "express";
import Certificate from "../models/Certificate.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import Event from "../models/Event.js";
import Fundraiser from "../models/Fundraiser.js";
import { auth, requireRole } from "../middleware/auth.js";
import { notifyUser } from "../utils/notify.js";
import crypto from "crypto";

const router = express.Router();

// ============ MY PORTFOLIO ============
router.get("/me", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info
    const user = await User.findById(userId).select("-password");

    // Certificates earned
    const certificates = await Certificate.find({ user: userId })
      .populate("event", "title eventDate")
      .sort({ issuedAt: -1 });

    // Events attended (checked in)
    const tickets = await Ticket.find({
      user: userId,
      paymentStatus: "paid",
      checkedIn: true,
    })
      .populate("event", "title eventDate venue bannerColor")
      .sort({ checkedInAt: -1 });

    // Upcoming events registered for
    const upcomingTickets = await Ticket.find({
      user: userId,
      paymentStatus: "paid",
      checkedIn: false,
    })
      .populate("event", "title eventDate venue")
      .sort({ createdAt: -1 });

    // Fundraisers participated in
    const fundraisers = await Fundraiser.find({
      team: userId,
    }).select("name goal raised status tasks");

    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        memberSince: user.createdAt,
        duesPaid: user.duesPaid,
        membershipExpiry: user.membershipExpiry,
      },
      stats: {
        eventsAttended: tickets.length,
        eventsUpcoming: upcomingTickets.length,
        certificatesEarned: certificates.length,
        fundraisersJoined: fundraisers.length,
      },
      certificates,
      eventsAttended: tickets,
      eventsUpcoming: upcomingTickets,
      fundraisers,
    });
  } catch (err) {
    console.error("Portfolio error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ============ ADMIN: GET ANY USER'S PORTFOLIO ============
router.get(
  "/user/:userId",
  auth,
  requireRole("admin", "treasurer"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).select("-password");
      if (!user) return res.status(404).json({ msg: "User not found" });

      const certificates = await Certificate.find({ user: userId })
        .populate("event", "title")
        .sort({ issuedAt: -1 });

      const tickets = await Ticket.find({
        user: userId,
        paymentStatus: "paid",
        checkedIn: true,
      }).populate("event", "title eventDate");

      res.json({
        user,
        stats: {
          eventsAttended: tickets.length,
          certificatesEarned: certificates.length,
        },
        certificates,
        eventsAttended: tickets,
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

// ============ ADMIN: ISSUE CERTIFICATE ============
router.post(
  "/certificates",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        userId,
        title,
        description,
        category = "participation",
        eventId,
        eventName,
        position,
      } = req.body;

      if (!userId || !title) {
        return res.status(400).json({ msg: "User and title are required" });
      }

      const verificationCode = crypto
        .randomBytes(6)
        .toString("hex")
        .toUpperCase();

      const cert = await Certificate.create({
        user: userId,
        title,
        description,
        category,
        event: eventId,
        eventName,
        position,
        issuedBy: req.user.id,
        verificationCode,
      });

      // Notify user
      await notifyUser(userId, {
        type: "system",
        title: `🎖️ New certificate earned: ${title}`,
        message: "View it in your portfolio",
        link: "/portfolio",
        priority: "high",
      });

      const populated = await Certificate.findById(cert._id)
        .populate("user", "name email")
        .populate("event", "title");

      res.json(populated);
    } catch (err) {
      console.error("Certificate issue error:", err);
      res.status(500).json({ msg: err.message });
    }
  }
);

// ============ ADMIN: LIST ALL CERTIFICATES ============
router.get(
  "/certificates",
  auth,
  requireRole("admin"),
  async (req, res) => {
    const certs = await Certificate.find()
      .populate("user", "name email role")
      .populate("event", "title")
      .sort({ issuedAt: -1 });
    res.json(certs);
  }
);

// ============ ADMIN: DELETE CERTIFICATE ============
router.delete(
  "/certificates/:id",
  auth,
  requireRole("admin"),
  async (req, res) => {
    await Certificate.findByIdAndDelete(req.params.id);
    res.json({ msg: "Certificate deleted" });
  }
);

export default router;