import { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Plus,
  X,
  Download,
  Search,
  Wallet,
  FileText,
  Calendar,
  Users,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format } from "date-fns";
import jsPDF from "jspdf";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "transactions", label: "Transactions", icon: FileText },
  { id: "events", label: "By Event", icon: Calendar },
  { id: "dues", label: "Dues", icon: Users },
];

export default function Finance() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [txs, setTxs] = useState([]);
  const [byEvent, setByEvent] = useState([]);
  const [duesData, setDuesData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "supplies",
    description: "",
  });
  const [loading, setLoading] = useState(true);

  const canAccess = ["admin", "treasurer"].includes(user?.role);

  const loadAll = async () => {
    if (!canAccess) return;
    try {
      const [s, t, e, d] = await Promise.all([
        API.get("/transactions/summary"),
        API.get("/transactions"),
        API.get("/transactions/by-event"),
        API.get("/transactions/dues-status"),
      ]);
      setSummary(s.data);
      setTxs(t.data.transactions);
      setByEvent(e.data);
      setDuesData(d.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load finance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/transactions", {
        ...form,
        amount: Number(form.amount),
      });
      toast.success("Transaction recorded");
      setForm({ type: "expense", amount: "", category: "supplies", description: "" });
      setShowForm(false);
      loadAll();
    } catch {
      toast.error("Failed");
    }
  };

  if (!canAccess) {
    return (
      <div className="card text-center py-16">
        <DollarSign size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-800 dark:text-white mb-1">
          Restricted access
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Only admins and treasurers can view financial data.
        </p>
      </div>
    );
  }

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Download full report
  const downloadFullReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Skyline Student Association", 14, 20);
    doc.setFontSize(14);
    doc.text("Financial Report", 14, 30);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
    doc.line(14, 42, 196, 42);

    // Summary
    doc.setFontSize(14);
    doc.text("Summary", 14, 52);
    doc.setFontSize(11);
    doc.text(`Total Income:      $${summary.income.toFixed(2)}`, 20, 62);
    doc.text(`Total Expenses:    $${summary.expense.toFixed(2)}`, 20, 70);
    doc.text(`Current Balance:   $${summary.balance.toFixed(2)}`, 20, 78);
    doc.text(`Total Transactions: ${summary.count}`, 20, 86);

    // Income breakdown
    let y = 100;
    doc.setFontSize(12);
    doc.text("Income Breakdown", 14, y);
    y += 8;
    doc.setFontSize(10);
    Object.entries(summary.incomeByCategory || {}).forEach(([cat, amt]) => {
      doc.text(`${cat}: $${amt.toFixed(2)}`, 20, y);
      y += 6;
    });

    // Expense breakdown
    y += 6;
    doc.setFontSize(12);
    doc.text("Expense Breakdown", 14, y);
    y += 8;
    doc.setFontSize(10);
    Object.entries(summary.expenseByCategory || {}).forEach(([cat, amt]) => {
      doc.text(`${cat}: $${amt.toFixed(2)}`, 20, y);
      y += 6;
    });

    // Transactions
    doc.addPage();
    y = 20;
    doc.setFontSize(14);
    doc.text("All Transactions", 14, y);
    y += 10;
    doc.setFontSize(9);
    doc.text("Date", 14, y);
    doc.text("Who", 40, y);
    doc.text("Description", 70, y);
    doc.text("Category", 140, y);
    doc.text("Amount", 175, y);
    doc.line(14, y + 2, 196, y + 2);
    y += 8;

    txs.slice(0, 40).forEach((t) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(format(new Date(t.date), "MMM dd yy"), 14, y);
      doc.text((t.user?.name || "—").slice(0, 18), 40, y);
      doc.text((t.description || "").slice(0, 40), 70, y);
      doc.text(t.category || "—", 140, y);
      doc.text(
        `${t.type === "income" ? "+" : "-"}$${t.amount.toFixed(2)}`,
        175,
        y
      );
      y += 5;
    });

    doc.save("skyline-finance-report.pdf");
    toast.success("Full report downloaded!");
  };

  // Filter transactions
  const filteredTxs = txs.filter((t) => {
    if (filter !== "all" && t.type !== filter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = t.user?.name?.toLowerCase() || "";
      const desc = t.description?.toLowerCase() || "";
      if (!name.includes(q) && !desc.includes(q)) return false;
    }
    return true;
  });

  const incomePie = Object.entries(summary.incomeByCategory || {}).map(
    ([k, v]) => ({ name: k, value: v })
  );
  const expensePie = Object.entries(summary.expenseByCategory || {}).map(
    ([k, v]) => ({ name: k, value: v })
  );

  const barData = [
    { name: "Income", value: summary.income },
    { name: "Expense", value: summary.expense },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Finance
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Track every dollar in and out — with full history
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadFullReport}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} /> Full Report
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Record
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Balance
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                ${summary.balance.toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Income
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ${summary.income.toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Expenses
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                ${summary.expense.toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 flex items-center justify-center">
              <TrendingDown size={18} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transactions
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {summary.count}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 rounded-xl p-1.5 border border-slate-200 dark:border-slate-700 w-fit flex-wrap">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${
                tab === t.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ============ OVERVIEW ============ */}
      {tab === "overview" && (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Income vs Expense */}
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                Income vs Expense
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly trend */}
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                Last 6 Months Trend
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={summary.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Income breakdown */}
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                Income Sources
              </h3>
              {incomePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={incomePie}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label={(e) => `${e.name}: $${e.value}`}
                    >
                      {incomePie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center py-12 text-slate-400 text-sm">
                  No income yet
                </p>
              )}
            </div>

            {/* Expense breakdown */}
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                Where Money Went
              </h3>
              {expensePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={expensePie}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label={(e) => `${e.name}: $${e.value}`}
                    >
                      {expensePie.map((_, i) => (
                        <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center py-12 text-slate-400 text-sm">
                  No expenses yet
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ============ TRANSACTIONS ============ */}
      {tab === "transactions" && (
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">
              All Transactions ({filteredTxs.length})
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="input pl-9 !py-2 !text-sm w-48"
                />
              </div>
              <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700">
                {[
                  { id: "all", label: "All" },
                  { id: "income", label: "Income" },
                  { id: "expense", label: "Expense" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filter === f.id
                        ? "bg-white dark:bg-slate-800 text-brand-600 shadow-sm"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Who</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.map((t) => (
                  <tr
                    key={t._id}
                    className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {format(new Date(t.date), "MMM d, yyyy")}
                    </td>
                    <td className="py-3">
                      {t.user ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-[10px]">
                            {t.user.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-white text-xs truncate">
                              {t.user.name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                              {t.user.role}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Club-wide
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                        {t.description}
                      </p>
                      {t.event && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          🎯 {t.event.title}
                        </p>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={
                          t.type === "income" ? "badge-success" : "badge-danger"
                        }
                      >
                        {t.category || "other"}
                      </span>
                    </td>
                    <td
                      className={`py-3 text-right font-bold whitespace-nowrap ${
                        t.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {t.type === "income" ? "+" : "−"}${t.amount.toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      ${t.runningBalance?.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {filteredTxs.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ BY EVENT ============ */}
      {tab === "events" && (
        <div className="card">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">
            Revenue by Event
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                  <th className="pb-3 font-medium">Event</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 text-right font-medium">Sold</th>
                  <th className="pb-3 text-right font-medium">Attended</th>
                  <th className="pb-3 text-right font-medium">Revenue</th>
                  <th className="pb-3 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {byEvent.map((e) => (
                  <tr
                    key={e._id}
                    className="border-b border-slate-50 dark:border-slate-800"
                  >
                    <td className="py-3 font-semibold text-slate-800 dark:text-white">
                      {e.title}
                    </td>
                    <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                      {format(new Date(e.date), "MMM d, yyyy")}
                    </td>
                    <td className="py-3 text-right text-slate-700 dark:text-slate-300">
                      {e.ticketsSold}/{e.capacity}
                    </td>
                    <td className="py-3 text-right text-slate-700 dark:text-slate-300">
                      {e.attended}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ${e.revenue.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 text-right font-bold ${
                        e.net >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      ${e.net.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {byEvent.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                      No events yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ DUES ============ */}
      {tab === "dues" && duesData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Members Paid
              </p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {duesData.paid}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Members Pending
              </p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {duesData.pending}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total Dues Collected
              </p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
                ${duesData.totalCollected}
              </p>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">
              Member Dues Status
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                    <th className="pb-3 font-medium">Member</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                    <th className="pb-3 font-medium text-right">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {duesData.members.map((m) => (
                    <tr
                      key={m._id}
                      className="border-b border-slate-50 dark:border-slate-800"
                    >
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">
                        {m.name}
                      </td>
                      <td className="py-3 text-xs capitalize text-slate-500 dark:text-slate-400">
                        {m.role}
                      </td>
                      <td className="py-3 text-right">
                        {m.duesPaid ? (
                          <span className="badge-success">Paid</span>
                        ) : (
                          <span className="badge-warning">Pending</span>
                        )}
                      </td>
                      <td className="py-3 text-right text-xs text-slate-500 dark:text-slate-400">
                        {m.membershipExpiry
                          ? format(new Date(m.membershipExpiry), "MMM d, yyyy")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Record modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                New Transaction
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {["income", "expense"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`py-2 rounded-xl font-semibold text-sm capitalize transition ${
                      form.type === t
                        ? t === "income"
                          ? "bg-emerald-600 text-white"
                          : "bg-red-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div>
                <label className="label">Amount ($)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  className="input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="input"
                >
                  <option value="dues">Dues</option>
                  <option value="ticket">Ticket</option>
                  <option value="merch">Merch</option>
                  <option value="fundraiser">Fundraiser</option>
                  <option value="supplies">Supplies</option>
                  <option value="reimbursement">Reimbursement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="input"
                  placeholder="What was it for?"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}