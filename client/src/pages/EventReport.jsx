import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { ArrowLeft, Users, DollarSign, CheckCircle2, XCircle } from "lucide-react";

export default function EventReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    API.get(`/events/${id}`).then((r) => setEvent(r.data));
    API.get(`/tickets/report/${id}`).then((r) => setReport(r.data));
  }, [id]);

  if (!event || !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const showRate =
    report.total > 0 ? ((report.checkedIn / report.total) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-brand-600 font-medium text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="text-3xl font-bold text-slate-800">{event.title}</h1>
        <p className="text-slate-500">Post-event report</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Tickets sold</p>
              <p className="text-2xl font-bold">{report.total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Attended</p>
              <p className="text-2xl font-bold">{report.checkedIn}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <XCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">No-shows</p>
              <p className="text-2xl font-bold">{report.noShow}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Revenue</p>
              <p className="text-2xl font-bold">${report.revenue.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-slate-800 mb-4">Attendance Rate</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${showRate}%` }}
              />
            </div>
          </div>
          <span className="font-bold text-2xl text-brand-600">{showRate}%</span>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-slate-800 mb-4">By Ticket Type</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="pb-3">Type</th>
              <th className="pb-3 text-right">Sold</th>
              <th className="pb-3 text-right">Attended</th>
              <th className="pb-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(report.byType).map(([type, data]) => (
              <tr key={type} className="border-b border-slate-50">
                <td className="py-3 font-semibold">{type}</td>
                <td className="py-3 text-right">{data.sold}</td>
                <td className="py-3 text-right">{data.checkedIn}</td>
                <td className="py-3 text-right font-bold text-emerald-600">
                  ${data.revenue.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}