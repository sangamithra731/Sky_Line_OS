import { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Receipt,
  Plus,
  Check,
  X as XIcon,
  X,
  Upload,
  Image as ImgIcon,
  Clock,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_STYLES = {
  pending: "badge-warning",
  approved: "badge-success",
  rejected: "badge-danger",
};

export default function Reimbursements() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", description: "" });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const role = user?.role;
  const canSeeAll = ["treasurer", "admin"].includes(role);

  // ⭐ Can this user review THIS specific claim?
  const canReview = (r) => {
    if (r.status !== "pending") return false;
    if (r.user?._id === user?.id) return false; // can't approve own

    if (role === "treasurer") return true; // treasurer approves anyone else's
    if (role === "admin") return r.user?.role === "treasurer"; // admin approves treasurer's only
    return false;
  };

  const load = () => API.get("/reimbursements").then((r) => setList(r.data));
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("amount", form.amount);
      fd.append("description", form.description);
      if (file) fd.append("receipt", file);

      await API.post("/reimbursements", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Submitted! Awaiting review.");
      setShowForm(false);
      setForm({ amount: "", description: "" });
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const review = async (id, status) => {
    if (!confirm(`${status === "approved" ? "Approve" : "Reject"} this claim?`)) return;
    try {
      await API.put(`/reimbursements/${id}`, { status });
      toast.success(`${status} ✅`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    }
  };

  // Stats
  const pending = list.filter((r) => r.status === "pending").length;
  const approved = list.filter((r) => r.status === "approved").length;
  const totalApproved = list
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Reimbursements
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {canSeeAll
              ? "Review volunteer expense claims"
              : "Submit receipts for expenses you paid"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New claim
        </button>
      </div>

      {/* Stats for treasury + admin */}
      {canSeeAll && list.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {pending}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                <Check size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Approved
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {approved}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 flex items-center justify-center">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total approved
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  ${totalApproved.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info banner for members/volunteers */}
      {!canSeeAll && (
        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={18}
              className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                How reimbursements work
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Submit a claim with a receipt photo. The treasurer reviews and
                approves it. Approved amounts are added to the club's expense
                records automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {list.length === 0 ? (
        <div className="card text-center py-16">
          <Receipt
            size={40}
            className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
          />
          <p className="text-slate-500 dark:text-slate-400">
            {canSeeAll
              ? "No claims to review yet"
              : "You haven't submitted any claims yet"}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((r) => (
            <div key={r._id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-2xl text-brand-600 dark:text-brand-400">
                    ${r.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {r.user?.name} · {format(new Date(r.createdAt), "MMM d")}
                  </p>
                </div>
                <span className={STATUS_STYLES[r.status] || "badge-warning"}>
                  {r.status}
                </span>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                {r.description}
              </p>

              {r.receiptUrl && (
                <a
                  href={r.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block mt-3"
                >
                  <img
                    src={r.receiptUrl}
                    alt="receipt"
                    className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700 hover:opacity-90 transition"
                  />
                </a>
              )}

              {r.reviewedBy && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 italic">
                  Reviewed by {r.reviewedBy.name} ({r.reviewedBy.role})
                </p>
              )}

              {/* ⭐ Approve/Reject — dynamic permission check */}
              {canReview(r) && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => review(r._id, "approved")}
                    className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => review(r._id, "rejected")}
                    className="flex-1 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                  >
                    <XIcon size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New claim modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                New Reimbursement
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">Amount ($) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  className="input"
                  placeholder="25.50"
                />
              </div>
              <div>
                <label className="label">What was it for? *</label>
                <input
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="input"
                  placeholder="Printer paper for posters"
                />
              </div>
              <div>
                <label className="label">Receipt image (optional)</label>
                <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-brand-400 cursor-pointer transition">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  {file ? (
                    <>
                      <ImgIcon size={20} className="text-brand-600" />
                      <span className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">
                        {file.name}
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
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? "Submitting..." : "Submit claim"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}