import { useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import API from "../api";
import toast from "react-hot-toast";
import {
  QrCode,
  CheckCircle2,
  XCircle,
  ScanLine,
  Camera,
  KeyboardIcon,
  Zap,
  RefreshCw,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";

export default function Scanner() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") || null;

  const [tab, setTab] = useState("camera");
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [manual, setManual] = useState("");
  const [recent, setRecent] = useState([]);
  const [event, setEvent] = useState(null);
  const scannerRef = useRef(null);

  const loadRecent = () => {
    API.get("/tickets/checkins/recent").then((r) => {
      let list = r.data;
      // If scanning for a specific event, filter the feed to that event
      if (eventId) {
        list = list.filter((t) => t.event?._id === eventId);
      }
      setRecent(list);
    });
  };

  const loadEvent = () => {
    if (eventId) {
      API.get(`/events/${eventId}`)
        .then((r) => setEvent(r.data))
        .catch(() => toast.error("Event not found"));
    }
  };

  useEffect(() => {
    loadEvent();
    loadRecent();
    const interval = setInterval(loadRecent, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  // Camera scanning
  useEffect(() => {
    if (tab !== "camera" || !scanning) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(onScanSuccess, () => {});
    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [tab, scanning, eventId]);

  const onScanSuccess = async (decodedText) => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch {}
    }
    setScanning(false);

    try {
      const { data } = await API.post("/tickets/checkin", {
        qrData: decodedText,
        eventId, // ⭐ pass event scope to backend
      });
      setResult({ success: true, ...data });
      toast.success("Checked in!");
      loadRecent();
    } catch (err) {
      setResult({
        success: false,
        msg: err.response?.data?.msg || "Invalid ticket",
        ticket: err.response?.data?.ticket,
      });
      toast.error(err.response?.data?.msg || "Invalid QR");
    }
  };

  const reset = () => {
    setResult(null);
    setScanning(true);
    setManual("");
  };

  const submitManual = async () => {
    if (!manual.trim()) return;
    try {
      JSON.parse(manual);
      await onScanSuccess(manual);
    } catch {
      toast.error("Please paste the exact QR data (JSON format)");
    }
  };

  const runDemoCheckin = async () => {
    try {
      const { data } = await API.post("/tickets/demo-checkin", { eventId });
      setResult({ success: true, ...data });
      toast.success("Demo check-in done!");
      loadRecent();
    } catch (err) {
      toast.error(err.response?.data?.msg || "No ticket available");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back to event if scoped */}
      {eventId && event && (
        <a
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to {event.title}
        </a>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Check-In Scanner
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {eventId && event
              ? `Scanning for: ${event.title}`
              : "Scan attendee QR codes at the door — fast and easy"}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {eventId ? "This event" : "Recent"}
            </p>
            <p className="font-bold text-slate-800 dark:text-white">
              {recent.length} check-ins
            </p>
          </div>
        </div>
      </div>

      {/* Scope banner */}
      {eventId && event && (
        <div className="card bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-900/20 dark:to-indigo-900/20 border-brand-200 dark:border-brand-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
              🎯
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-brand-900 dark:text-brand-200 text-sm">
                Scoped to: {event.title}
              </p>
              <p className="text-xs text-brand-700 dark:text-brand-300">
                Tickets for other events will be rejected
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 rounded-xl p-1.5 border border-slate-200 dark:border-slate-700 w-fit">
        {[
          { id: "camera", icon: Camera, label: "Camera" },
          { id: "manual", icon: KeyboardIcon, label: "Manual Entry" },
          { id: "demo", icon: Zap, label: "Quick Demo" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setResult(null);
              setScanning(true);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${
              tab === t.id
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: Scanner area */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <ScanLine size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white capitalize">
                {tab === "camera"
                  ? "Scan QR Code"
                  : tab === "manual"
                  ? "Manual Entry"
                  : "Quick Demo Check-In"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tab === "camera"
                  ? "Point the camera at the ticket QR"
                  : tab === "manual"
                  ? "Paste the QR data from any source"
                  : "Auto check-in the most recent ticket"}
              </p>
            </div>
          </div>

          {/* CAMERA TAB */}
          {tab === "camera" && (
            <>
              {scanning ? (
                <div
                  id="qr-reader"
                  className="rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="aspect-square rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Scanner paused
                  </p>
                </div>
              )}
              {!scanning && (
                <button
                  onClick={reset}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Scan next ticket
                </button>
              )}
              <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  💡 <strong>Pro tip:</strong> Open the ticket QR on your phone → point
                  this camera at it. Works on laptop webcam or phone camera.
                </p>
              </div>
            </>
          )}

          {/* MANUAL TAB */}
          {tab === "manual" && (
            <>
              <textarea
                rows={6}
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                className="input font-mono text-xs resize-none"
                placeholder='{"ticketId":"...","eventId":"...","userId":"..."}'
              />
              <button
                onClick={submitManual}
                disabled={!manual.trim()}
                className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
              >
                <QrCode size={16} /> Check in this ticket
              </button>
              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  💡 <strong>How to get QR data:</strong> Right-click a QR image
                  on My Tickets → "Copy Image Address" → but that won't give you
                  the raw data. Use the Quick Demo tab instead.
                </p>
              </div>
            </>
          )}

          {/* DEMO TAB */}
          {tab === "demo" && (
            <>
              <div className="aspect-square rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-4 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute bottom-4 right-4 w-60 h-60 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="text-center text-white relative z-10 p-6">
                  <Zap size={64} className="mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">One-click demo</h3>
                  <p className="text-white/80 text-sm">
                    Auto check-in the most recent ticket for a live demo moment.
                  </p>
                </div>
              </div>
              <button
                onClick={runDemoCheckin}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700"
              >
                <Zap size={16} /> Run demo check-in
              </button>
              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  ⚡ <strong>Use this</strong> if the camera isn't working during
                  your demo. It picks the latest unpaid ticket
                  {eventId ? " for this event" : ""} and checks them in.
                </p>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Result + Recent feed */}
        <div className="space-y-6">
          {/* Result card */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">
                  Scan Result
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest verification
                </p>
              </div>
            </div>

            {!result ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <QrCode className="text-slate-400" size={28} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Waiting for a scan...
                </p>
              </div>
            ) : result.success ? (
              <div className="animate-fade-in">
                <div className="text-center mb-4">
                  <CheckCircle2
                    className="text-emerald-500 mx-auto mb-3"
                    size={56}
                  />
                  <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    Valid Ticket ✓
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Welcome!
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      Name
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {result.ticket?.user?.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      Event
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {result.ticket?.event?.title}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      Type
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {result.ticket?.ticketType}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 animate-fade-in">
                <XCircle className="text-red-500 mx-auto mb-3" size={56} />
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                  {result.msg || "Invalid"}
                </h3>
                {result.ticket && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      <strong>{result.ticket.user?.name}</strong>
                      {result.ticket.checkedIn
                        ? ` already checked in${
                            result.ticket.checkedInAt
                              ? ` at ${new Date(
                                  result.ticket.checkedInAt
                                ).toLocaleTimeString()}`
                              : ""
                          }`
                        : " — ticket belongs to a different event"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent check-ins */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">
                  Recent Check-Ins
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live feed (auto-refreshes)
                </p>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recent.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                  No check-ins yet
                </p>
              ) : (
                recent.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {t.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                        {t.user?.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {t.event?.title}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                      {t.checkedInAt
                        ? format(new Date(t.checkedInAt), "h:mm a")
                        : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}