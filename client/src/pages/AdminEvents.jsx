import { useState, useEffect } from "react";
import API from "../api";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  X,
  Palette,
  ListChecks,
  Users,
  Cpu,
  DollarSign,
  Calendar as CalendarIcon,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  Backpack,
  Tag,
  Clock,
  Image as ImgIcon,
} from "lucide-react";
import { format } from "date-fns";

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

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = () => API.get("/events").then((r) => setEvents(r.data));
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

  const remove = async (id) => {
    if (!confirm("Delete this event?")) return;
    await API.delete(`/events/${id}`);
    toast.success("Deleted");
    load();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Manage Events
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Create events with full details
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((e) => {
          const color = COLORS.find((c) => c.name === e.bannerColor) || COLORS[5];
          return (
            <div key={e._id} className="card overflow-hidden !p-0">
              <div
                className={`h-40 ${
                  e.image ? "" : `bg-gradient-to-br ${color.bg}`
                } relative`}
              >
                {e.image ? (
                  <img src={e.image} alt={e.title} className="w-full h-full object-cover" />
                ) : null}
                <div className="absolute top-3 left-3 flex gap-1">
                  <span className="px-2 py-1 rounded-md bg-black/40 backdrop-blur text-white text-[10px] font-bold uppercase">
                    {e.category || "other"}
                  </span>
                  {e.isPublished === false && (
                    <span className="px-2 py-1 rounded-md bg-amber-500 text-white text-[10px] font-bold uppercase">
                      Draft
                    </span>
                  )}
                </div>
                {!e.image && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-lg line-clamp-2">
                      {e.title}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-800 dark:text-white mb-1">
                  {e.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  📅 {format(new Date(e.eventDate), "PPP")}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                  {e.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {e.ticketsSold}/{e.capacity} registered
                  </span>
                  <button
                    onClick={() => remove(e._id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="col-span-full card text-center py-16">
            <p className="text-slate-500 dark:text-slate-400">No events yet</p>
          </div>
        )}
      </div>

      {/* ============ FORM MODAL ============ */}
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
              {/* 1. BANNER PREVIEW */}
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
                    <img src={form.image} alt="banner" className="w-full h-full object-cover" />
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
                      {form.eventDate ? format(new Date(form.eventDate), "PPP") : "Event date"}{" "}
                      · {form.venue || "Venue"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. BANNER COLOR */}
              <div>
                <label className="label flex items-center gap-2">
                  <Palette size={14} /> Banner Color (used if no image)
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

              {/* 3. BANNER IMAGE URL */}
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

              {/* 4. BASICS */}
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

              {/* 5. TIMELINE */}
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

              {/* 6. VENUE */}
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

              {/* 7. ELIGIBILITY */}
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

                {form.eligibility === "Teams of 2-4" && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Min team size
                      </p>
                      <input
                        type="number"
                        value={form.teamSize.min}
                        onChange={(e) =>
                          setField("teamSize", {
                            ...form.teamSize,
                            min: Number(e.target.value),
                          })
                        }
                        className="input"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Max team size
                      </p>
                      <input
                        type="number"
                        value={form.teamSize.max}
                        onChange={(e) =>
                          setField("teamSize", {
                            ...form.teamSize,
                            max: Number(e.target.value),
                          })
                        }
                        className="input"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 8. ENTRY FEE */}
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
                      placeholder="Type (VIP)"
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

              {/* 9. TECH REQUIRED */}
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
                        placeholder={`e.g., "React", "Python", "Node.js"`}
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

              {/* 10. SKILLS REQUIRED */}
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
                        placeholder={`e.g., "Basic programming", "Public speaking"`}
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

              {/* 11. THINGS TO BRING */}
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

              {/* 12. RULES */}
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

              {/* 13. CONTACT */}
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