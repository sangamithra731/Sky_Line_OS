import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import useSocket from "../hooks/useSocket";
import { Bell, Check, Trash2, X, Megaphone, Ticket, Package, Wallet } from "lucide-react";
import { format } from "date-fns";

const TYPE_ICONS = {
  announcement: Megaphone, ticket: Ticket, order: Package,
  payment: Wallet, reimbursement: Wallet, event: Ticket, system: Bell,
};

const TYPE_COLORS = {
  announcement: "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300",
  ticket: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
  order: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
  payment: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300",
  reimbursement: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300",
  event: "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300",
  system: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  const load = async () => {
    try {
      const { data } = await API.get("/notifications");
      setList(data.notifications);
      setUnread(data.unread);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  useSocket("notification", (data) => {
    load();
    if (data?.title) {
      toast((t) => (
        <div className="flex items-start gap-2">
          <span>🔔</span>
          <div className="text-sm">
            <p className="font-semibold">{data.title}</p>
            {data.message && <p className="text-xs opacity-80 mt-0.5">{data.message.slice(0, 80)}</p>}
          </div>
        </div>
      ));
    }
  });

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markRead = async (id) => {
    await API.put(`/notifications/${id}/read`);
    setList((l) => l.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    await API.put("/notifications/read-all");
    setList((l) => l.map((n) => ({ ...n, read: true })));
    setUnread(0);
    toast.success("All marked as read");
  };

  const clearAll = async () => {
    if (!confirm("Clear all notifications?")) return;
    await API.delete("/notifications/clear");
    setList([]);
    setUnread(0);
  };

  const handleClick = async (n) => {
    if (!n.read) await markRead(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg relative transition" title="Notifications">
        <Bell size={18} className="text-slate-500 dark:text-slate-400" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-40 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{unread} unread · {list.length} total</p>
              </div>
              <div className="flex gap-1">
                {unread > 0 && (
                  <button onClick={markAllRead} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Mark all read"><Check size={14} /></button>
                )}
                {list.length > 0 && (
                  <button onClick={clearAll} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500" title="Clear all"><Trash2 size={14} /></button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 md:hidden"><X size={14} /></button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
                </div>
              ) : list.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                </div>
              ) : (
                list.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Bell;
                  const colorClass = TYPE_COLORS[n.type] || TYPE_COLORS.system;
                  return (
                    <button
                      key={n._id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition ${!n.read ? "bg-brand-50/40 dark:bg-brand-900/10" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight">{n.title}</p>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5"></span>}
                          </div>
                          {n.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">{format(new Date(n.createdAt), "MMM d · h:mm a")}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
