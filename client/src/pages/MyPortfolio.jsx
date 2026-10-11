import { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Award, Calendar, Target, TrendingUp, Download,
  CheckCircle2, Clock, Medal, Trophy, Star,
  User as UserIcon, Mail, Wallet, Flame,
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";

const CATEGORY_STYLES = {
  participation: { icon: Medal, color: "from-blue-500 to-indigo-600", label: "Participation" },
  achievement: { icon: Star, color: "from-amber-500 to-orange-600", label: "Achievement" },
  completion: { icon: CheckCircle2, color: "from-emerald-500 to-teal-600", label: "Completion" },
  winner: { icon: Trophy, color: "from-purple-500 to-pink-600", label: "Winner" },
  volunteer: { icon: Flame, color: "from-rose-500 to-red-600", label: "Volunteer" },
};

export default function MyPortfolio() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/portfolio/me")
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load portfolio"))
      .finally(() => setLoading(false));
  }, []);

  const downloadCertificate = (cert) => {
    const doc = new jsPDF({ orientation: "landscape" });

    // Border
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(3);
    doc.rect(10, 10, 277, 190);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 267, 180);

    // Title
    doc.setFontSize(40);
    doc.setTextColor(79, 70, 229);
    doc.text("CERTIFICATE", 148, 45, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text("OF ACHIEVEMENT", 148, 55, { align: "center" });

    // Awarded to
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text("This certificate is proudly presented to", 148, 80, { align: "center" });

    doc.setFontSize(28);
    doc.setTextColor(15, 23, 42);
    doc.text(cert.user?.name || user.name, 148, 100, { align: "center" });

    // Underline
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(80, 105, 216, 105);

    // Description
    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105);
    const desc = cert.description || `For ${cert.title}`;
    doc.text(desc, 148, 120, { align: "center", maxWidth: 200 });

    // Position/Title
    if (cert.position) {
      doc.setFontSize(18);
      doc.setTextColor(234, 88, 12);
      doc.text(cert.position, 148, 140, { align: "center" });
    }

    // Date
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Issued on ${format(new Date(cert.issuedAt), "MMMM d, yyyy")}`,
      40,
      175
    );

    // Signature
    doc.text("Skyline Student Association", 230, 175, { align: "right" });
    doc.setDrawColor(150);
    doc.line(220, 168, 275, 168);

    // Verification
    doc.setFontSize(8);
    doc.text(`Verification: ${cert.verificationCode}`, 148, 195, { align: "center" });

    doc.save(`certificate-${cert.title.replace(/\s+/g, "-")}.pdf`);
    toast.success("Certificate downloaded!");
  };

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
        <p className="text-slate-500 dark:text-slate-400">Could not load portfolio</p>
      </div>
    );
  }

  const { stats, certificates, eventsAttended, eventsUpcoming, fundraisers } = data;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ============ HERO PROFILE ============ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-purple-600 to-indigo-700 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 p-8">
          <div className="flex items-center gap-4 flex-wrap">
            {data.user.avatar ? (
              <img
                src={data.user.avatar}
                alt={data.user.name}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-3xl font-bold">
                {data.user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold">{data.user.name}</h1>
              <p className="text-white/80 text-sm mt-1 flex items-center gap-2 flex-wrap">
                <Mail size={14} /> {data.user.email}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-xs font-bold uppercase">
                  {data.user.role}
                </span>
                {data.user.duesPaid ? (
                  <span className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold">
                    ✅ Active member
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold">
                    ⚠️ Dues pending
                  </span>
                )}
                <span className="text-xs text-white/80">
                  Member since {format(new Date(data.user.memberSince), "MMM yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ STATS ============ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-900/30 dark:to-brand-900/10 border-brand-200/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Events Attended</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.eventsAttended}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-900/30 dark:to-orange-900/10 border-amber-200/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Award size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Certificates</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.certificatesEarned}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-emerald-50 to-teal-100/50 dark:from-emerald-900/30 dark:to-teal-900/10 border-emerald-200/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Target size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Fundraisers</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.fundraisersJoined}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-fuchsia-100/50 dark:from-purple-900/30 dark:to-fuchsia-900/10 border-purple-200/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Upcoming</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.eventsUpcoming}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ CERTIFICATES ============ */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg">
            <Award size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              My Certificates
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {certificates.length} certificate{certificates.length !== 1 ? "s" : ""} earned
            </p>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="card text-center py-12">
            <Award size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 mb-1">No certificates yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Attend events and participate to earn certificates
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {certificates.map((cert) => {
              const style = CATEGORY_STYLES[cert.category] || CATEGORY_STYLES.participation;
              const Icon = style.icon;
              return (
                <div
                  key={cert._id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Gradient top bar */}
                  <div className={`h-2 bg-gradient-to-r ${style.color}`} />

                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.color} text-white flex items-center justify-center flex-shrink-0 shadow-lg`}
                      >
                        <Icon size={26} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {style.label}
                          </span>
                          {cert.position && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase">
                              {cert.position}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">
                          {cert.title}
                        </h3>
                        {cert.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {cert.description}
                          </p>
                        )}
                        {cert.event?.title && (
                          <p className="text-xs text-brand-600 dark:text-brand-400 mt-1 font-medium">
                            📅 {cert.event.title}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-2">
                          Issued {format(new Date(cert.issuedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => downloadCertificate(cert)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-brand-600 hover:text-white text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all active:scale-95"
                    >
                      <Download size={16} />
                      Download PDF Certificate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ EVENTS ATTENDED ============ */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white flex items-center justify-center shadow-lg">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Events I've Attended
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {eventsAttended.length} event{eventsAttended.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {eventsAttended.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 mb-1">No events attended yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Browse events and register to start your journey
            </p>
          </div>
        ) : (
          <div className="card">
            <div className="space-y-3">
              {eventsAttended.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white truncate">
                      {t.event?.title || "Event"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.event?.eventDate &&
                        format(new Date(t.event.eventDate), "PPP")}
                      {t.event?.venue && ` · ${t.event.venue}`}
                    </p>
                  </div>
                  <span className="badge-success flex-shrink-0">
                    ✓ Attended
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============ UPCOMING EVENTS ============ */}
      {eventsUpcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white flex items-center justify-center shadow-lg">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Upcoming Events
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {eventsUpcoming.length} registered
              </p>
            </div>
          </div>

          <div className="card">
            <div className="space-y-3">
              {eventsUpcoming.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white flex items-center justify-center flex-shrink-0">
                    <Clock size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white truncate">
                      {t.event?.title || "Event"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.event?.eventDate &&
                        format(new Date(t.event.eventDate), "PPP")}
                    </p>
                  </div>
                  <span className="badge-info flex-shrink-0">Registered</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}