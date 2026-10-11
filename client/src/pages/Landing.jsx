import { Link } from "react-router-dom";
import {
  GraduationCap, QrCode, Users, Wallet, Sparkles,
  ShoppingBag, ArrowRight, Calendar, Target, Megaphone,
  CheckCircle2, TrendingUp, Zap, Shield,
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Users,
      title: "Member Management",
      desc: "Digital memberships, dues tracking, auto-renewal reminders. Know who's in and who owes what.",
    },
    {
      icon: Calendar,
      title: "Event Ticketing",
      desc: "Sell tickets online with member pricing. Automatic capacity limits and instant receipts.",
    },
    {
      icon: QrCode,
      title: "QR Check-In",
      desc: "Scan tickets in seconds at the door. No printed lists. Live attendance tracking.",
    },
    {
      icon: ShoppingBag,
      title: "Merch Store",
      desc: "Sizes, stock, orders — auto-managed. Member discounts applied automatically.",
    },
    {
      icon: Wallet,
      title: "Finance Dashboard",
      desc: "Every dollar tracked. Income, expenses, balance — with running ledger and PDF reports.",
    },
    {
      icon: Target,
      title: "Fundraiser Boards",
      desc: "Assign tasks to volunteers. Track progress live. Hit milestones with email notifications.",
    },
    {
      icon: Megaphone,
      title: "Smart Announcements",
      desc: "One post reaches everyone — in-app, by email, and via real-time notification bell.",
    },
    {
      icon: Sparkles,
      title: "AI Assistant",
      desc: "Ask 'How much did we raise?' — get instant answers from live club data.",
    },
  ];

  const stats = [
    { number: "5+", label: "Tools replaced" },
    { number: "10s", label: "Ticket check-in" },
    { number: "100%", label: "Money transparency" },
    { number: "AI", label: "Instant insights" },
  ];

  const steps = [
    {
      icon: Zap,
      title: "Sign up in 30 seconds",
      desc: "Members self-register. Admins can also create accounts on the spot at campus tables.",
    },
    {
      icon: Shield,
      title: "Role-based access",
      desc: "Members, Volunteers, Treasurers, and Admins each get a tailored view — only what they need.",
    },
    {
      icon: TrendingUp,
      title: "Run everything from one place",
      desc: "Events, tickets, merch, money, and communication — no more juggling 8 different tools.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* ============ NAV ============ */}
      <nav className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-40 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/skyline-logo.png"
              alt="Skyline"
              className="w-10 h-10 rounded-xl object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div className="hidden w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 items-center justify-center text-white">
              <GraduationCap size={22} />
            </div>
            <span className="font-bold text-slate-800 dark:text-white text-lg">
              Skyline
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 px-4 py-2 transition"
            >
              Sign in
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800" />
        <div className="absolute top-20 -left-20 w-96 h-96 bg-brand-200/40 dark:bg-brand-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-accent-200/40 dark:bg-accent-900/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6 border border-brand-200 dark:border-brand-800">
            <Sparkles size={14} />
            Powered by AI
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
            Run your club
            <br />
            <span className="bg-gradient-to-r from-brand-600 via-accent-500 to-emerald-500 bg-clip-text text-transparent">
              like a pro.
            </span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            One unified platform for members, events, tickets, merch, and money.
            Say goodbye to spreadsheets, notebooks, and WhatsApp chaos.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
            <Link
              to="/register"
              className="btn-primary text-base px-8 py-3.5 flex items-center gap-2"
            >
              Get started free <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="btn-secondary text-base px-8 py-3.5"
            >
              Sign in
            </Link>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Try demo: admin@skyline.edu · password123
          </p>
        </div>
      </section>

      {/* ============ FEATURES GRID ============ */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wide mb-4">
            Features
          </div>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything your club needs
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">
            8 essential tools replaced by 1 powerful platform. Zero chaos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:shadow-xl hover:-translate-y-1 hover:border-brand-200 dark:hover:border-brand-700 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/40 dark:to-accent-900/40 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-4 group-hover:from-brand-600 group-hover:to-accent-600 group-hover:text-white transition-all duration-300">
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs font-bold uppercase tracking-wide mb-4">
              How it works
            </div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Set up in minutes, not weeks
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="relative text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-brand-500/30">
                    <Icon size={28} />
                  </div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full md:translate-y-0 md:left-auto md:right-0 md:top-4 text-6xl font-bold text-slate-100 dark:text-slate-800 select-none">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2 relative">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto relative">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="bg-gradient-to-br from-brand-600 via-accent-600 to-indigo-700 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-5xl font-bold mb-2">{s.number}</div>
              <div className="text-white/80 text-sm uppercase tracking-wide font-semibold">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Ready to run your club better?
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
          Join student organizations that have ditched the chaos for one
          unified platform.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/register"
            className="btn-primary text-base px-8 py-3.5 flex items-center gap-2"
          >
            Create free account <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3.5">
            Sign in
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
          {[
            "No setup fees",
            "Free for clubs",
            "Works on any device",
          ].map((text) => (
            <div
              key={text}
              className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
            >
              <CheckCircle2 size={16} className="text-emerald-500" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-slate-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white">
                <GraduationCap size={22} />
              </div>
              <div>
                <p className="font-bold text-white">Skyline</p>
                <p className="text-xs text-slate-400">
                  Student Association System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <Link
                to="/login"
                className="text-slate-400 hover:text-white transition"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-slate-400 hover:text-white transition"
              >
                Register
              </Link>
              <a
                href="#"
                className="text-slate-400 hover:text-white transition"
              >
                Docs
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-500">
              Built with 💜 for campus clubs · © {new Date().getFullYear()}{" "}
              Skyline Student Association
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}