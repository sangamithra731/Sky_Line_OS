import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { GraduationCap, User, Heart, ArrowRight, Check } from "lucide-react";

const SIGNUP_ROLES = [
  { id: "member", label: "Member", desc: "Join the club, get discounts, attend events", icon: User, gradient: "from-brand-500 to-accent-500", bg: "bg-brand-50 dark:bg-brand-900/30", border: "border-brand-500" },
  { id: "volunteer", label: "Volunteer", desc: "Help organize events and fundraisers", icon: Heart, gradient: "from-amber-500 to-amber-700", bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-500" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success(`Welcome to Skyline, ${form.name.split(" ")[0]}! 🎉`);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full max-w-lg card animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <img src="/skyline-logo.png" alt="Skyline" className="w-12 h-12 rounded-2xl object-cover" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Skyline</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Student Association</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Join the club 🎓</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Create your account in under 30 seconds</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="you@skyline.edu" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" placeholder="At least 6 characters" />
          </div>

          <div>
            <label className="label">I'm joining as</label>
            <div className="grid grid-cols-2 gap-3">
              {SIGNUP_ROLES.map((opt) => {
                const Icon = opt.icon;
                const selected = form.role === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm({ ...form, role: opt.id })}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all ${selected ? `${opt.border} ${opt.bg} shadow-sm` : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}
                  >
                    {selected && (
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br ${opt.gradient} text-white flex items-center justify-center`}>
                        <Check size={12} />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.gradient} text-white flex items-center justify-center mb-2`}>
                      <Icon size={18} />
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{opt.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Have an account?{" "}
          <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}