import { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Ticket,
  BarChart3,
  Award,
  Trophy,
  Star,
  Wallet,
  Heart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { format } from "date-fns";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "events", label: "Events", icon: Calendar },
  { id: "members", label: "Members", icon: Users },
  { id: "money", label: "Money", icon: Wallet },
];

export default function Analytics() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [moneyStats, setMoneyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const canAccess = user?.role === "admin";

  useEffect(() => {
    if (!canAccess) return;
    Promise.all([
      API.get("/analytics/overview"),
      API.get("/analytics/growth"),
      API.get("/analytics/events"),
      API.get("/analytics/members"),
      API.get("/analytics/money"),
    ])
      .then(([o, g, e, m, mo]) => {
        setOverview(o.data);
        setGrowth(g.data);
        setEventStats(e.data);
        setMemberStats(m.data);
        setMoneyStats(mo.data);
      })
      .catch((err) => console.error("Analytics error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (!canAccess) {
    return (
      <div className="card text-center py-16">
        <BarChart3 size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-800 dark:text-white mb-1">
          Restricted access
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Only admins can view analytics.
        </p>
      </div>
    );
  }

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const incomePie = Object.entries(moneyStats.incomeByCategory).map(
    ([k, v]) => ({ name: k, value: v })
  );
  const expensePie = Object.entries(moneyStats.expenseByCategory).map(
    ([k, v]) => ({ name: k, value: v })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Analytics
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Insights to help you run the club better
        </p>
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total Members
                  </p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
                    {overview.members.total}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    {overview.members.paidRate.toFixed(0)}% paid
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 flex items-center justify-center">
                  <Users size={22} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
                    ${overview.finance.income.toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Balance: ${overview.finance.balance.toFixed(0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                  <DollarSign size={22} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Events Held
                  </p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
                    {overview.events.total}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {overview.events.tickets} tickets sold
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                  <Calendar size={22} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Attendance Rate
                  </p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
                    {overview.events.attendanceRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {overview.events.checkedIn} of {overview.events.tickets}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                  <Ticket size={22} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Members breakdown */}
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                Member Composition
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">
                      Paid members
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {overview.members.paid}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${overview.members.paidRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">
                      Pending dues
                    </span>
                    <span className="font-semibold text-amber-600">
                      {overview.members.pending}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${100 - overview.members.paidRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick insights */}
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Star size={16} className="text-amber-500" /> Key Insight
              </h3>
              <div className="p-4 rounded-xl bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-900/20 dark:to-indigo-900/20 border border-brand-100 dark:border-brand-800">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {overview.events.tickets > 0 ? (
                    <>
                      Your attendance rate is{" "}
                      <strong className="text-brand-600 dark:text-brand-400">
                        {overview.events.attendanceRate.toFixed(0)}%
                      </strong>
                      .{" "}
                      {overview.events.attendanceRate >= 75
                        ? "Excellent — most people who buy tickets show up."
                        : "Consider sending reminders the day before events to boost attendance."}
                    </>
                  ) : (
                    "No events yet. Create one to start tracking performance."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ GROWTH ============ */}
      {tab === "growth" && growth && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                Member Growth (6 months)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={growth.growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#6366f1"
                    fill="#c7d2fe"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                New Members per Month
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={growth.growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Bar
                    dataKey="newMembers"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">
              Dues Collection Rate
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full h-6 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full flex items-center justify-end pr-2 text-white text-xs font-bold transition-all"
                    style={{ width: `${growth.duesRate}%` }}
                  >
                    {growth.duesRate.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              {growth.duesRate >= 80
                ? "🎉 Great collection rate! Keep it up."
                : growth.duesRate >= 50
                ? "📢 Send reminders to members with pending dues."
                : "⚠️ Low collection — consider reaching out to members."}
            </p>
          </div>
        </div>
      )}

      {/* ============ EVENTS ============ */}
      {tab === "events" && eventStats && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue ranking */}
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" /> Top Events by
                Revenue
              </h3>
              <div className="space-y-3">
                {eventStats.topByRevenue.map((e, i) => (
                  <div
                    key={e._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        i === 0
                          ? "bg-amber-500 text-white"
                          : i === 1
                          ? "bg-slate-400 text-white"
                          : i === 2
                          ? "bg-orange-700 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                        {e.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {e.sold} tickets · {e.attended} attended
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ${e.revenue.toFixed(0)}
                    </span>
                  </div>
                ))}
                {eventStats.topByRevenue.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No events yet
                  </p>
                )}
              </div>
            </div>

            {/* Attendance ranking */}
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Award size={16} className="text-brand-500" /> Best Attendance
                Rate
              </h3>
              <div className="space-y-3">
                {eventStats.topByAttendance.map((e, i) => (
                  <div
                    key={e._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                        {e.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {e.attended}/{e.sold} showed up
                      </p>
                    </div>
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      {e.attendanceRate.toFixed(0)}%
                    </span>
                  </div>
                ))}
                {eventStats.topByAttendance.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No data yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Full event table */}
          <div className="card">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">
              All Events Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                    <th className="pb-3 font-medium">Event</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 text-right font-medium">Sold</th>
                    <th className="pb-3 text-right font-medium">Attended</th>
                    <th className="pb-3 text-right font-medium">Fill %</th>
                    <th className="pb-3 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {eventStats.all.map((e) => (
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
                        {e.sold}/{e.capacity}
                      </td>
                      <td className="py-3 text-right text-slate-700 dark:text-slate-300">
                        {e.attended}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`badge-${
                            e.fillRate >= 75
                              ? "success"
                              : e.fillRate >= 40
                              ? "warning"
                              : "danger"
                          }`}
                        >
                          {e.fillRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ${e.revenue.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                  {eventStats.all.length === 0 && (
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
        </div>
      )}

      {/* ============ MEMBERS ============ */}
      {tab === "members" && memberStats && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top attendees */}
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" /> Top Attendees
              </h3>
              <div className="space-y-2">
                {memberStats.topAttendees.map((a, i) => (
                  <div
                    key={a.user._id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                  >
                    <div className="w-6 text-center font-bold text-sm text-slate-400">
                      {i + 1}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {a.user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                        {a.user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {a.user.role}
                      </p>
                    </div>
                    <span className="badge-info">
                      {a.count} event{a.count > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
                {memberStats.topAttendees.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No attendance data yet
                  </p>
                )}
              </div>
            </div>

            {/* Top spenders */}
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" /> Top
                Spenders
              </h3>
              <div className="space-y-2">
                {memberStats.topSpenders.map((s, i) => (
                  <div
                    key={s.user._id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                  >
                    <div className="w-6 text-center font-bold text-sm text-slate-400">
                      {i + 1}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {s.user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                        {s.user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {s.user.role}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ${s.amount.toFixed(0)}
                    </span>
                  </div>
                ))}
                {memberStats.topSpenders.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No purchases yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* By role */}
          <div className="card">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">
              Members by Role
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {memberStats.byRole.map((r) => (
                <div
                  key={r.role}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-center"
                >
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">
                    {r.count}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-1">
                    {r.role}s
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dues status */}
          <div className="card">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">
              Dues Status
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {memberStats.dues.paid}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Paid
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {memberStats.dues.pending}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Pending
                </p>
              </div>
              <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/30">
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {memberStats.dues.total}
                </p>
                <p className="text-xs text-brand-700 dark:text-brand-300 mt-1">
                  Total
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MONEY ============ */}
      {tab === "money" && moneyStats && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                Income Sources
              </h3>
              {incomePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={incomePie}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
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

            <div className="card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                Where Money Goes
              </h3>
              {expensePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={expensePie}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
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

          <div className="card">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">
              Monthly Trend (Last 6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={moneyStats.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Expense"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {moneyStats.bestMonth && (
            <div className="card bg-gradient-to-br from-emerald-50 to-brand-50 dark:from-emerald-900/20 dark:to-brand-900/20 border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <Star size={22} />
                </div>
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold uppercase tracking-wide">
                    Best month
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {moneyStats.bestMonth.month} — $
                    {moneyStats.bestMonth.income.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}