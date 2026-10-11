import express from "express";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(auth, requireRole("admin"));

// OVERVIEW
router.get("/overview", async (req, res) => {
  try {
    const [totalMembers, paidMembers, totalEvents, totalTickets, checkedIn, txs] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ duesPaid: true }),
      Event.countDocuments(),
      Ticket.countDocuments({ paymentStatus: "paid" }),
      Ticket.countDocuments({ paymentStatus: "paid", checkedIn: true }),
      Transaction.find(),
    ]);
    const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    res.json({
      members: { total: totalMembers, paid: paidMembers, pending: totalMembers - paidMembers, paidRate: totalMembers ? (paidMembers / totalMembers) * 100 : 0 },
      events: { total: totalEvents, tickets: totalTickets, checkedIn, attendanceRate: totalTickets ? (checkedIn / totalTickets) * 100 : 0 },
      finance: { income, expense, balance: income - expense },
    });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// GROWTH
router.get("/growth", async (req, res) => {
  try {
    const now = new Date();
    const six = new Date(now); six.setMonth(six.getMonth() - 6);
    const recentUsers = await User.find({ createdAt: { $gte: six } }).select("createdAt");
    const totalUsers = await User.countDocuments();
    const paidUsers = await User.countDocuments({ duesPaid: true });
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setMonth(next.getMonth() + 1);
      months.push({ label: d.toLocaleString("en", { month: "short", year: "2-digit" }), start: d, end: next, newMembers: 0 });
    }
    recentUsers.forEach((u) => {
      const created = new Date(u.createdAt);
      const b = months.find((m) => created >= m.start && created < m.end);
      if (b) b.newMembers++;
    });
    let cumulative = totalUsers - recentUsers.length;
    const growth = months.map((m) => ({ month: m.label, newMembers: m.newMembers, total: (cumulative += m.newMembers) }));
    res.json({ growth, duesRate: totalUsers ? (paidUsers / totalUsers) * 100 : 0 });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// EVENTS
router.get("/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: -1 });
    const stats = await Promise.all(events.map(async (e) => {
      const tickets = await Ticket.find({ event: e._id });
      const paid = tickets.filter((t) => t.paymentStatus === "paid");
      const checkedIn = paid.filter((t) => t.checkedIn);
      const revenue = paid.reduce((s, t) => s + (t.price || 0), 0);
      return {
        _id: e._id, title: e.title, date: e.eventDate || e.date, capacity: e.capacity,
        sold: paid.length, attended: checkedIn.length, noShow: paid.length - checkedIn.length,
        revenue, attendanceRate: paid.length ? (checkedIn.length / paid.length) * 100 : 0,
        fillRate: e.capacity ? (paid.length / e.capacity) * 100 : 0,
      };
    }));
    res.json({
      all: stats,
      topByRevenue: [...stats].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      topByAttendance: [...stats].sort((a, b) => b.attendanceRate - a.attendanceRate).slice(0, 5),
      topByFillRate: [...stats].sort((a, b) => b.fillRate - a.fillRate).slice(0, 5),
    });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// MEMBERS
router.get("/members", async (req, res) => {
  try {
    const tickets = await Ticket.find({ paymentStatus: "paid", checkedIn: true }).populate("user", "name email avatar role");
    const att = {};
    tickets.forEach((t) => { if (t.user) { const id = t.user._id.toString(); att[id] = att[id] || { user: t.user, count: 0 }; att[id].count++; } });
    const topAttendees = Object.values(att).sort((a, b) => b.count - a.count).slice(0, 10);
    const paidTickets = await Ticket.find({ paymentStatus: "paid" }).populate("user", "name email avatar role");
    const paidOrders = await Order.find({ paymentStatus: "paid" }).populate("user", "name email avatar role");
    const spend = {};
    paidTickets.forEach((t) => { if (t.user) { const id = t.user._id.toString(); spend[id] = spend[id] || { user: t.user, amount: 0 }; spend[id].amount += t.price || 0; } });
    paidOrders.forEach((o) => { if (o.user) { const id = o.user._id.toString(); spend[id] = spend[id] || { user: o.user, amount: 0 }; spend[id].amount += o.total || 0; } });
    const topSpenders = Object.values(spend).sort((a, b) => b.amount - a.amount).slice(0, 10);
    const roles = ["member", "volunteer", "treasurer", "admin"];
    const byRole = await Promise.all(roles.map(async (r) => ({ role: r, count: await User.countDocuments({ role: r }) })));
    const total = await User.countDocuments();
    const paid = await User.countDocuments({ duesPaid: true });
    res.json({ topAttendees, topSpenders, byRole, dues: { paid, pending: total - paid, total } });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// MONEY
router.get("/money", async (req, res) => {
  try {
    const txs = await Transaction.find();
    const income = txs.filter((t) => t.type === "income");
    const expense = txs.filter((t) => t.type === "expense");
    const totalIncome = income.reduce((s, t) => s + t.amount, 0);
    const totalExpense = expense.reduce((s, t) => s + t.amount, 0);
    const incomeByCategory = {}; income.forEach((t) => { incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount; });
    const expenseByCategory = {}; expense.forEach((t) => { expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount; });
    const monthly = {};
    for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); const k = d.toISOString().slice(0, 7); monthly[k] = { month: d.toLocaleString("en", { month: "short" }), income: 0, expense: 0 }; }
    txs.forEach((t) => { const k = new Date(t.date).toISOString().slice(0, 7); if (monthly[k]) { if (t.type === "income") monthly[k].income += t.amount; else monthly[k].expense += t.amount; } });
    const monthList = Object.values(monthly);
    res.json({ totalIncome, totalExpense, balance: totalIncome - totalExpense, incomeByCategory, expenseByCategory, monthly: monthList, bestMonth: [...monthList].sort((a, b) => b.income - a.income)[0] });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

export default router;
