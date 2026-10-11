import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Plus,
  X,
  Palette,
  ListChecks,
  Cpu,
  DollarSign,
  Clock,
  Mail,
  Phone,
  Sparkles,
  Backpack,
  Tag,
  Image as ImgIcon,
  Search,
} from "lucide-react";
import { format } from "date-fns";

const COLOR_MAP = {
  indigo: "from-indigo-500 to-indigo-700",
  emerald: "from-emerald-500 to-emerald-700",
  amber: "from-amber-500 to-amber-700",
  rose: "from-rose-500 to-rose-700",
  purple: "from-purple-500 to-purple-700",
  brand: "from-brand-500 to-brand-700",
};

const COLORS = [
  { name: "indigo", label: "Indigo", bg: "from-indigo-500 to-indigo-700" },
  { name: "emerald", label: "Emerald", bg: "from-emerald-500 to-emerald-700" },
  { name: "amber", label: "Amber", bg: "from-amber-500 to-amber-700" },
  { name: "rose", label: "Rose", bg: "from-rose-500 to-rose-700" },
  { name: "purple", label: "Purple", bg: "from-purple-500 to-purple-700" },
  { name: "brand", label: "Skyline", bg: "from-brand-500 to-brand-700" },
];

const CATEGORIES = ["technical", "cultural", "sports", "social", "workshop", "other"];

const ELIGIBILITY = [
  "Open to all",
  "Members only",
  "Students only",
  "Teams of 2-4",
  "Invite only",
];

const emptyForm = {
  title: "",
  tagline: "",
  description: "",
  image: "",
  bannerColor: "brand",
  category: "technical",
  registrationOpensAt: new Date().toISOString().slice(0, 10),
  registrationClosesAt: "",
  eventDate: "",
  eventStartTime: "09:00",
  eventEndTime: "18:00",
  venue: "",
  eligibility: "Open to all",
  teamSize: { min: 2, max: 4 },
  capacity: 100,
  isFree: true,
  ticketTypes: [{ name: "General", price: 0, memberPrice: 0 }],
  techRequired: [""],
  skillsRequired: [""],
  thingsToBring: [""],
  rules: [""],
  contactEmail: "",
  contactPhone: "",
  organizerName: "",
  isPublished: true,
};

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const canCreate = ["admin", "treasurer"].includes(user?.role);

  const load = () => {
    API.get("/events").then((r) => {
      setEvents(r.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        techRequired: form.techRequired.filter((s) => s.trim()),
        skillsRequired: form.skillsRequired.filter((s) => s.trim()),
        thingsToBring: form.thingsToBring.filter((s) => s.trim()),
        rules: form.rules.filter((s) => s.trim()),
        teamSize:
          form.eligibility === "Teams of 2-4" ? form.teamSize : undefined,
      };
      await API.post("/events", payload);
      toast.success("Event created! 🎉");
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    }
  };

  const addToList = (key) => setField(key, [...form[key], ""]);
  const setListItem = (key, i, v) =>
    setField(
      key,
      form[key].map((x, idx) => (idx === i ? v : x))
    );
  const removeListItem = (key, i) =>
    setField(
      key,
      form[key].filter((_, idx) => idx !== i)
    );

  const selectedColor =
    COLORS.find((c) => c.name === form.bannerColor) || COLORS[5];

  // Filter events
  const filtered = events.filter((e) => {
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Events
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {canCreate
              ? "Browse, manage, and create club events"
              : "Browse and register for upcoming club events"}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-200 dark:shadow-brand-900/40"
          >
            <Plus size={18} />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="input pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              categoryFilter === "all"
                ? "bg-brand-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                categoryFilter === c
                  ? "bg-brand-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((e) => {
          const soldOut = e.ticketsSold >= e.capacity;
          const bg = COLOR_MAP[e.bannerColor] || COLOR_MAP.brand;
          return (
            <Link
              key={e._id}
              to={`/events/${e._id}`}
              className="card hover:shadow-lg transition-all group animate-fade-in overflow-hidden !p-0"
            >
              <div
                className={`h-40 ${
                  e.image ? "" : `bg-gradient-to-br ${bg}`
                } p-5 flex flex-col justify-end relative overflow-hidden`}
              >
                {e.image ? (
                  <>
                    <img
                      src={e.image}
                      alt={e.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  </>
                ) : (
                  <div className="absolute inset-0 opacity-25">
                    <div className="absolute -top-6 -left-6 w-40 h-40 bg-white/40 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-8 right-0 w-52 h-52 bg-white/30 rounded-full blur-2xl"></div>
                  </div>
                )}
                {e.category && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 rounded-md bg-black/40 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wide">
                      {e.category}
                    </span>
                  </div>
                )}
                <div className="relative z-10">
                  <p className="text-[10px] text-white/80 uppercase font-bold tracking-widest">
                    {format(new Date(e.eventDate || e.date), "MMM dd")}
                  </p>
                  <h3 className="text-white font-bold text-xl leading-tight line-clamp-2">
                    {e.title}
                  </h3>
                </div>
              </div>

              <div className="p-5">
                {e.tagline && (
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mb-2">
                    {e.tagline}
                  </p>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                  {e.description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {e.venue}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {e.ticketsSold}/{e.capacity}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {e.isFree ? "Entry" : "From"}
                    </p>
                    <p className="font-bold text-brand-600 dark:text-brand-400">
                      {e.isFree
                        ? "FREE"
                        : `$${Math.min(...e.ticketTypes.map((t) => t.price))}`}
                    </p>
                  </div>
                  {soldOut ? (
                    <span className="badge-danger">Sold out</span>
                  ) : (
                    <span className="badge-success flex items-center gap-1">
                      View <ArrowRight size={12} />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="card text-center py-16">
          <Calendar
            size={48}
            className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
          />
          <h3 className="font-bold text-slate-800 dark:text-white mb-1">
            No events found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            {events.length === 0
              ? canCreate
                ? "Create your first event to get started"
                : "Check back soon for upcoming events"
              : "Try a different category or search term"}
          </p>
          {canCreate && events.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={16} /> Create Event
            </button>
          )}
        </div>
      )}

      {/* Floating + button */}
      {canCreate && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-24 w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-300 dark:shadow-brand-900/50 hover:scale-110 active:scale-95 transition-transform flex items-center justify-center z-40"
          title="Create new event"
        >
          <Plus size={26} />
        </button>
      )}

      {/* ============ CREATE EVENT MODAL ============ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card max-w-4xl w-full my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-slate-800 pb-3 border-b border-slate-100 dark:border-slate-700 z-10">
              <div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-white">
                  Create New Event
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fill in the details — the banner updates live
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-6">
              {/* BANNER PREVIEW */}
              <div>
                <label className="label flex items-center gap-2">
                  <Sparkles size={14} /> Banner Preview
                </label>
                <div
                  className={`h-44 rounded-xl overflow-hidden relative ${
                    form.image ? "" : `bg-gradient-to-br ${selectedColor.bg}`
                  }`}
                >
                  {form.image ? (
                    <img
                      src={form.image}
                      alt="banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 opacity-25">
                      <div className="absolute -top-4 -left-4 w-40 h-40 bg-white/40 rounded-full blur-3xl"></div>
                      <div className="absolute -bottom-8 right-0 w-56 h-56 bg-white/30 rounded-full blur-3xl"></div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 rounded-md bg-black/40 backdrop-blur text-white text-[10px] font-bold uppercase">
                      {form.category}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <p className="text-xs text-white/80 uppercase font-semibold tracking-wider mb-1">
                      {form.tagline || "Tagline"}
                    </p>
                    <h3 className="text-white text-2xl font-bold">
                      {form.title || "Event Title"}
                    </h3>
                    <p className="text-white/80 text-xs mt-1">
                      {form.eventDate
                        ? format(new Date(form.eventDate), "PPP")
                        : "Event date"}{" "}
                      · {form.venue || "Venue"}
                    </p>
                  </div>
                </div>
              </div>

              {/* BANNER COLOR */}
              <div>
                <label className="label flex items-center gap-2">
                  <Palette size={14} /> Banner Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setField("bannerColor", c.name)}
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.bg} border-4 ${
                        form.bannerColor === c.name
                          ? "border-slate-800 dark:border-white scale-110"
                          : "border-transparent"
                      } transition-all`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* IMAGE URL */}
              <div>
                <label className="label flex items-center gap-2">
                  <ImgIcon size={14} /> Banner Image URL (optional)
                </label>
                <input
                  value={form.image}
                  onChange={(e) => setField("image", e.target.value)}
                  className="input"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              {/* BASICS */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Event Name *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    className="input"
                    placeholder="Hackathon 2026"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Tagline</label>
                  <input
                    value={form.tagline}
                    onChange={(e) => setField("tagline", e.target.value)}
                    className="input"
                    placeholder="Build. Ship. Win."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    className="input resize-none"
                    placeholder="What's this event about?"
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    <Tag size={14} /> Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    className="input capitalize"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="capitalize">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    <Users size={14} /> Capacity
                  </label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setField("capacity", Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              {/* TIMELINE */}
              <div>
                <label className="label flex items-center gap-2">
                  <CalendarIcon size={14} /> Timeline
                </label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Registration Opens
                    </p>
                    <input
                      type="date"
                      value={form.registrationOpensAt?.slice(0, 10) || ""}
                      onChange={(e) => setField("registrationOpensAt", e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Registration Closes
                    </p>
                    <input
                      type="date"
                      value={form.registrationClosesAt?.slice(0, 10) || ""}
                      onChange={(e) => setField("registrationClosesAt", e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Event Date *
                    </p>
                    <input
                      required
                      type="date"
                      value={form.eventDate?.slice(0, 10) || ""}
                      onChange={(e) => setField("eventDate", e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Clock size={10} /> Start
                      </p>
                      <input
                        type="time"
                        value={form.eventStartTime}
                        onChange={(e) => setField("eventStartTime", e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Clock size={10} /> End
                      </p>
                      <input
                        type="time"
                        value={form.eventEndTime}
                        onChange={(e) => setField("eventEndTime", e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* VENUE */}
              <div>
                <label className="label flex items-center gap-2">
                  <MapPin size={14} /> Venue *
                </label>
                <input
                  required
                  value={form.venue}
                  onChange={(e) => setField("venue", e.target.value)}
                  className="input"
                  placeholder="Innovation Lab, Block C"
                />
              </div>

              {/* ELIGIBILITY */}
              <div>
                <label className="label flex items-center gap-2">
                  <Users size={14} /> Who can participate?
                </label>
                <div className="flex flex-wrap gap-2">
                  {ELIGIBILITY.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setField("eligibility", opt)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        form.eligibility === opt
                          ? "bg-brand-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* FEE */}
              <div>
                <label className="label flex items-center gap-2">
                  <DollarSign size={14} /> Entry Fee
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setField("isFree", true)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      form.isFree
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    🎉 Free Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setField("isFree", false)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      !form.isFree
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    💰 Paid Entry
                  </button>
                </div>

                {!form.isFree && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <input
                      placeholder="Type"
                      value={form.ticketTypes[0].name}
                      onChange={(e) =>
                        setField("ticketTypes", [
                          { ...form.ticketTypes[0], name: e.target.value },
                        ])
                      }
                      className="input"
                    />
                    <input
                      type="number"
                      placeholder="Price $"
                      value={form.ticketTypes[0].price}
                      onChange={(e) =>
                        setField("ticketTypes", [
                          { ...form.ticketTypes[0], price: Number(e.target.value) },
                        ])
                      }
                      className="input"
                    />
                    <input
                      type="number"
                      placeholder="Member $"
                      value={form.ticketTypes[0].memberPrice}
                      onChange={(e) =>
                        setField("ticketTypes", [
                          {
                            ...form.ticketTypes[0],
                            memberPrice: Number(e.target.value),
                          },
                        ])
                      }
                      className="input"
                    />
                  </div>
                )}
              </div>

              {/* TECH REQUIRED */}
              <div>
                <label className="label flex items-center gap-2">
                  <Cpu size={14} /> Tech Stack Required
                </label>
                <div className="space-y-2">
                  {form.techRequired.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={t}
                        onChange={(e) => setListItem("techRequired", i, e.target.value)}
                        className="input"
                        placeholder={`e.g., "React", "Python"`}
                      />
                      {form.techRequired.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeListItem("techRequired", i)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addToList("techRequired")}
                    className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Add another
                  </button>
                </div>
              </div>

              {/* SKILLS */}
              <div>
                <label className="label flex items-center gap-2">
                  <Sparkles size={14} /> Skills Needed
                </label>
                <div className="space-y-2">
                  {form.skillsRequired.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={s}
                        onChange={(e) => setListItem("skillsRequired", i, e.target.value)}
                        className="input"
                        placeholder={`e.g., "Basic programming"`}
                      />
                      {form.skillsRequired.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeListItem("skillsRequired", i)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addToList("skillsRequired")}
                    className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Add another
                  </button>
                </div>
              </div>

              {/* THINGS TO BRING */}
              <div>
                <label className="label flex items-center gap-2">
                  <Backpack size={14} /> Things to Bring
                </label>
                <div className="space-y-2">
                  {form.thingsToBring.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={t}
                        onChange={(e) => setListItem("thingsToBring", i, e.target.value)}
                        className="input"
                        placeholder={`e.g., "Laptop", "Student ID"`}
                      />
                      {form.thingsToBring.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeListItem("thingsToBring", i)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addToList("thingsToBring")}
                    className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Add another
                  </button>
                </div>
              </div>

              {/* RULES */}
              <div>
                <label className="label flex items-center gap-2">
                  <ListChecks size={14} /> Rules / Guidelines
                </label>
                <div className="space-y-2">
                  {form.rules.map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={r}
                        onChange={(e) => setListItem("rules", i, e.target.value)}
                        className="input"
                        placeholder={`Rule ${i + 1}`}
                      />
                      {form.rules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeListItem("rules", i)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addToList("rules")}
                    className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Add another rule
                  </button>
                </div>
              </div>

              {/* CONTACT */}
              <div>
                <label className="label">Contact</label>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Users size={10} /> Organizer
                    </label>
                    <input
                      value={form.organizerName}
                      onChange={(e) => setField("organizerName", e.target.value)}
                      className="input"
                      placeholder="Tech Committee"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Mail size={10} /> Email
                    </label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setField("contactEmail", e.target.value)}
                      className="input"
                      placeholder="info@skyline.edu"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Phone size={10} /> Phone
                    </label>
                    <input
                      value={form.contactPhone}
                      onChange={(e) => setField("contactPhone", e.target.value)}
                      className="input"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Reuse `Calendar` icon for the header in empty state
function CalendarIcon() {
  return <Calendar />;
}