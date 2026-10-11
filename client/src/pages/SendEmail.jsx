import { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Mail,
  Send,
  Users,
  UserCheck,
  Search,
  Check,
  X,
  Crown,
  Wallet,
  Heart,
  User as UserIcon,
} from "lucide-react";

const ROLE_OPTIONS = [
  { id: "member", label: "Members", icon: UserIcon, color: "bg-brand-100 text-brand-700" },
  { id: "volunteer", label: "Volunteers", icon: Heart, color: "bg-amber-100 text-amber-700" },
  { id: "treasurer", label: "Treasurers", icon: Wallet, color: "bg-emerald-100 text-emerald-700" },
  { id: "admin", label: "Admins", icon: Crown, color: "bg-purple-100 text-purple-700" },
];

export default function SendEmail() {
  const { user } = useAuth();
  const [mode, setMode] = useState("everyone"); // everyone | role | selected
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState({ recipients: [], count: 0 });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    API.get("/auth/members").then((r) => {
      // Exclude self
      setAllUsers(r.data.filter((u) => u._id !== user.id));
    });
  }, [user.id]);

  // Preview recipients on mode change
  useEffect(() => {
    const body = {
      mode,
      roles: selectedRoles,
      userIds: selectedUsers,
    };
    API.post("/emails/preview", body)
      .then((r) => setPreview({ recipients: r.data.recipients, count: r.data.count }))
      .catch(() => setPreview({ recipients: [], count: 0 }));
  }, [mode, selectedRoles, selectedUsers]);

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      return toast.error("Subject and message are required");
    }
    if (preview.count === 0) {
      return toast.error("No recipients selected");
    }

    setSending(true);
    try {
      const { data } = await API.post("/emails/send", {
        mode,
        roles: selectedRoles,
        userIds: selectedUsers,
        subject,
        message,
      });
      toast.success(data.msg);
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="card text-center py-16">
        <Mail size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-800 dark:text-white mb-1">
          Admin only
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Only admins can send emails to members.
        </p>
      </div>
    );
  }

  const filteredUsers = allUsers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Send Email
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Compose and send a message to members. Recipients also get an in-app
          notification.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* ============ RECIPIENTS ============ */}
        <div className="card">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Users size={18} /> Recipients
          </h3>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { id: "everyone", label: "Everyone", icon: Users },
              { id: "role", label: "By Role", icon: UserCheck },
              { id: "selected", label: "Pick Users", icon: Search },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
                    mode === m.id
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Icon size={15} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Mode: everyone */}
          {mode === "everyone" && (
            <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800">
              <p className="text-sm text-brand-800 dark:text-brand-300">
                📢 This email goes to <strong>every active user</strong> in the
                system.
              </p>
            </div>
          )}

          {/* Mode: role */}
          {mode === "role" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLE_OPTIONS.map((r) => {
                const Icon = r.icon;
                const selected = selectedRoles.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRole(r.id)}
                    className={`relative p-3 rounded-xl border-2 text-center transition ${
                      selected
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <Check size={11} />
                      </div>
                    )}
                    <div
                      className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center mb-2 ${r.color}`}
                    >
                      <Icon size={16} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      {r.label}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Mode: selected */}
          {mode === "selected" && (
            <>
              <div className="relative mb-3">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="input pl-9"
                />
              </div>

              <div className="space-y-1 max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                {filteredUsers.map((u) => {
                  const selected = selectedUsers.includes(u._id);
                  return (
                    <label
                      key={u._id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition ${
                        selected
                          ? "bg-brand-50 dark:bg-brand-900/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleUser(u._id)}
                        className="w-4 h-4 rounded accent-brand-600"
                      />
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {u.email} · {u.role}
                        </p>
                      </div>
                    </label>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No users found
                  </p>
                )}
              </div>
            </>
          )}

          {/* Preview count */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {preview.count} recipient{preview.count !== 1 ? "s" : ""}
              </span>
              {preview.count > 0 && preview.count <= 5 && (
                <div className="flex -space-x-2">
                  {preview.recipients.slice(0, 5).map((r) => (
                    <div
                      key={r._id}
                      title={r.name}
                      className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-800"
                    >
                      {r.name?.[0]?.toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ COMPOSE ============ */}
        <div className="card">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Mail size={18} /> Compose
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">Subject *</label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input"
                placeholder="e.g., Meeting this Friday at 5 PM"
              />
            </div>
            <div>
              <label className="label">Message *</label>
              <textarea
                required
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input resize-none"
                placeholder="Write your message here..."
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {message.length} characters
              </p>
            </div>
          </div>
        </div>

        {/* ============ SEND ============ */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setSubject("");
              setMessage("");
            }}
            className="btn-secondary"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={sending || preview.count === 0}
            className="btn-primary flex items-center gap-2"
          >
            <Send size={16} />
            {sending
              ? "Sending..."
              : `Send to ${preview.count} recipient${
                  preview.count !== 1 ? "s" : ""
                }`}
          </button>
        </div>
      </form>
    </div>
  );
}