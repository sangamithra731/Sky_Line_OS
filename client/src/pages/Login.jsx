import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  GraduationCap, Mail, Lock, ArrowRight, ArrowLeft,
  Crown, Wallet, Heart, User, QrCode, Sparkles, ShoppingBag,
} from "lucide-react";

const ROLES = [
  { id: "admin", label: "Admin", desc: "Full control — events, members, money", icon: Crown, gradient: "from-purple-500 to-purple-700", border: "border-purple-200 dark:border-purple-800", hover: "hover:border-purple-400" },
  { id: "treasurer", label: "Treasurer", desc: "Manage finances & reimbursements", icon: Wallet, gradient: "from-emerald-500 to-emerald-700", border: "border-emerald-200 dark:border-emerald-800", hover: "hover:border-emerald-400" },
  { id: "volunteer", label: "Volunteer", desc: "Help organize events & fundraisers", icon: Heart, gradient: "from-amber-500 to-amber-700", border: "border-amber-200 dark:border-amber-800", hover: "hover:border-amber-400" },
  { id: "member", label: "Member", desc: "Join events, buy tickets, shop merch", icon: User, gradient: "from-brand-500 to-accent-500", border: "border-brand-200 dark:border-brand-800", hover: "hover:border-brand-400" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("role");
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const pickRole = (role) => { setSelectedRole(role); setStep("credentials"); setEmail(""); setPassword(""); };
  const backToRoles = () => { setStep("role"); setSelectedRole(null); setEmail(""); setPassword(""); };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, selectedRole.id);
      toast.success(`Welcome back, ${selectedRole.label}! 🎉`);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-slate-900 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-100 dark:bg-brand-900/20 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-100 dark:bg-accent-900/20 rounded-full blur-3xl opacity-40"></div>

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-10">
            <img src="/skyline-logo.png" alt="Skyline" className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-brand-200 dark:shadow-brand-900/50" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Skyline</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Student Association</p>
            </div>
          </div>

          {step === "role" && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Welcome back 👋</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">First, tell us who you are</p>

              <div className="space-y-3">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => pickRole(role)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-white dark:bg-slate-800 ${role.border} ${role.hover} transition-all group text-left`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} text-white flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 dark:text-white">{role.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{role.desc}</p>
                      </div>
                      <ArrowRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </button>
                  );
                })}
              </div>

              <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8 space-y-2">
                <p>
                  Don't have an account?{" "}
                  <Link to="/register" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Sign up</Link>
                </p>
                <p>
                  <Link to="/forgot-password" className="text-brand-600 dark:text-brand-400 font-medium hover:underline text-xs">Forgot password?</Link>
                </p>
              </div>
            </div>
          )}

          {step === "credentials" && selectedRole && (
            <div className="animate-fade-in">
              <button type="button" onClick={backToRoles} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 text-sm font-medium mb-6">
                <ArrowLeft size={16} /> Change role
              </button>

              <div className={`flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 ${selectedRole.border} mb-6`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedRole.gradient} text-white flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <selectedRole.icon size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Signing in as</p>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedRole.label}</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Enter your credentials</h2>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-11" placeholder="you@skyline.edu" />
                  </div>
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-11" placeholder="••••••••" />
                  </div>
                  <div className="text-right mt-2">
                    <Link to="/forgot-password" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">Forgot password?</Link>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  {loading ? "Signing in..." : `Sign in as ${selectedRole.label}`}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900">
        <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80" alt="Students" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/95 via-accent-800/90 to-indigo-900/95"></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-brand-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 w-full flex flex-col justify-between p-12 text-white">
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold">
              <Sparkles size={12} className="text-amber-300" /> Powered by AI
            </div>
          </div>

          <div className="max-w-lg">
            <h2 className="text-5xl font-bold mb-6 leading-tight tracking-tight">
              Run your club
              <br />
              <span className="bg-gradient-to-r from-white via-amber-200 to-emerald-200 bg-clip-text text-transparent">like a pro.</span>
            </h2>
            <p className="text-white/80 text-lg mb-10 leading-relaxed">
              Members, events, tickets, merch, and money — all in one unified platform.
            </p>
            <div className="space-y-4">
              {[
                { icon: QrCode, text: "QR-code check-in for events" },
                { icon: Sparkles, text: "AI assistant for club data" },
                { icon: Wallet, text: "Live finance dashboard" },
                { icon: ShoppingBag, text: "Merch store with member discounts" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3 text-sm">
                  <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0">
                    <f.icon size={16} className="text-white" />
                  </div>
                  <span className="text-white/90">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { num: "24+", label: "Members" },
              { num: "$1.8k", label: "Revenue" },
              { num: "12", label: "Events" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <p className="text-2xl font-bold text-white">{s.num}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}