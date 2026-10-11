import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Award as AwardIcon } from "lucide-react";
import {
  Search,
  UserCheck,
  UserX,
  UserPlus,
  X,
  Crown,
  Wallet,
  Heart,
  User as UserIcon,
  Trash2,
  Bell,
} from "lucide-react";
import { format } from "date-fns";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
];

const ROLE_FILTERS = [
  { id: "all", label: "Everyone" },
  { id: "member", label: "Members" },
  { id: "volunteer", label: "Volunteers" },
  { id: "treasurer", label: "Treasurers" },
  { id: "admin", label: "Admins" },
];

const ROLE_OPTIONS = [
  {
    id: "member",
    label: "Member",
    desc: "Regular club member",
    icon: UserIcon,
    gradient: "from-brand-500 to-brand-700",
  },
  {
    id: "volunteer",
    label: "Volunteer",
    desc: "Organizes events & fundraisers",
    icon: Heart,
    gradient: "from-amber-500 to-amber-700",
  },
  {
    id: "treasurer",
    label: "Treasurer",
    desc: "Manages finances",
    icon: Wallet,
    gradient: "from-emerald-500 to-emerald-700",
  },
  {
    id: "admin",
    label: "Admin",
    desc: "Full control",
    icon: Crown,
    gradient: "from-purple-500 to-purple-700",
  },
];

export default function Members() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [certMember, setCertMember] = useState(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  const isAdmin = user?.role === "admin";
  const canMarkPaid = ["admin", "treasurer"].includes(user?.role);

  const filter = searchParams.get("filter") || "all";
  const roleFilter = searchParams.get("role") || "all";

  const load = () =>
    API.get("/auth/members").then((r) => {
      setMembers(r.data);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const markPaid = async (id) => {
    await API.put(`/auth/${id}/dues`);
    toast.success("Marked paid ✅");
    load();
  };

  const changeRole = async (id, role) => {
    try {
      await API.put(`/auth/${id}/role`, { role });
      toast.success(`Role changed to ${role}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await API.delete(`/auth/${id}`);
      toast.success("Member deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    }
  };

  const sendDuesReminders = async () => {
    const unpaidCount = members.filter(
      (m) => !m.duesPaid && ["member", "volunteer"].includes(m.role)
    ).length;

    if (unpaidCount === 0) {
      return toast.success("Everyone has paid 🎉");
    }

    if (
      !confirm(
        `Send dues reminder emails to ${unpaidCount} unpaid member${
          unpaidCount > 1 ? "s" : ""
        }?`
      )
    )
      return;

    setSendingReminders(true);
    try {
      const { data } = await API.post("/auth/send-dues-reminders", {
        amount: 500,
      });
      toast.success(data.message || `✅ Sent ${data.sent} reminders`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to send reminders");
    } finally {
      setSendingReminders(false);
    }
  };

  const setFilter = (newFilter) => {
    const params = new URLSearchParams(searchParams);
    if (newFilter === "all") params.delete("filter");
    else params.set("filter", newFilter);
    setSearchParams(params);
  };

  const setRoleFilter = (newRole) => {
    const params = new URLSearchParams(searchParams);
    if (newRole === "all") params.delete("role");
    else params.set("role", newRole);
    setSearchParams(params);
  };

  const filtered = members.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !m.name.toLowerCase().includes(q) &&
        !m.email.toLowerCase().includes(q)
      )
        return false;
    }
    if (filter === "paid" && !m.duesPaid) return false;
    if (filter === "pending" && m.duesPaid) return false;
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    return true;
  });

  const roleCounts = {
    all: members.length,
    member: members.filter((m) => m.role === "member").length,
    volunteer: members.filter((m) => m.role === "volunteer").length,
    treasurer: members.filter((m) => m.role === "treasurer").length,
    admin: members.filter((m) => m.role === "admin").length,
  };

  const unpaidCount = members.filter(
    (m) => !m.duesPaid && ["member", "volunteer"].includes(m.role)
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============ HEADER ============ */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Members
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {filtered.length} shown · {members.length} total ·{" "}
            {members.filter((m) => m.duesPaid).length} paid ·{" "}
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              {unpaidCount} unpaid
            </span>
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={sendDuesReminders}
              disabled={sendingReminders}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <Bell size={16} />
              {sendingReminders ? "Sending..." : "Send Dues Reminders"}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus size={16} /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* ============ DUES FILTERS ============ */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === f.id
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ============ ROLE FILTERS ============ */}
      <div className="flex gap-2 flex-wrap">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r.id}
            onClick={() => setRoleFilter(r.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              roleFilter === r.id
                ? "bg-slate-800 dark:bg-white text-white dark:text-slate-800"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400"
            }`}
          >
            {r.label}
            <span className="ml-1.5 text-xs opacity-70">
              ({roleCounts[r.id]})
            </span>
          </button>
        ))}
      </div>

      {/* ============ TABLE ============ */}
      <div className="card">
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input pl-11"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                <th className="pb-3 font-medium">Member</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Expires</th>
                {canMarkPaid && (
                  <th className="pb-3 font-medium text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m._id}
                  className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {m.avatar ? (
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-xs">
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {m.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {m.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    {isAdmin ? (
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m._id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize font-semibold cursor-pointer"
                      >
                        <option value="member">Member</option>
                        <option value="volunteer">Volunteer</option>
                        <option value="treasurer">Treasurer</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="badge-info capitalize">{m.role}</span>
                    )}
                  </td>
                  <td className="py-3">
                    {m.duesPaid ? (
                      <span className="badge-success flex items-center gap-1 w-fit">
                        <UserCheck size={12} /> Paid
                      </span>
                    ) : (
                      <span className="badge-warning flex items-center gap-1 w-fit">
                        <UserX size={12} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                    {m.membershipExpiry
                      ? format(new Date(m.membershipExpiry), "MMM d, yyyy")
                      : "—"}
                  </td>
                  {canMarkPaid && (
                    <td className="py-3 text-right whitespace-nowrap">
                      {!m.duesPaid && (
                        <button
                          onClick={() => markPaid(m._id)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold mr-1"
                        >
                          Mark paid
                        </button>
                      )}
                      {isAdmin && (
  <button
    onClick={() => setCertMember(m)}
    className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-semibold mr-1"
    title="Issue certificate"
  >
    🎖️ Certificate
  </button>
)}
                      {isAdmin && m._id !== user.id && (
                        <button
                          onClick={() => deleteUser(m._id, m.name)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          title="Delete member"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={canMarkPaid ? 5 : 4}
                    className="py-12 text-center text-slate-400 text-sm"
                  >
                    No members match these filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============ ADD MEMBER MODAL ============ */}
      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            load();
          }}
        />
      )}
      {certMember && (
  <IssueCertificateModal
    member={certMember}
    onClose={() => setCertMember(null)}
    onSuccess={() => {
      setCertMember(null);
      load();
    }}
  />
)}
    </div>
  );
}

// ============================================================
//  ADD MEMBER MODAL
// ============================================================
function AddMemberModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
    duesPaid: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await API.post("/auth/admin-create", form);
      toast.success(data.msg || "Member created! 🎉");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to create member");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="card max-w-lg w-full my-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                Create Member Account
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assign a role and set up their account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="jane@skyline.edu"
            />
          </div>

          <div>
            <label className="label">Temporary Password *</label>
            <input
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input font-mono"
              placeholder="At least 6 characters"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              They can change it later from their profile
            </p>
          </div>

          <div>
            <label className="label">Assign Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((r) => {
                const Icon = r.icon;
                const selected = form.role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.id })}
                    className={`relative flex items-center gap-2 p-3 rounded-xl border-2 text-left transition ${
                      selected
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg bg-gradient-to-br ${r.gradient} text-white flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        {r.label}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                        {r.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer border border-slate-100 dark:border-slate-700">
            <input
              type="checkbox"
              checked={form.duesPaid}
              onChange={(e) => setForm({ ...form, duesPaid: e.target.checked })}
              className="w-4 h-4 rounded accent-brand-600"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                Dues already collected
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check this if the member paid in person
              </p>
            </div>
          </label>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function IssueCertificateModal({ member, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "participation",
    position: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post("/portfolio/certificates", {
        ...form,
        userId: member._id,
      });
      toast.success(`Certificate issued to ${member.name} 🎖️`);
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center">
              <AwardIcon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                Issue Certificate
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To: {member.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="Hackathon 2026 Winner"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input resize-none"
              placeholder="For winning first place in the 48-hour coding challenge"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input"
              >
                <option value="participation">Participation</option>
                <option value="achievement">Achievement</option>
                <option value="completion">Completion</option>
                <option value="winner">Winner</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </div>
            <div>
              <label className="label">Position (optional)</label>
              <input
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="input"
                placeholder="1st Place"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Issuing..." : "Issue Certificate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
