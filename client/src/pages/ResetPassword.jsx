import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords don't match");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");

    setLoading(true);
    try {
      await API.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md card text-center py-8">
          <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Password reset! 🎉
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Redirecting to login...
          </p>
          <Link to="/login" className="btn-primary inline-flex items-center gap-2">
            Go to login <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md card">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Set new password
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
          Choose a strong password. Minimum 6 characters.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">New password</label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-11"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <label className="label">Confirm password</label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input pl-11"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}