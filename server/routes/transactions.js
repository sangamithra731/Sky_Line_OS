import express from "express";
import Transaction from "../models/Transaction.js";
import Ticket from "../models/Ticket.js";
import Order from "../models/Order.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// ============ SUMMARY ============
router.get("/summary", auth, async (req, res) => {
  const { from, to } = req.query;
  const query = {};
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const txs = await Transaction.find(query);
  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const incomeByCategory = {};
  const expenseByCategory = {};
  txs.forEach((t) => {
    const target = t.type === "income" ? incomeByCategory : expenseByCategory;
    target[t.category] = (target[t.category] || 0) + t.amount;
  });

  // Monthly trend (last 6 months)
  const monthly = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7); // YYYY-MM
    monthly[key] = { month: key, income: 0, expense: 0 };
  }
  txs.forEach((t) => {
    const key = new Date(t.date).toISOString().slice(0, 7);
    if (monthly[key]) {
      if (t.type === "income") monthly[key].income += t.amount;
      else monthly[key].expense += t.amount;
    }
  });

  res.json({
    income,
    expense,
    balance: income - expense,
    count: txs.length,
    incomeByCategory,
    expenseByCategory,
    monthly: Object.values(monthly),
  });
});

// ============ LIST WITH RUNNING BALANCE ============
router.get("/", auth, requireRole("admin", "treasurer"), async (req, res) => {
  const { type, category, from, to, search } = req.query;
  const query = {};
  if (type && type !== "all") query.type = type;
  if (category && category !== "all") query.category = category;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  let txs = await Transaction.find(query)
    .populate("user", "name email role avatar")
    .populate("recordedBy", "name role")
    .populate("event", "title")
    .sort({ date: -1 });

  // Compute running balance
  const totalIncome = txs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  // Compute cumulative balance from oldest to newest
  const sorted = [...txs].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  let running = 0;
  const balanceMap = {};
  sorted.forEach((t) => {
    running += t.type === "income" ? t.amount : -t.amount;
    balanceMap[t._id.toString()] = running;
  });

  txs = txs.map((t) => ({
    ...t.toObject(),
    runningBalance: balanceMap[t._id.toString()],
  }));

  // Filter by search AFTER populate
  if (search) {
    const q = search.toLowerCase();
    txs = txs.filter(
      (t) =>
        t.user?.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
    );
  }

  res.json({
    transactions: txs,
    summary: {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
      count: txs.length,
    },
  });
});

// ============ BY EVENT ============
router.get(
  "/by-event",
  auth,
  requireRole("admin", "treasurer"),
  async (req, res) => {
    const events = await Event.find().sort({ eventDate: -1 });
    const result = await Promise.all(
      events.map(async (e) => {
        const tickets = await Ticket.find({
          event: e._id,
          paymentStatus: "paid",
          refunded: { $ne: true },
        });
        const revenue = tickets.reduce((s, t) => s + t.price, 0);
        const attended = tickets.filter((t) => t.checkedIn).length;

        // Expenses related to this event
        const txs = await Transaction.find({
          event: e._id,
          type: "expense",
        });
        const expenses = txs.reduce((s, t) => s + t.amount, 0);

        return {
          _id: e._id,
          title: e.title,
          date: e.eventDate || e.date,
          capacity: e.capacity,
          ticketsSold: tickets.length,
          attended,
          revenue,
          expenses,
          net: revenue - expenses,
        };
      })
    );
    res.json(result);
  }
);

// ============ MEMBER DUES STATUS ============
router.get(
  "/dues-status",
  auth,
  requireRole("admin", "treasurer"),
  async (req, res) => {
    const members = await User.find({
      role: { $in: ["member", "volunteer"] },
    }).select("name email role duesPaid membershipExpiry avatar");

    const paid = members.filter((m) => m.duesPaid).length;
    const pending = members.filter((m) => !m.duesPaid).length;
    const totalCollected = paid * 500; // Assuming $500 dues — adjust as needed

    res.json({
      members,
      paid,
      pending,
      totalCollected,
    });
  }
);

// ============ CREATE ============
router.post("/", auth, requireRole("admin", "treasurer"), async (req, res) => {
  const tx = await Transaction.create({
    ...req.body,
    date: req.body.date || new Date(),
    recordedBy: req.user.id,
  });
  const populated = await tx.populate("user", "name email");
  res.json(populated);
});

// ============ DELETE ============
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

export default router;