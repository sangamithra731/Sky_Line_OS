import express from "express";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import Announcement from "../models/Announcement.js";
import Transaction from "../models/Transaction.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats", auth, async (req, res) => {
  try {
    const isMoneyRole = ["admin", "treasurer"].includes(req.user.role);

    const [
      totalMembers,
      membersPaid,
      upcomingEvents,
      totalEvents,
      myTickets,
      recentAnnouncements,
      recentEvents,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ duesPaid: true }),
      Event.countDocuments({ date: { $gte: new Date() } }),
      Event.countDocuments(),
      Ticket.countDocuments({ user: req.user.id }),
      Announcement.find()
        .sort({ pinned: -1, createdAt: -1 })
        .limit(3)
        .populate("author", "name"),
      Event.find({ date: { $gte: new Date() } })
        .sort({ date: 1 })
        .limit(3),
    ]);

    const base = {
      members: { total: totalMembers, paid: membersPaid },
      events: { upcoming: upcomingEvents, total: totalEvents },
      myTickets,
      recentAnnouncements,
      recentEvents,
    };

    if (isMoneyRole) {
      const txs = await Transaction.find();
      const income = txs
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expense = txs
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      const byCategory = {};
      txs.forEach((t) => {
        const key = `${t.type}:${t.category || "other"}`;
        byCategory[key] = (byCategory[key] || 0) + t.amount;
      });

      base.finance = {
        income,
        expense,
        balance: income - expense,
        transactionCount: txs.length,
        byCategory,
      };
    }

    res.json(base);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;