import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  Megaphone,
  Target,
  Wallet,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Users,
  Receipt,
  BarChart3,
  Bell,
  Moon,
  Sun,
  Mail,
  User as UserIcon,
  Plus,Search,Award,
} from "lucide-react";
import AIChat from "./AIChat";
import NotificationBell from "./NotificationBell";
import useTheme from "../hooks/useTheme";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/events", icon: Calendar, label: "Events" },
  { to: "/merch", icon: ShoppingBag, label: "Merch Store" },
  { to: "/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/fundraiser", icon: Target, label: "Fundraisers" },
  { to: "/members", icon: Users, label: "Members" },
  { to: "/reimbursements", icon: Receipt, label: "Reimbursements" },
  { to: "/finance", icon: Wallet, label: "Finance", roles: ["admin", "treasurer"] },
  { to: "/analytics", icon: BarChart3, label: "Analytics", roles: ["admin"] },
  { to: "/send-email", icon: Mail, label: "Send Email", roles: ["admin"] },
  { to: "/portfolio", icon: Award, label: "My Portfolio" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* SIDEBAR */}
<aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 bg-gradient-to-b from-brand-700 via-brand-800 to-indigo-900 border-r border-brand-900/50 z-30 shadow-xl">        <Sidebar user={user} onLogout={handleLogout} items={visibleItems} />
      </aside>

      {/* MOBILE SIDEBAR */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
<aside className="fixed left-0 top-0 h-screen w-60 bg-white dark:bg-slate-900 z-50 lg:hidden animate-slide-up">            <Sidebar
              user={user}
              onLogout={handleLogout}
              items={visibleItems}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      {/* MAIN */}
      <div className="lg:ml-60">
        <header className="sticky top-0 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
  <div className="h-[72px] px-4 lg:px-6 flex items-center gap-4">
    {/* LEFT: Mobile menu + Avatar + Welcome */}
    <div className="flex items-center gap-3 flex-shrink-0">
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
      >
        <Menu size={20} className="text-slate-700 dark:text-slate-300" />
      </button>

      {/* Avatar */}
      <button
        onClick={() => navigate("/profile")}
        className="relative group"
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-11 h-11 rounded-xl object-cover ring-2 ring-brand-100 dark:ring-brand-900/50 group-hover:ring-brand-300 transition"
          />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white flex items-center justify-center font-bold ring-2 ring-brand-100 dark:ring-brand-900/50 group-hover:ring-brand-300 transition">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        )}
        {/* Online indicator dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
      </button>

      {/* Welcome text */}
      <div className="hidden md:block">
        <h2 className="font-bold text-slate-800 dark:text-white text-base leading-tight">
          Welcome, {user?.name?.split(" ")[0]}
        </h2>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {user?.role}
          </span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className={`text-[10px] font-semibold ${user?.duesPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {user?.duesPaid ? "✅ Dues paid" : "⚠️ Dues pending"}
          </span>
        </div>
      </div>
    </div>

    {/* CENTER: Search bar */}
    <div className="flex-1 max-w-xl hidden md:block">
      <div className="relative group">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition"
        />
        <input
          type="text"
          placeholder="Search events, members, orders..."
          className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-transparent focus:border-brand-300 dark:focus:border-brand-700 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 transition"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 font-mono">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </div>
    </div>

    {/* RIGHT: Actions */}
    <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
      {/* Quick create button (admin/volunteer) */}
      {["admin", "volunteer"].includes(user?.role) && (
        <button
          onClick={() => navigate("/events")}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white text-sm font-semibold shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 transition-all active:scale-95"
        >
          <Plus size={15} />
          <span>New</span>
        </button>
      )}

      {/* Notification bell */}
      <NotificationBell />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
        title={dark ? "Light mode" : "Dark mode"}
      >
        {dark ? (
          <Sun size={18} className="text-amber-500" />
        ) : (
          <Moon size={18} className="text-slate-500" />
        )}
      </button>
    </div>
  </div>

  {/* Bottom gradient accent line */}
  <div className="h-[2px] bg-gradient-to-r from-brand-500 via-accent-500 to-emerald-500 opacity-80"></div>
</header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>

      <AIChat />
    </div>
  );
}

function Sidebar({ user, onLogout, items, onClose }) {
  return (
    <>
      {/* BRAND */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/skyline-logo.png"
            alt="Skyline"
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-white/20"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <div className="hidden w-9 h-9 rounded-xl bg-white/10 backdrop-blur items-center justify-center text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">
              Skyline
            </h1>
            <p className="text-[10px] text-blue-200 uppercase tracking-wide font-semibold">
              Club OS
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition"
          >
            <X size={16} className="text-white" />
          </button>
        )}
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                isActive
                  ? "bg-white text-brand-700 shadow-lg shadow-black/20"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <item.icon size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={() => {
            window.location.href = "/profile";
            onClose?.();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-100 hover:bg-white/10 hover:text-white font-medium text-sm transition"
        >
          <UserIcon size={17} />
          My Profile
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-200 hover:bg-red-500/20 hover:text-white font-medium text-sm transition"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </>
  );
}