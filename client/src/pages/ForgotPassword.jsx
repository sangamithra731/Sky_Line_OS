import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md card">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-600 text-sm font-medium mb-6"
        >
          <ArrowLeft size={16} /> Back to login
        </Link>

        {!sent ? (
          <>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Forgot your password?
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-11"
                    placeholder="you@skyline.edu"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 size={56} className="mx-auto text-emerald-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Check your email
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              If an account exists for <strong>{email}</strong>, you'll get a
              reset link shortly.
            </p>
            <Link to="/login" className="btn-primary inline-block mt-6">
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}