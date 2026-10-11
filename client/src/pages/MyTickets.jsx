import { useEffect, useState } from "react";
import API from "../api";
import { Ticket as TicketIcon, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/tickets/my").then((r) => {
      setTickets(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">My Tickets</h1>
        <p className="text-slate-500">Your purchased tickets and QR codes</p>
      </div>

      {tickets.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <TicketIcon className="text-slate-400" size={28} />
          </div>
          <h3 className="font-bold text-slate-800 mb-1">No tickets yet</h3>
          <p className="text-sm text-slate-500">
            Browse events and grab your first ticket!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tickets.map((t) => (
            <div key={t._id} className="card animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-800">{t.event?.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.ticketType} · #{t._id.slice(-6).toUpperCase()}
                  </p>
                </div>
                {t.checkedIn ? (
                  <span className="badge-success">✓ Used</span>
                ) : (
                  <span className="badge-info">Active</span>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border-4 border-dashed border-slate-100">
                <img src={t.qrCode} alt="QR" className="w-full" />
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  {t.event && format(new Date(t.event.date), "PPP")}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  {t.event?.venue}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Paid</span>
                <span className="font-bold text-brand-600">
                  {t.price === 0 ? "FREE" : `$${t.price}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}