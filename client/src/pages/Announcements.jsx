import { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Megaphone, Plus, Pin, Trash2, X } from "lucide-react";
import { format } from "date-fns";

export default function Announcements() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", pinned: false });

  const isAdmin = user?.role === "admin";

  const load = () => {
    API.get("/announcements").then((r) => {
      setList(r.data);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/announcements", form);
      toast.success("Posted!");
      setForm({ title: "", body: "", pinned: false });
      setShowForm(false);
      load();
    } catch {
      toast.error("Failed to post");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    await API.delete(`/announcements/${id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Announcements</h1>
          <p className="text-slate-500">Stay in the loop with club updates</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> New
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((a) => (
            <div
              key={a._id}
              className={`card animate-fade-in ${
                a.pinned ? "border-amber-200 bg-amber-50/50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      a.pinned
                        ? "bg-amber-100 text-amber-600"
                        : "bg-brand-100 text-brand-600"
                    }`}
                  >
                    {a.pinned ? <Pin size={18} /> : <Megaphone size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800">{a.title}</h3>
                      {a.pinned && <span className="badge-warning">📌 Pinned</span>}
                    </div>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap">
                      {a.body}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {a.author?.name} ·{" "}
                      {format(new Date(a.createdAt), "PPp")}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => remove(a._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="card text-center py-16">
              <Megaphone size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No announcements yet</p>
            </div>
          )}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card max-w-lg w-full animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg">
                New Announcement
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="Meeting reminder"
                />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea
                  required
                  rows={5}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="input resize-none"
                  placeholder="Write your message..."
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="rounded"
                />
                Pin to top
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}