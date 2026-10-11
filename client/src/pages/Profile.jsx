import { useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Save,
  Camera,
  Calendar,
  Shield,
  FileText,
  Wallet,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";

const ROLE_INFO = {
  admin: {
    label: "Admin",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    desc: "Full control of the club",
  },
  treasurer: {
    label: "Treasurer",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    desc: "Manages finances & reimbursements",
  },
  volunteer: {
    label: "Volunteer",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    desc: "Organizes events & fundraisers",
  },
  member: {
    label: "Member",
    color:
      "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
    desc: "Club member with discounts",
  },
};

export default function Profile() {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    studentId: user?.studentId || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
    upiId: user?.upiId || "",
    paymentPhone: user?.paymentPhone || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const roleInfo = ROLE_INFO[user?.role] || ROLE_INFO.member;

  // Avatar upload
  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("folder", "skyline-avatars");
      const { data } = await API.post("/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({ ...f, avatar: data.url }));
      toast.success("Avatar uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Save profile
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await API.put("/auth/me", form);
      setUser(data);
      toast.success("Profile updated! ✨");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Copy helper
  const copy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          My Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your personal information and payment settings
        </p>
      </div>

      {/* ============ AVATAR + ROLE BANNER ============ */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            {form.avatar ? (
              <img
                src={form.avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-brand-100 dark:ring-brand-900/50"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-4xl font-bold ring-4 ring-brand-100 dark:ring-brand-900/50">
                {form.name?.[0]?.toUpperCase()}
              </div>
            )}
            <label className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center cursor-pointer shadow-lg transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarUpload(e.target.files[0])}
              />
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={16} />
              )}
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {user?.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user?.email}
            </p>

            <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start flex-wrap">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${roleInfo.color}`}
              >
                <Shield size={10} className="inline mr-1" />
                {roleInfo.label}
              </span>
              {user?.duesPaid ? (
                <span className="badge-success">✅ Dues paid</span>
              ) : (
                <span className="badge-warning">⚠️ Dues pending</span>
              )}
              {user?.membershipExpiry && (
                <span className="badge-info">
                  Expires{" "}
                  {format(new Date(user.membershipExpiry), "MMM yyyy")}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {roleInfo.desc}
            </p>
          </div>
        </div>
      </div>

      {/* ============ EDIT FORM ============ */}
      <form onSubmit={submit} className="card space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-white text-lg">
          Personal Information
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center gap-2">
              <User size={14} /> Full Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <Mail size={14} /> Email
            </label>
            <input
              value={user?.email || ""}
              disabled
              className="input opacity-60 cursor-not-allowed"
              title="Email cannot be changed"
            />
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <Phone size={14} /> Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <GraduationCap size={14} /> Student ID
            </label>
            <input
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="input"
              placeholder="S12345"
            />
          </div>
        </div>

        <div>
          <label className="label flex items-center gap-2">
            <FileText size={14} /> Bio / About
          </label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="input resize-none"
            placeholder="A short intro about yourself..."
          />
        </div>

        {/* ============ PAYMENT INFO (ADMIN ONLY) ============ */}
        {(user?.role === "admin" || user?.role === "treasurer") && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-900/20 dark:to-indigo-900/20 border border-brand-200 dark:border-brand-800">
            <h4 className="font-bold text-brand-900 dark:text-brand-200 mb-1 text-sm flex items-center gap-2">
              <Wallet size={16} /> Payment Details
            </h4>
            <p className="text-xs text-brand-700 dark:text-brand-300 mb-4">
              These are shown to members when they buy tickets. They'll pay
              directly to this UPI.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">UPI ID</label>
                <input
                  value={form.upiId}
                  onChange={(e) =>
                    setForm({ ...form, upiId: e.target.value })
                  }
                  className="input font-mono"
                  placeholder="skyline@okhdfcbank"
                />
              </div>
              <div>
                <label className="label text-xs">
                  WhatsApp / Phone (for proof)
                </label>
                <input
                  value={form.paymentPhone}
                  onChange={(e) =>
                    setForm({ ...form, paymentPhone: e.target.value })
                  }
                  className="input"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {form.upiId && (
              <div className="mt-4 p-3 rounded-xl bg-white dark:bg-slate-800 border border-brand-100 dark:border-brand-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Preview (what members will see)
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono font-bold text-slate-800 dark:text-white truncate">
                    {form.upiId}
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(form.upiId)}
                    className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/40 text-brand-600"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* ============ ACCOUNT DETAILS (READ-ONLY) ============ */}
      <div className="card">
        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4">
          Account Details
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Shield size={16} className="text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
              <p className="font-semibold text-slate-800 dark:text-white capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Calendar size={16} className="text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Member Since
              </p>
              <p className="font-semibold text-slate-800 dark:text-white">
                {user?.createdAt
                  ? format(new Date(user.createdAt), "MMMM yyyy")
                  : "—"}
              </p>
            </div>
          </div>
          {user?.membershipExpiry && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Calendar size={16} className="text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Membership Expires
                </p>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {format(new Date(user.membershipExpiry), "PPP")}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Wallet size={16} className="text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dues Status
              </p>
              <p
                className={`font-semibold ${
                  user?.duesPaid
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {user?.duesPaid ? "✅ Paid" : "⚠️ Pending"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}