import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Calendar,
  MapPin,
  Users,
  Ticket as TicketIcon,
  ArrowLeft,
  Download,
  CheckCircle2,
  Cpu,
  Backpack,
  ListChecks,
  QrCode,
  BarChart3,
  UserCheck,
  X,
  Copy,
  Phone,
  Wallet,
  Upload,
  Image as ImgIcon,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";

const COLOR_MAP = {
  indigo: "from-indigo-500 to-indigo-700",
  emerald: "from-emerald-500 to-emerald-700",
  amber: "from-amber-500 to-amber-700",
  rose: "from-rose-500 to-rose-700",
  purple: "from-purple-500 to-purple-700",
  brand: "from-brand-500 to-brand-700",
};

const STATUS_STYLES = {
  pending: "badge-warning",
  paid: "badge-success",
  rejected: "badge-danger",
  refunded: "badge-info",
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("details");
  const [eventTickets, setEventTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Buy flow
  const [buyModal, setBuyModal] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentNote, setPaymentNote] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [submittingProof, setSubmittingProof] = useState(false);

  // My ticket
  const [myTicket, setMyTicket] = useState(null);

  const isAdmin = ["admin", "treasurer"].includes(user?.role);
  const isMember = user?.duesPaid && user?.membershipStatus === "active";

  useEffect(() => {
    API.get(`/events/${id}`).then((r) => {
      setEvent(r.data);
      setSelectedType(r.data.ticketTypes[0]);
    });
    API.get("/auth/payment-info").then((r) => setPaymentInfo(r.data));

    // Load user's ticket for this event (if any)
    if (user) {
      API.get("/tickets/my").then((r) => {
        const t = r.data.find((x) => x.event?._id === id);
        if (t) setMyTicket(t);
      });
    }
  }, [id, user]);

  // Reload event tickets when admin views Tickets tab
  useEffect(() => {
    if (tab === "tickets" && isAdmin && id) {
      setTicketsLoading(true);
      API.get(`/tickets/event/${id}`)
        .then((r) => setEventTickets(r.data))
        .catch(() => toast.error("Failed to load tickets"))
        .finally(() => setTicketsLoading(false));
    }
  }, [tab, isAdmin, id]);

  // ============ CREATE TICKET ============
  const startBuy = async () => {
    if (!user) return navigate("/login");
    setLoading(true);
    try {
      const { data } = await API.post("/tickets/buy", {
        eventId: id,
        ticketType: selectedType.name,
      });
      setCreatedTicket(data);
      setBuyModal(true);
      toast.success("Ticket reserved! Complete payment to confirm.");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  // ============ SUBMIT PAYMENT PROOF ============
  const submitProof = async () => {
    if (!createdTicket) return;
    setSubmittingProof(true);
    try {
      // Upload proof image if provided
      if (proofFile) {
        const fd = new FormData();
        fd.append("image", proofFile);
        fd.append("folder", "skyline-payment-proofs");
        const { data: up } = await API.post("/upload/image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await API.post(`/tickets/${createdTicket._id}/proof`, {
          proofUrl: up.url,
        });
      }

      await API.post(`/tickets/${createdTicket._id}/submit-payment`, {
        paymentNote: paymentNote || "Paid via UPI",
      });

      toast.success("✅ Payment submitted! Waiting for admin confirmation.");
      setMyTicket({ ...createdTicket, paymentStatus: "pending" });
      setBuyModal(false);
      setCreatedTicket(null);
      setProofFile(null);
      setPaymentNote("");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to submit");
    } finally {
      setSubmittingProof(false);
    }
  };

  // ============ ADMIN: CONFIRM PAYMENT ============
  const confirmPayment = async (ticketId) => {
    if (!confirm("Confirm this payment? This will release the QR code.")) return;
    try {
      await API.put(`/tickets/${ticketId}/confirm`);
      toast.success("✅ Payment confirmed!");
      const r = await API.get(`/tickets/event/${id}`);
      setEventTickets(r.data);
      API.get(`/events/${id}`).then((r) => setEvent(r.data));
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    }
  };

  // ============ ADMIN: REJECT ============
  const rejectPayment = async (ticketId) => {
    if (!confirm("Reject this payment claim?")) return;
    try {
      await API.put(`/tickets/${ticketId}/reject`);
      toast.success("Rejected");
      const r = await API.get(`/tickets/event/${id}`);
      setEventTickets(r.data);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    }
  };

  // ============ RECEIPT PDF ============
  const downloadReceipt = () => {
    if (!myTicket) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Skyline Student Association", 14, 20);
    doc.setFontSize(12);
    doc.text("Ticket Receipt", 14, 28);
    doc.line(14, 32, 196, 32);
    doc.setFontSize(11);
    doc.text(`Name: ${user?.name}`, 14, 44);
    doc.text(`Email: ${user?.email}`, 14, 52);
    doc.text(`Event: ${event.title}`, 14, 60);
    doc.text(
      `Date: ${format(new Date(event.eventDate || event.date), "PPP")}`,
      14,
      68
    );
    doc.text(`Venue: ${event.venue}`, 14, 76);
    doc.text(`Ticket Type: ${myTicket.ticketType}`, 14, 84);
    doc.text(`Amount Paid: $${myTicket.price?.toFixed(2)}`, 14, 92);
    doc.text(`Reference: ${myTicket.referenceId || "—"}`, 14, 100);
    doc.text(`Status: ${myTicket.paymentStatus.toUpperCase()}`, 14, 108);
    doc.line(14, 118, 196, 118);
    doc.setFontSize(9);
    doc.text("Show the QR code at the entrance.", 14, 126);
    doc.save(`skyline-ticket-${myTicket._id.slice(-6)}.pdf`);
    toast.success("Receipt downloaded!");
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const color = COLOR_MAP[event.bannerColor] || COLOR_MAP.brand;
  const eventDate = event.eventDate || event.date;
  const price = isMember
    ? selectedType?.memberPrice ?? selectedType?.price
    : selectedType?.price;

  const tabs = [
    { id: "details", label: "Details", icon: ListChecks },
    ...(isAdmin
      ? [
          { id: "tickets", label: "Tickets", icon: TicketIcon },
          { id: "report", label: "Report", icon: BarChart3 },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 font-medium text-sm"
      >
        <ArrowLeft size={16} /> Back to events
      </button>

      {/* HERO */}
      <div className="card overflow-hidden !p-0">
        <div
          className={`relative h-64 ${
            event.image ? "" : `bg-gradient-to-br ${color}`
          } p-8 flex flex-col justify-end overflow-hidden`}
        >
          {event.image && (
            <>
              <img
                src={event.image}
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </>
          )}
          {!event.image && (
            <div className="absolute inset-0 opacity-25">
              <div className="absolute -top-10 -left-10 w-60 h-60 bg-white/50 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-16 right-0 w-80 h-80 bg-white/40 rounded-full blur-3xl"></div>
            </div>
          )}
          <div className="relative z-10">
            {event.tagline && (
              <p className="text-xs text-white/80 uppercase font-bold tracking-widest mb-2">
                {event.tagline}
              </p>
            )}
            <h1 className="text-4xl font-bold text-white mb-3">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-white/90 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {format(new Date(eventDate), "PPP")}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {event.venue}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={14} /> {event.ticketsSold}/{event.capacity} registered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      {isAdmin && (
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                  tab === t.id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-300"
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* DETAILS TAB */}
          {tab === "details" && (
            <>
              <div className="card">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
                  About this event
                </h2>
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>

              <div className="card">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                  Event Details
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Eligibility
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">
                      {event.eligibility || "Open to all"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Entry
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">
                      {event.isFree
                        ? "🎉 Free"
                        : `💰 From $${event.ticketTypes[0]?.price || 0}`}
                    </p>
                  </div>
                  {event.eventStartTime && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Time
                      </p>
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">
                        {event.eventStartTime} – {event.eventEndTime}
                      </p>
                    </div>
                  )}
                  {event.contactEmail && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Contact
                      </p>
                      <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                        {event.contactEmail}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {event.rules?.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                    📋 Rules & Guidelines
                  </h2>
                  <ul className="space-y-2">
                    {event.rules.map((rule, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <CheckCircle2
                          size={16}
                          className="text-emerald-500 flex-shrink-0 mt-0.5"
                        />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {event.techRequired?.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Cpu size={18} /> Tech Required
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {event.techRequired.map((t, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {event.thingsToBring?.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Backpack size={18} /> Things to Bring
                  </h2>
                  <ul className="space-y-2">
                    {event.thingsToBring.map((t, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <CheckCircle2
                          size={16}
                          className="text-brand-500 flex-shrink-0 mt-0.5"
                        />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* TICKETS TAB (admin) */}
          {tab === "tickets" && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Registered Tickets
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {eventTickets.length} total ·{" "}
                    {
                      eventTickets.filter((t) => t.paymentStatus === "paid")
                        .length
                    }{" "}
                    paid ·{" "}
                    {
                      eventTickets.filter((t) => t.paymentStatus === "pending")
                        .length
                    }{" "}
                    pending
                  </p>
                </div>
              </div>

              {ticketsLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
                </div>
              ) : eventTickets.length === 0 ? (
                <div className="text-center py-12">
                  <TicketIcon
                    size={40}
                    className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
                  />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    No tickets yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventTickets.map((t) => (
                    <div
                      key={t._id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {t.user?.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-white truncate">
                              {t.user?.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {t.user?.email}
                            </p>
                            {t.user?.phone && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                📞 {t.user.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={
                              STATUS_STYLES[t.paymentStatus] ||
                              "badge-warning"
                            }
                          >
                            {t.paymentStatus}
                          </span>
                          {t.checkedIn && (
                            <span className="badge-success flex items-center gap-1">
                              <UserCheck size={10} /> Attended
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>🎫 {t.ticketType}</span>
                        <span>💵 ${t.price?.toFixed(2)}</span>
                        {t.referenceId && (
                          <span className="font-mono">#{t.referenceId}</span>
                        )}
                      </div>

                      {t.paymentProof && (
                        <a
                          href={t.paymentProof}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block"
                        >
                          <img
                            src={t.paymentProof}
                            alt="proof"
                            className="w-full max-w-xs h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                          />
                          <p className="text-xs text-brand-600 mt-1">
                            Click to view full proof
                          </p>
                        </a>
                      )}

                      {t.paymentNote && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                          "{t.paymentNote}"
                        </p>
                      )}

                      {t.paymentStatus === "pending" && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                          <button
                            onClick={() => confirmPayment(t._id)}
                            className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 size={12} /> Confirm Payment
                          </button>
                          <button
                            onClick={() => rejectPayment(t._id)}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REPORT TAB */}
          {tab === "report" && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Event Report
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Attendance and revenue
                  </p>
                </div>
                <a
                  href={`/events/${event._id}/report`}
                  className="btn-primary text-sm"
                >
                  Full Report →
                </a>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-center">
                  <p className="text-2xl font-bold text-brand-700 dark:text-brand-300">
                    {event.ticketsSold}
                  </p>
                  <p className="text-xs text-brand-700 dark:text-brand-300 mt-1">
                    Paid
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-center">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {eventTickets.filter((t) => t.checkedIn).length || 0}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    Attended
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-center">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {eventTickets.filter((t) => t.paymentStatus === "pending").length || 0}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Pending
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — BUY PANEL */}
        <div className="space-y-4">
          {!myTicket ? (
            <div className="card sticky top-24">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                {event.isFree ? "Register" : "Get your ticket"}
              </h3>

              {!user && (
                <div className="mb-4 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800">
                  <p className="text-xs text-brand-700 dark:text-brand-300 font-semibold">
                    🔒 Sign in to register
                  </p>
                </div>
              )}

              {isMember && !event.isFree && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                    🎉 Member discount applied
                  </p>
                </div>
              )}

              {!event.isFree && (
                <div className="space-y-2 mb-4">
                  {event.ticketTypes.map((t) => {
                    const p = isMember ? t.memberPrice ?? t.price : t.price;
                    return (
                      <button
                        key={t.name}
                        onClick={() => setSelectedType(t)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition ${
                          selectedType?.name === t.name
                            ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                          {t.name}
                        </span>
                        <span className="font-bold text-brand-600 dark:text-brand-400">
                          {p === 0 ? "FREE" : `$${p}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">
                    {event.isFree
                      ? "FREE"
                      : price === 0
                      ? "FREE"
                      : `$${price}`}
                  </span>
                </div>
              </div>

              <button
                onClick={startBuy}
                disabled={loading || event.ticketsSold >= event.capacity}
                className="btn-primary w-full py-3"
              >
                {loading
                  ? "Processing..."
                  : event.ticketsSold >= event.capacity
                  ? "Sold out"
                  : !user
                  ? "Sign in to register"
                  : event.isFree
                  ? "🎉 Register (Free)"
                  : "Reserve & Pay"}
              </button>

              {!event.isFree && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
                  You'll see payment details after reserving
                </p>
              )}
            </div>
          ) : (
            <div className="card sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white">
                  Your Ticket
                </h3>
                <span className={STATUS_STYLES[myTicket.paymentStatus]}>
                  {myTicket.paymentStatus}
                </span>
              </div>

              {myTicket.paymentStatus === "pending" && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <Clock
                      size={16}
                      className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                        Waiting for admin verification
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        Your QR code will be activated once payment is confirmed
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {myTicket.paymentStatus === "rejected" && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      size={16}
                      className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-semibold text-red-900 dark:text-red-200">
                        Payment rejected
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                        Contact the club admin to resolve
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* QR shown only when paid */}
              {myTicket.paymentStatus === "paid" && myTicket.qrCode ? (
                <>
                  <div className="text-center mb-4">
                    <img
                      src={myTicket.qrCode}
                      alt="QR"
                      className="w-full max-w-[200px] mx-auto rounded-xl border-4 border-slate-100 dark:border-slate-700"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                      Ticket #{myTicket._id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={downloadReceipt}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Receipt
                  </button>
                </>
              ) : myTicket.paymentStatus === "pending" ? (
                <div className="py-6 text-center">
                  <QrCode
                    size={48}
                    className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    QR unlocked after confirmation
                  </p>
                </div>
              ) : null}

              {myTicket.referenceId && (
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">
                  <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                    Reference
                  </p>
                  <p className="font-mono font-bold text-slate-800 dark:text-white">
                    {myTicket.referenceId}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============ PAYMENT MODAL ============ */}
      {buyModal && createdTicket && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card max-w-lg w-full my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-white">
                  Complete Payment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pay via UPI and submit proof to confirm
                </p>
              </div>
              <button
                onClick={() => {
                  setBuyModal(false);
                  setCreatedTicket(null);
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Amount */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white text-center mb-4">
              <p className="text-xs opacity-80">Amount to pay</p>
              <p className="text-3xl font-bold mt-1">
                ${createdTicket.price?.toFixed(2)}
              </p>
              <p className="text-xs opacity-80 mt-2">
                {createdTicket.ticketType} · Ref: {createdTicket.referenceId}
              </p>
            </div>

            {/* UPI details */}
            {paymentInfo && (
              <div className="space-y-3 mb-4">
                {paymentInfo.upiId && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      UPI ID
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono font-bold text-slate-800 dark:text-white truncate">
                        {paymentInfo.upiId}
                      </p>
                      <button
                        onClick={() => copy(paymentInfo.upiId)}
                        className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg"
                        title="Copy"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {paymentInfo.paymentPhone && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Phone size={10} /> Contact admin (WhatsApp proof)
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-800 dark:text-white">
                        {paymentInfo.paymentPhone}
                      </p>
                      <a
                        href={`https://wa.me/${paymentInfo.paymentPhone.replace(
                          /\D/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Optional proof upload */}
            <div className="mb-4">
              <label className="label">Upload payment screenshot (optional)</label>
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-brand-400 cursor-pointer transition">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files[0])}
                />
                {proofFile ? (
                  <>
                    <ImgIcon size={20} className="text-brand-600" />
                    <span className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">
                      {proofFile.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Click to upload
                    </span>
                  </>
                )}
              </label>
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="label">Note to admin (optional)</label>
              <input
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="input"
                placeholder="e.g., Paid via GPay from 9876543210"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBuyModal(false);
                  setCreatedTicket(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={submitProof}
                disabled={submittingProof}
                className="btn-primary flex-1"
              >
                {submittingProof ? "Submitting..." : "I've paid — Submit"}
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mt-3">
              Your ticket will be activated once the admin confirms payment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}