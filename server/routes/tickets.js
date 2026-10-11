import express from "express";
import QRCode from "qrcode";
import Ticket from "../models/Ticket.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { auth, requireRole } from "../middleware/auth.js";
import { sendMail } from "../utils/mailer.js";
import { ticketReceiptEmail, ticketRefundEmail } from "../utils/emailTemplates.js";

const router = express.Router();

// Helper: short reference id
const makeRefId = () =>
  "SKY-" + Math.random().toString(36).substring(2, 8).toUpperCase();

// ============ BUY TICKET (creates PENDING ticket) ============
router.post("/buy", auth, async (req, res) => {
  try {
    const { eventId, ticketType } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    // Count only paid + pending tickets toward capacity
    const activeTickets = await Ticket.countDocuments({
      event: eventId,
      refunded: { $ne: true },
      paymentStatus: { $in: ["pending", "paid"] },
    });
    if (activeTickets >= event.capacity)
      return res.status(400).json({ msg: "Sold out" });

    const user = await User.findById(req.user.id);
    const isMember = user.duesPaid && user.membershipStatus === "active";
    const type =
      event.ticketTypes.find((t) => t.name === ticketType) ||
      event.ticketTypes[0];
    const price = isMember ? type.memberPrice ?? type.price : type.price;

    // Create ticket with PENDING status
    const ticket = await Ticket.create({
      event: eventId,
      user: req.user.id,
      ticketType: type.name,
      price,
      paymentStatus: "pending",
      referenceId: makeRefId(),
    });

    // Generate QR now (but only usable after admin confirms)
    const qr = await QRCode.toDataURL(
      JSON.stringify({
        ticketId: ticket._id.toString(),
        eventId,
        userId: req.user.id,
      })
    );
    ticket.qrCode = qr;
    await ticket.save();

    res.json(ticket);
  } catch (err) {
    console.error("Buy error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ============ GET CURRENT USER'S TICKETS ============
router.get("/my", auth, async (req, res) => {
  const tickets = await Ticket.find({ user: req.user.id })
    .populate("event")
    .sort({ createdAt: -1 });
  res.json(tickets);
});

// ============ GET TICKETS FOR AN EVENT (admin/treasurer) ============
router.get(
  "/event/:eventId",
  auth,
  requireRole("admin", "treasurer"),
  async (req, res) => {
    const tickets = await Ticket.find({ event: req.params.eventId })
      .populate("user", "name email phone avatar")
      .populate("event", "title")
      .sort({ createdAt: -1 });
    res.json(tickets);
  }
);

// ============ SUBMIT PAYMENT PROOF ============
router.post(
  "/:id/submit-payment",
  auth,
  async (req, res) => {
    try {
      const { paymentNote } = req.body;
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ msg: "Ticket not found" });
      if (ticket.user.toString() !== req.user.id)
        return res.status(403).json({ msg: "Not your ticket" });
      if (ticket.paymentStatus === "paid")
        return res.status(400).json({ msg: "Already marked as paid" });

      ticket.paymentNote = paymentNote || "Paid";
      // optionally attach proof URL from body
      if (req.body.proofUrl) ticket.paymentProof = req.body.proofUrl;

      await ticket.save();
      res.json({ msg: "✅ Payment submitted for verification", ticket });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

// ============ ATTACH PROOF IMAGE ============
router.post(
  "/:id/proof",
  auth,
  async (req, res) => {
    try {
      const { proofUrl } = req.body;
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ msg: "Ticket not found" });
      if (ticket.user.toString() !== req.user.id)
        return res.status(403).json({ msg: "Not your ticket" });

      ticket.paymentProof = proofUrl;
      await ticket.save();
      res.json({ msg: "Proof attached", ticket });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

// ============ ADMIN CONFIRM PAYMENT ============
router.put(
  "/:id/confirm",
  auth,
  requireRole("admin", "treasurer"),
  async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id)
        .populate("user", "name email")
        .populate("event", "title date venue ticketTypes");

      if (!ticket) return res.status(404).json({ msg: "Ticket not found" });
      if (ticket.paymentStatus === "paid")
        return res.status(400).json({ msg: "Already confirmed" });

      ticket.paymentStatus = "paid";
      ticket.paymentConfirmedAt = new Date();
      ticket.paymentConfirmedBy = req.user.id;
      await ticket.save();

      // Update event's ticketsSold count
      const event = await Event.findById(ticket.event._id);
      if (event) {
        event.ticketsSold += 1;
        await event.save();
      }

      // Record income transaction
      await Transaction.create({
        type: "income",
        amount: ticket.price,
        category: "ticket",
        description: `Ticket: ${ticket.event.title} (${ticket.ticketType})`,
        user: ticket.user._id,
        event: ticket.event._id,
        relatedTo: ticket._id,
        relatedModel: "Ticket",
        recordedBy: req.user.id,
      });

      // Send receipt email
      sendMail({
        to: ticket.user.email,
        ...ticketReceiptEmail(ticket.user, ticket.event, ticket),
      }).catch(() => {});

      res.json({ msg: "✅ Payment confirmed", ticket });
    } catch (err) {
      console.error("Confirm error:", err);
      res.status(500).json({ msg: err.message });
    }
  }
);

// ============ ADMIN REJECT PAYMENT ============
router.put(
  "/:id/reject",
  auth,
  requireRole("admin", "treasurer"),
  async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

      ticket.paymentStatus = "rejected";
      await ticket.save();

      res.json({ msg: "Payment rejected", ticket });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

// ============ QR CHECK-IN (only paid tickets) ============
router.post("/checkin", auth, async (req, res) => {
  try {
    const { qrData, eventId } = req.body;
    const parsed = JSON.parse(qrData);
    const ticket = await Ticket.findById(parsed.ticketId)
      .populate("user", "name email")
      .populate("event", "title");
    if (!ticket) return res.status(404).json({ msg: "Invalid ticket" });

    if (eventId && ticket.event?._id?.toString() !== eventId) {
      return res.status(400).json({
        msg: `This ticket is for "${ticket.event?.title}", not the current event`,
        ticket,
      });
    }

    if (ticket.paymentStatus !== "paid") {
      return res.status(400).json({
        msg: `Ticket payment not confirmed yet (${ticket.paymentStatus})`,
        ticket,
      });
    }

    if (ticket.checkedIn)
      return res.status(400).json({ msg: "Already checked in", ticket });

    ticket.checkedIn = true;
    ticket.checkedInAt = new Date();
    await ticket.save();
    res.json({ msg: "✅ Checked in", ticket });
  } catch {
    res.status(400).json({ msg: "Invalid QR code" });
  }
});

// ============ REPORT ============
router.get("/report/:eventId", auth, async (req, res) => {
  const tickets = await Ticket.find({ event: req.params.eventId });
  const paid = tickets.filter((t) => t.paymentStatus === "paid");
  const total = paid.length;
  const checkedIn = paid.filter((t) => t.checkedIn).length;
  const revenue = paid.reduce((s, t) => s + (t.price || 0), 0);
  const byType = {};
  paid.forEach((t) => {
    byType[t.ticketType] = byType[t.ticketType] || {
      sold: 0,
      revenue: 0,
      checkedIn: 0,
    };
    byType[t.ticketType].sold++;
    byType[t.ticketType].revenue += t.price || 0;
    if (t.checkedIn) byType[t.ticketType].checkedIn++;
  });
  res.json({
    total,
    checkedIn,
    noShow: total - checkedIn,
    revenue,
    byType,
    pending: tickets.filter((t) => t.paymentStatus === "pending").length,
  });
});

// ============ REFUND ============
router.post("/:id/refund", auth, requireRole("admin", "treasurer"), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("user", "name email")
      .populate("event", "title");

    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });
    if (ticket.refunded)
      return res.status(400).json({ msg: "Already refunded" });

    ticket.refunded = true;
    ticket.paymentStatus = "refunded";
    await ticket.save();

    await Transaction.create({
      type: "expense",
      amount: ticket.price,
      category: "refund",
      description: `Refund: ${ticket.event.title} (${ticket.ticketType})`,
      user: ticket.user._id,
      event: ticket.event._id,
      relatedTo: ticket._id,
      relatedModel: "Ticket",
      recordedBy: req.user.id,
    });

    sendMail({
      to: ticket.user.email,
      ...ticketRefundEmail(ticket.user, ticket.event, ticket.price),
    }).catch(() => {});

    res.json({ msg: "Refunded ✅", ticket });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;