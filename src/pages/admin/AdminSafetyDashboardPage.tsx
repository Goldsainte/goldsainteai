// src/pages/admin/AdminSafetyDashboardPage.tsx
import { useEffect, useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";
import {
  getRecentReports,
  getRecentSafetyEvents,
  AdminReport,
  AdminSafetyEvent,
} from "@/services/adminSafetyService";
import { useUserRole } from "@/hooks/useUserRole";

const BG = "bg-[#0a2225]";

export default function AdminSafetyDashboardPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [events, setEvents] = useState<AdminSafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin) return;

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
  }, [isAdmin, roleLoading]);

  if (roleLoading) {
    return (
      <main className={`${BG} min-h-screen flex items-center justify-center`}>
        <p className="text-[12px] text-[#E5DFC6]/80">Checking access…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className={`${BG} min-h-screen flex items-center justify-center`}>
        <p className="text-[12px] text-[#E5DFC6]/80">
          You don't have permission to view this page.
        </p>
      </main>
    );
  }

  return (
    <main className={`${BG} min-h-screen text-[#E5DFC6]`}>
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-4 md:pt-10 md:pb-6">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#061215] px-3 py-1 text-[11px] border border-[#31434a]">
            <Shield className="h-3 w-3 text-[#BFAD72]" />
            <span className="tracking-[0.16em] uppercase text-[#8D8D8D]">
              Admin · Trust & Safety
            </span>
          </div>
          <h1 className="font-display text-[22px] md:text-[24px] leading-snug">
            Goldsainte safety overview
          </h1>
          <p className="text-[11px] text-[#c6d0d4] max-w-xl">
            A quick view of user reports and automated chat flags. Use this to
            spot off-platform behavior, payment risks and accounts that may need
            closer review.
          </p>
        </header>

        {error && (
          <p className="mt-3 text-[11px] text-red-300">{error}</p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 md:pb-20 space-y-5">
        {/* Reports */}
        <div className="rounded-3xl bg-[#061215] border border-[#31434a] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-[#BFAD72]" />
              User reports
            </p>
            <p className="text-[10px] text-[#8D8D8D]">
              Showing most recent {reports.length} reports
            </p>
          </div>
          {loading ? (
            <p className="text-[11px] text-[#8D8D8D]">Loading reports…</p>
          ) : reports.length === 0 ? (
            <p className="text-[11px] text-[#8D8D8D]">No reports yet.</p>
          ) : (
            <div className="overflow-x-auto text-[11px]">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead className="text-[10px] text-[#8D8D8D]">
                  <tr>
                    <th className="text-left pr-3">When</th>
                    <th className="text-left pr-3">Type</th>
                    <th className="text-left pr-3">Reporter</th>
                    <th className="text-left pr-3">Reported</th>
                    <th className="text-left pr-3">Context</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td className="align-top pr-3 text-[#c6d0d4]">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="align-top pr-3">
                        {formatReportType(r.report_type)}
                      </td>
                      <td className="align-top pr-3">
                        {shortId(r.reporter_id)}
                      </td>
                      <td className="align-top pr-3">
                        {r.reported_user_id ? shortId(r.reported_user_id) : "—"}
                      </td>
                      <td className="align-top pr-3 text-[#8D8D8D] max-w-xs">
                        <div className="space-y-1">
                          <p>
                            {r.conversation_id && (
                              <span>Conv: {shortId(r.conversation_id)} </span>
                            )}
                            {r.booking_id && (
                              <span>· Booking: {shortId(r.booking_id)}</span>
                            )}
                          </p>
                          {r.description && (
                            <p className="text-[10px] line-clamp-2">
                              {r.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="align-top text-[10px]">
                        <StatusPill status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Safety events */}
        <div className="rounded-3xl bg-[#061215] border border-[#31434a] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-[#d4c58d]" />
              Automated chat flags
            </p>
            <p className="text-[10px] text-[#8D8D8D]">
              Showing most recent {events.length} events
            </p>
          </div>
          {loading ? (
            <p className="text-[11px] text-[#8D8D8D]">Loading safety events…</p>
          ) : events.length === 0 ? (
            <p className="text-[11px] text-[#8D8D8D]">
              No safety events have been logged yet.
            </p>
          ) : (
            <div className="overflow-x-auto text-[11px]">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead className="text-[10px] text-[#8D8D8D]">
                  <tr>
                    <th className="text-left pr-3">When</th>
                    <th className="text-left pr-3">Event</th>
                    <th className="text-left pr-3">Sender</th>
                    <th className="text-left pr-3">Conversation</th>
                    <th className="text-left">Snippet</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td className="align-top pr-3 text-[#c6d0d4]">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td className="align-top pr-3">
                        {formatEventType(e.event_type)}
                      </td>
                      <td className="align-top pr-3">
                        {shortId(e.sender_id)}
                      </td>
                      <td className="align-top pr-3">
                        {shortId(e.conversation_id)}
                      </td>
                      <td className="align-top text-[#8D8D8D] max-w-xs">
                        {truncate(e.original_text, 120)}
                        {e.reasons && e.reasons.length > 0 && (
                          <p className="text-[10px] text-[#d4c58d] mt-1">
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
        </div>
      </section>
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
  let bg = "#31434a";
  let text = "#E5DFC6";

  if (normalized === "open") {
    bg = "#783d3d";
  } else if (normalized === "under_review") {
    bg = "#725827";
  } else if (normalized === "closed") {
    bg = "#244a3c";
  }

  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[10px]"
      style={{ backgroundColor: bg, color: text }}
    >
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
