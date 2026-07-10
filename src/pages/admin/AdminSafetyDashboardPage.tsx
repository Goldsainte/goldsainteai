// src/pages/admin/AdminSafetyDashboardPage.tsx
// Reskinned Jul 10 into the Registry house style (Registry phase two).
// All data loading, columns, and helpers preserved from the original.
import { useEffect, useState } from "react";
import {
  getRecentReports,
  getRecentSafetyEvents,
  AdminReport,
  AdminSafetyEvent,
} from "@/services/adminSafetyService";

function AdminSafetyDashboardContent() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [events, setEvents] = useState<AdminSafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [r, e] = await Promise.all([
          getRecentReports(),
          getRecentSafetyEvents(),
        ]);
        if (!cancelled) {
          setReports(r);
          setEvents(e);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Could not load data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const th = "text-left pr-4 pb-2 text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/40 font-medium";
  const td = "align-top pr-4 py-2.5 text-[12.5px] text-[#0a2225]/75 border-t border-[#F1EBDA]";

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-5 py-10 text-[#0a2225] md:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
          Trust &amp; systems
        </p>
        <h1 className="mt-2 font-secondary text-[28px] leading-tight md:text-[30px]">
          Safety overview
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#0a2225]/55">
          User reports and automated chat flags — for spotting off-platform behavior,
          payment risks, and accounts that may need closer review.
        </p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        {/* ── User reports ── */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-secondary text-[15px] italic text-[#C7A962]">i.</p>
              <h2 className="mt-0.5 font-secondary text-[19px]">User reports</h2>
            </div>
            <p className="text-[11px] text-[#0a2225]/40">
              Most recent {reports.length}
            </p>
          </div>
          {loading ? (
            <p className="mt-4 text-[13px] text-[#0a2225]/45">Loading reports…</p>
          ) : reports.length === 0 ? (
            <p className="mt-4 text-[13px] text-[#0a2225]/45">
              No reports yet — the house is quiet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className={th}>When</th>
                    <th className={th}>Type</th>
                    <th className={th}>Reporter</th>
                    <th className={th}>Reported</th>
                    <th className={th}>Context</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td className={td}>{new Date(r.created_at).toLocaleString()}</td>
                      <td className={td}>{formatReportType(r.report_type)}</td>
                      <td className={td}>{shortId(r.reporter_id)}</td>
                      <td className={td}>
                        {r.reported_user_id ? shortId(r.reported_user_id) : "—"}
                      </td>
                      <td className={`${td} max-w-xs`}>
                        <div className="space-y-1">
                          <p className="text-[11.5px] text-[#0a2225]/50">
                            {r.conversation_id && <span>Conv: {shortId(r.conversation_id)} </span>}
                            {r.booking_id && <span>· Booking: {shortId(r.booking_id)}</span>}
                          </p>
                          {r.description && (
                            <p className="line-clamp-2 text-[12px]">{r.description}</p>
                          )}
                        </div>
                      </td>
                      <td className={td}>
                        <StatusPill status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Automated chat flags ── */}
        <section className="mt-4 rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-secondary text-[15px] italic text-[#C7A962]">ii.</p>
              <h2 className="mt-0.5 font-secondary text-[19px]">Automated chat flags</h2>
            </div>
            <p className="text-[11px] text-[#0a2225]/40">
              Most recent {events.length}
            </p>
          </div>
          {loading ? (
            <p className="mt-4 text-[13px] text-[#0a2225]/45">Loading safety events…</p>
          ) : events.length === 0 ? (
            <p className="mt-4 text-[13px] text-[#0a2225]/45">
              No safety events have been logged yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className={th}>When</th>
                    <th className={th}>Event</th>
                    <th className={th}>Sender</th>
                    <th className={th}>Conversation</th>
                    <th className={th}>Snippet</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td className={td}>{new Date(e.created_at).toLocaleString()}</td>
                      <td className={td}>{formatEventType(e.event_type)}</td>
                      <td className={td}>{shortId(e.sender_id)}</td>
                      <td className={td}>{shortId(e.conversation_id)}</td>
                      <td className={`${td} max-w-xs`}>
                        {truncate(e.original_text, 120)}
                        {e.reasons && e.reasons.length > 0 && (
                          <p className="mt-1 text-[11px] text-[#8D6B2F]">
                            {e.reasons.join(" · ")}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatReportType(type: string) {
  switch (type) {
    case "off_platform_contact":
      return "Off-platform contact";
    case "payment_issue":
      return "Payment / external link";
    case "harassment":
      return "Harassment / behavior";
    case "spam":
      return "Spam";
    default:
      return type;
  }
}

function formatEventType(type: string) {
  switch (type) {
    case "potential_external_payment":
      return "External payment mention";
    case "potential_off_platform_contact":
      return "Off-platform contact hint";
    default:
      return type;
  }
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  let cls = "border-[#E5DFC6] bg-[#fdfaf2] text-[#0a2225]/70";
  if (normalized === "open") {
    cls = "border-[#8D6B2F]/40 bg-[#C7A962]/15 text-[#8D6B2F]";
  } else if (normalized === "under_review") {
    cls = "border-[#E5DFC6] bg-[#E5DFC6]/40 text-[#0a2225]/70";
  } else if (normalized === "closed") {
    cls = "border-[#0c4d47]/25 bg-[#0c4d47]/10 text-[#0c4d47]";
  }
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10.5px] ${cls}`}>
      {status}
    </span>
  );
}

function shortId(id: string | null) {
  if (!id) return "—";
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function truncate(text: string, max: number) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

export default function AdminSafetyDashboardPage() {
  return <AdminSafetyDashboardContent />;
}
