import { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Target,
  Plus,
  X,
  Users,
  UserPlus,
  UserMinus,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Search,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";

const COLUMNS = [
  {
    id: "todo",
    label: "To Do",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  },
  {
    id: "doing",
    label: "In Progress",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    id: "done",
    label: "Done",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
];

const CATEGORIES = [
  { id: "baking", label: "🍪 Baking", color: "bg-amber-100 text-amber-700" },
  { id: "shopping", label: "🛒 Shopping", color: "bg-blue-100 text-blue-700" },
  { id: "table", label: "🪑 Table Duty", color: "bg-purple-100 text-purple-700" },
  { id: "setup", label: "🔧 Setup", color: "bg-emerald-100 text-emerald-700" },
  { id: "cleanup", label: "🧹 Cleanup", color: "bg-slate-100 text-slate-700" },
  { id: "other", label: "📦 Other", color: "bg-slate-100 text-slate-600" },
];

const PRIORITIES = [
  { id: "low", label: "Low", color: "text-slate-500" },
  { id: "normal", label: "Normal", color: "text-brand-600" },
  { id: "high", label: "High", color: "text-red-600" },
];

// Due-date formatter with urgency colors
function DueBadge({ date }) {
  if (!date) return null;
  const d = new Date(date);
  let label = format(d, "MMM d");
  let color = "text-slate-500 dark:text-slate-400";

  if (isPast(d) && !isToday(d)) {
    color = "text-red-600 dark:text-red-400";
    label += " · Overdue";
  } else if (isToday(d)) {
    color = "text-amber-600 dark:text-amber-400";
    label = "Today";
  } else if (isTomorrow(d)) {
    color = "text-amber-600 dark:text-amber-400";
    label = "Tomorrow";
  }

  return (
    <span className={`flex items-center gap-1 text-xs ${color}`}>
      <CalendarIcon size={10} /> {label}
    </span>
  );
}

// Avatar
function Avatar({ user, size = 8 }) {
  if (!user) {
    return (
      <div
        className={`w-${size} h-${size} rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold text-white`}
      >
        ?
      </div>
    );
  }
  return user.avatar ? (
    <img
      src={user.avatar}
      alt={user.name}
      className={`w-${size} h-${size} rounded-full object-cover`}
      title={user.name}
    />
  ) : (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-[10px] font-bold`}
      title={user.name}
    >
      {user.name?.[0]?.toUpperCase()}
    </div>
  );
}

export default function Fundraiser() {
  const { user } = useAuth();
  const [fundraisers, setFundraisers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewFundraiser, setShowNewFundraiser] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const canManage = ["admin", "volunteer"].includes(user?.role);

  const load = async () => {
    try {
      const { data } = await API.get("/fundraisers");
      setFundraisers(data);
      if (data.length > 0) {
        if (selected) {
          const refreshed = data.find((f) => f._id === selected._id);
          setSelected(refreshed || data[0]);
        } else {
          setSelected(data[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = () => {
    API.get("/auth/members").then((r) => setAllUsers(r.data));
  };

  useEffect(() => {
    load();
    loadUsers();
  }, []);

  // ============ CHANGE TASK STATUS ============
  const changeStatus = async (taskId, status) => {
    try {
      const { data } = await API.put(
        `/fundraisers/${selected._id}/tasks/${taskId}`,
        { status }
      );
      setSelected(data);
      setFundraisers((list) =>
        list.map((f) => (f._id === data._id ? data : f))
      );
    } catch {
      toast.error("Failed");
    }
  };

  // ============ ASSIGN TASK ============
  const assignTask = async (taskId, userId) => {
    try {
      const { data } = await API.put(
        `/fundraisers/${selected._id}/tasks/${taskId}`,
        { assignee: userId || null }
      );
      setSelected(data);
      setFundraisers((list) =>
        list.map((f) => (f._id === data._id ? data : f))
      );
      toast.success("Task assigned");
    } catch {
      toast.error("Failed");
    }
  };

  // ============ DELETE TASK ============
  const deleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      const { data } = await API.delete(
        `/fundraisers/${selected._id}/tasks/${taskId}`
      );
      setSelected(data);
      setFundraisers((list) =>
        list.map((f) => (f._id === data._id ? data : f))
      );
      toast.success("Task deleted");
    } catch {
      toast.error("Failed");
    }
  };

  // ============ ADD TEAM MEMBER ============
  const addTeamMember = async (userId) => {
    try {
      await API.post(`/fundraisers/${selected._id}/team`, { userId });
      await load();
      toast.success("Added to team");
    } catch {
      toast.error("Failed");
    }
  };

  // ============ REMOVE TEAM MEMBER ============
  const removeTeamMember = async (userId) => {
    if (!confirm("Remove from team?")) return;
    try {
      await API.delete(`/fundraisers/${selected._id}/team/${userId}`);
      await load();
      toast.success("Removed");
    } catch {
      toast.error("Failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Empty state
  if (fundraisers.length === 0) {
    return (
      <div className="card text-center py-16 max-w-2xl mx-auto">
        <Target size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-800 dark:text-white mb-1">
          No fundraisers yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {canManage
            ? "Create one to organize volunteers and track progress"
            : "Check back soon"}
        </p>
        {canManage && (
          <button
            onClick={() => setShowNewFundraiser(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={16} /> New Fundraiser
          </button>
        )}
        {showNewFundraiser && (
          <NewFundraiserModal
            onClose={() => setShowNewFundraiser(false)}
            onSuccess={() => {
              setShowNewFundraiser(false);
              load();
            }}
          />
        )}
      </div>
    );
  }

  // Progress
  const progress = selected
    ? Math.min(100, (selected.raised / selected.goal) * 100)
    : 0;

  // Group tasks by status
  const grouped = COLUMNS.map((col) => ({
    ...col,
    tasks: selected.tasks.filter((t) => t.status === col.id),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Fundraisers
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Plan, assign, and track progress with your team
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowNewFundraiser(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> New Fundraiser
          </button>
        )}
      </div>

      {/* Fundraiser selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {fundraisers.map((f) => (
          <button
            key={f._id}
            onClick={() => setSelected(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              selected?._id === f._id
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-300"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Hero card */}
      {selected && (
        <div className="card bg-gradient-to-br from-brand-600 to-brand-800 text-white !p-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-1">{selected.name}</h2>
              <p className="text-white/80 text-sm">{selected.description}</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur text-xs font-semibold capitalize">
              {selected.status}
            </span>
          </div>

          {/* Progress */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Raised</span>
              <span className="font-bold">
                ${selected.raised} / ${selected.goal}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-white/70 text-right">
              {progress.toFixed(0)}% of goal
            </p>
          </div>

          {/* Team */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-white/70 font-semibold uppercase tracking-wide">
                👥 Team ({selected.team.length})
              </span>
              <div className="flex -space-x-2">
                {selected.team.slice(0, 6).map((t) => (
                  <img
                    key={t._id}
                    src={t.avatar}
                    alt={t.name}
                    title={t.name}
                    className="w-8 h-8 rounded-full border-2 border-brand-700 object-cover bg-white"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ))}
                {selected.team.length > 6 && (
                  <div className="w-8 h-8 rounded-full border-2 border-brand-700 bg-brand-500 text-white flex items-center justify-center text-xs font-bold">
                    +{selected.team.length - 6}
                  </div>
                )}
              </div>
            </div>

            {canManage && (
              <button
                onClick={() => setShowTeam(true)}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur border border-white/20 text-sm font-semibold flex items-center gap-2 transition"
              >
                <UserPlus size={14} /> Manage Team
              </button>
            )}
          </div>
        </div>
      )}

      {/* Kanban */}
      <div className="grid md:grid-cols-3 gap-4">
        {grouped.map((col) => (
          <div
            key={col.id}
            className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 min-h-[300px]"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                <span className={`px-2 py-1 rounded-md text-xs ${col.color}`}>
                  {col.label}
                </span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {col.tasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {col.tasks.map((t) => {
                const cat = CATEGORIES.find((c) => c.id === t.category) || CATEGORIES[5];
                const prio = PRIORITIES.find((p) => p.id === t.priority) || PRIORITIES[1];
                return (
                  <div
                    key={t._id}
                    className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
                  >
                    {/* Title + delete */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p
                        className={`text-sm font-medium flex-1 ${
                          t.status === "done"
                            ? "line-through text-slate-400"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {t.title}
                      </p>
                      {(canManage || t.createdBy?._id === user?.id) && (
                        <button
                          onClick={() => deleteTask(t._id)}
                          className="text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Category + priority */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${cat.color}`}>
                        {cat.label}
                      </span>
                      {t.priority === "high" && (
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                          <AlertCircle size={9} /> HIGH
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {t.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
                        {t.description}
                      </p>
                    )}

                    {/* Due date */}
                    {t.dueDate && (
                      <div className="mb-2">
                        <DueBadge date={t.dueDate} />
                      </div>
                    )}

                    {/* Assignee */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        {t.assignee ? (
                          <>
                            <Avatar user={t.assignee} size={6} />
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {t.assignee.name?.split(" ")[0]}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Unassigned
                          </span>
                        )}
                      </div>
                      {canManage && (
                        <select
                          value={t.assignee?._id || ""}
                          onChange={(e) => assignTask(t._id, e.target.value)}
                          className="text-[10px] bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="">Assign…</option>
                          {selected.team.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.name.split(" ")[0]}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Move buttons */}
                    <div className="flex gap-1 mt-2">
                      {COLUMNS.filter((c) => c.id !== t.status).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => changeStatus(t._id, c.id)}
                          className="text-[10px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-brand-100 dark:hover:bg-brand-900/40 hover:text-brand-700 text-slate-600 dark:text-slate-300 transition font-medium"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {col.tasks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    No tasks
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add task */}
      {canManage && selected && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">
              Add a task
            </h3>
            <button
              onClick={() => setShowNewTask(true)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Plus size={14} /> New Task
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Assign tasks to volunteers — they'll get a notification.
          </p>
        </div>
      )}

      {/* New Fundraiser Modal */}
      {showNewFundraiser && (
        <NewFundraiserModal
          onClose={() => setShowNewFundraiser(false)}
          onSuccess={() => {
            setShowNewFundraiser(false);
            load();
          }}
        />
      )}

      {/* New Task Modal */}
      {showNewTask && selected && (
        <NewTaskModal
          fundraiser={selected}
          team={selected.team}
          onClose={() => setShowNewTask(false)}
          onSuccess={(updated) => {
            setShowNewTask(false);
            setSelected(updated);
            setFundraisers((list) =>
              list.map((f) => (f._id === updated._id ? updated : f))
            );
          }}
        />
      )}

      {/* Team management modal */}
      {showTeam && selected && (
        <TeamModal
          fundraiser={selected}
          allUsers={allUsers}
          onClose={() => setShowTeam(false)}
          onAdd={addTeamMember}
          onRemove={removeTeamMember}
        />
      )}
    </div>
  );
}

// ============ NEW FUNDRAISER MODAL ============
function NewFundraiserModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    goal: "",
    status: "planning",
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post("/fundraisers", {
        ...form,
        goal: Number(form.goal),
      });
      toast.success("Fundraiser created! 🎉");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="card max-w-lg w-full my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            New Fundraiser
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Bake Sale for Library Fund"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input resize-none"
              placeholder="Raise funds for new books"
            />
          </div>
          <div>
            <label className="label">Goal ($) *</label>
            <input
              required
              type="number"
              min="1"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className="input"
              placeholder="500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ NEW TASK MODAL ============
function NewTaskModal({ fundraiser, team, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "normal",
    dueDate: "",
    assignee: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await API.post(`/fundraisers/${fundraiser._id}/tasks`, {
        ...form,
        assignee: form.assignee || null,
      });
      toast.success("Task added! ✅");
      onSuccess(data);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="card max-w-lg w-full my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            Add Task
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Task Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="Bake 3 batches of cookies"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input resize-none"
              placeholder="Chocolate chip and oatmeal"
            />
          </div>

          <div>
            <label className="label">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setForm({ ...form, category: c.id })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    form.category === c.id
                      ? "bg-brand-600 text-white"
                      : `${c.color} hover:opacity-80`
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value })
                }
                className="input"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm({ ...form, dueDate: e.target.value })
                }
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Assign to</label>
            <select
              value={form.assignee}
              onChange={(e) =>
                setForm({ ...form, assignee: e.target.value })
              }
              className="input"
            >
              <option value="">Unassigned</option>
              {team.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ TEAM MODAL ============
function TeamModal({ fundraiser, allUsers, onClose, onAdd, onRemove }) {
  const [search, setSearch] = useState("");

  const currentIds = fundraiser.team.map((t) => t._id);
  const availableUsers = allUsers.filter(
    (u) =>
      !currentIds.includes(u._id) &&
      (!search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="card max-w-lg w-full my-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              Manage Team
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {fundraiser.team.length} member(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current team */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">
            Current Team
          </p>
          <div className="space-y-2">
            {fundraiser.team.map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900"
              >
                <div className="flex items-center gap-2">
                  <Avatar user={m} size={8} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {m.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {m.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(m._id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                  title="Remove"
                >
                  <UserMinus size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add member */}
        <div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">
            Add Member
          </p>
          <div className="relative mb-3">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="input pl-9 !py-2 !text-sm"
            />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableUsers.slice(0, 20).map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition"
              >
                <div className="flex items-center gap-2">
                  <Avatar user={u} size={8} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {u.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onAdd(u._id)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 text-brand-700 dark:text-brand-300 font-semibold flex items-center gap-1"
                >
                  <UserPlus size={12} /> Add
                </button>
              </div>
            ))}
            {availableUsers.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                {search ? "No matching members" : "Everyone is on the team"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}