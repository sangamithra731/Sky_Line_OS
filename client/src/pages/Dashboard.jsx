import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import {
  Users, DollarSign, Calendar, Ticket, ArrowRight,
  TrendingUp, TrendingDown, Wallet, Megaphone, MapPin, Pin,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";

// ============ COLOR PALETTE (brighter, more modern) ============
const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#f43f5e", // rose
  "#84cc16", // lime
];

// ============ COLORFUL STAT CARD ============
function ClickableStatCard({ icon: Icon, label, value, sub, color = "brand", to }) {
  const colors = {
    brand: {
      bg: "bg-gradient-to-br from-brand-50 via-brand-50/70 to-accent-50/50 dark:from-brand-900/30 dark:via-brand-900/20 dark:to-accent-900/10",
      icon: "bg-gradient-to-br from-brand-500 to-accent-500 shadow-brand-500/40",
      border: "border-brand-200/60 dark:border-brand-800",
      glow: "hover:shadow-brand-500/25",
      dot: "bg-brand-500",
    },
    emerald: {
      bg: "bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-teal-50/50 dark:from-emerald-900/30 dark:via-emerald-900/20 dark:to-teal-900/10",
      icon: "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/40",
      border: "border-emerald-200/60 dark:border-emerald-800",
      glow: "hover:shadow-emerald-500/25",
      dot: "bg-emerald-500",
    },
    amber: {
      bg: "bg-gradient-to-br from-amber-50 via-amber-50/70 to-orange-50/50 dark:from-amber-900/30 dark:via-amber-900/20 dark:to-orange-900/10",
      icon: "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/40",
      border: "border-amber-200/60 dark:border-amber-800",
      glow: "hover:shadow-amber-500/25",
      dot: "bg-amber-500",
    },
    rose: {
      bg: "bg-gradient-to-br from-rose-50 via-rose-50/70 to-pink-50/50 dark:from-rose-900/30 dark:via-rose-900/20 dark:to-pink-900/10",
      icon: "bg-gradient-to-br from-rose-500 to-pink-500 shadow-rose-500/40",
      border: "border-rose-200/60 dark:border-rose-800",
      glow: "hover:shadow-rose-500/25",
      dot: "bg-rose-500",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 via-purple-50/70 to-fuchsia-50/50 dark:from-purple-900/30 dark:via-purple-900/20 dark:to-fuchsia-900/10",
      icon: "bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-purple-500/40",
      border: "border-purple-200/60 dark:border-purple-800",
      glow: "hover:shadow-purple-500/25",
      dot: "bg-purple-500",
    },
    cyan: {
      bg: "bg-gradient-to-br from-cyan-50 via-cyan-50/70 to-sky-50/50 dark:from-cyan-900/30 dark:via-cyan-900/20 dark:to-sky-900/10",
      icon: "bg-gradient-to-br from-cyan-500 to-sky-500 shadow-cyan-500/40",
      border: "border-cyan-200/60 dark:border-cyan-800",
      glow: "hover:shadow-cyan-500/25",
      dot: "bg-cyan-500",
    },
  };

  const c = colors[color] || colors.brand;

  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-2xl p-6 border ${c.border} ${c.bg} hover:-translate-y-1 hover:shadow-2xl ${c.glow} transition-all duration-300`}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/40 dark:bg-white/5 blur-3xl opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/30 dark:bg-white/5 blur-2xl opacity-40 group-hover:opacity-80 transition-opacity" />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              {label}
            </p>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 truncate">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {sub}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg text-white ${c.icon}`}
        >
          <Icon size={22} />
        </div>
      </div>

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all">
        <ArrowRight size={16} className="text-slate-400" />
      </div>
    </Link>
  );
}

// ============ DASHBOARD ============
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMoneyRole = ["admin", "treasurer"].includes(user?.role);

  useEffect(() => {
    API.get("/dashboard/stats")
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center py-16">
        <p className="text-slate-500 dark:text-slate-400">Could not load dashboard</p>
      </div>
    );
  }

  const finance = data.finance;

  const barData = finance
    ? [
        { name: "Income", value: finance.income, link: "/finance?filter=income" },
        { name: "Expense", value: finance.expense, link: "/finance?filter=expense" },
      ]
    : [];

  const pieData = finance
    ? Object.entries(finance.byCategory || {})
        .filter(([k]) => k.startsWith("income:"))
        .map(([k, v]) => {
          const cat = k.split(":")[1] || "other";
          return { name: cat, value: v, link: `/finance?filter=income&category=${cat}` };
        })
    : [];

  const handleBarClick = (bar) => bar?.link && navigate(bar.link);
  const handlePieClick = (slice) => slice?.link && navigate(slice.link);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* ============ HERO (multi-color gradient) ============ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-purple-600 to-indigo-700 text-white shadow-2xl shadow-brand-500/30">
        {/* Multi-color blurred blobs */}
        <div className="absolute inset-0 overflow-hidden opacity-40">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-yellow-300 to-pink-400 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative z-10 p-8">
          <p className="text-white/80 text-sm font-medium">
            {greeting()}, {user?.name?.split(" ")[0]} 👋
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-2 tracking-tight">
            Welcome to Skyline
          </h1>
          <p className="text-white/85 text-sm max-w-xl leading-relaxed">
            {isMoneyRole
              ? "Here's your club at a glance — click any stat to dive deeper."
              : "Stay updated with your club events and announcements."}
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/events"
              className="px-5 py-2.5 rounded-xl bg-white text-brand-700 hover:bg-white/90 text-sm font-bold transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              📅 Browse Events
            </Link>
            <Link
              to="/announcements"
              className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-sm font-semibold transition-all active:scale-95"
            >
              📢 Announcements
            </Link>
            {isMoneyRole && (
              <Link
                to="/finance"
                className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-sm font-semibold transition-all active:scale-95"
              >
                💰 Finance
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ============ DUES BANNER ============ */}
      {!user?.duesPaid && (
        <div className="rounded-2xl p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-rose-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                ⚠️
              </div>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-200">
                  Your dues are pending
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                  Pay your dues to unlock member discounts on tickets and merch.
                </p>
              </div>
            </div>
            <span className="badge-warning">Action needed</span>
          </div>
        </div>
      )}

      {/* ============ STATS (colorful cards) ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClickableStatCard
          icon={Users}
          label="Total Members"
          value={data.members.total}
          sub={`${data.members.paid} paid dues`}
          color="brand"
          to="/members"
        />

        {isMoneyRole && finance ? (
          <>
            <ClickableStatCard
              icon={Wallet}
              label="Current Balance"
              value={`$${finance.balance.toFixed(2)}`}
              sub={`${finance.transactionCount} transactions`}
              color="emerald"
              to="/finance"
            />
            <ClickableStatCard
              icon={TrendingUp}
              label="Total Income"
              value={`$${finance.income.toFixed(2)}`}
              sub="Click to see sources"
              color="cyan"
              to="/finance?filter=income"
            />
            <ClickableStatCard
              icon={TrendingDown}
              label="Total Expenses"
              value={`$${finance.expense.toFixed(2)}`}
              sub="Click to see where"
              color="rose"
              to="/finance?filter=expense"
            />
          </>
        ) : (
          <>
            <ClickableStatCard
              icon={Calendar}
              label="Upcoming Events"
              value={data.events.upcoming}
              sub={`${data.events.total} total`}
              color="amber"
              to="/events"
            />
            <ClickableStatCard
              icon={Ticket}
              label="My Tickets"
              value={data.myTickets}
              sub="Events I'm attending"
              color="purple"
              to="/events"
            />
            <ClickableStatCard
              icon={Megaphone}
              label="Announcements"
              value={data.recentAnnouncements.length}
              sub="Recent updates"
              color="cyan"
              to="/announcements"
            />
          </>
        )}
      </div>

      {/* ============ CHARTS ============ */}
      {isMoneyRole && finance && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-br from-brand-500 to-accent-500"></span>
                Income vs Expense
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Click a bar
              </span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#6366f1"
                  radius={[8, 8, 0, 0]}
                  onClick={handleBarClick}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500"></span>
                Income Breakdown
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Click a slice
              </span>
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label={(e) => e.name}
                    onClick={handlePieClick}
                    cursor="pointer"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                No income data yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ EVENTS + ANNOUNCEMENTS ============ */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-br from-brand-500 to-accent-500"></span>
              Upcoming Events
            </h3>
            <Link
              to="/events"
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {data.recentEvents.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
              No upcoming events
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentEvents.map((e) => (
                <Link
                  key={e._id}
                  to={`/events/${e._id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/30">
                    <span className="text-xs font-medium">
                      {format(new Date(e.eventDate || e.date), "MMM")}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {format(new Date(e.eventDate || e.date), "d")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white truncate group-hover:text-brand-600">
                      {e.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <MapPin size={12} /> {e.venue}
                    </p>
                  </div>
                  <span className="badge-info flex-shrink-0">
                    {e.capacity - e.ticketsSold} left
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-br from-amber-500 to-orange-500"></span>
              Latest Announcements
            </h3>
            <Link
              to="/announcements"
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {data.recentAnnouncements.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
              No announcements yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentAnnouncements.map((a) => (
                <Link
                  to="/announcements"
                  key={a._id}
                  className="block p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  <div className="flex items-start gap-2">
                    {a.pinned && (
                      <Pin size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                        {a.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {a.body}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}