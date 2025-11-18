import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface BookingSummaryRow {
  id: string;
  status: string;
  escrow_status: string | null;
  total_price_cents: number | null;
  currency: string | null;
  commission_mode: string | null;
}

interface MilestoneRow {
  id: string;
  label: string;
  status: string;
  percentage: number;
  due_at: string | null;
  booking_id: string;
}

interface DisputeRow {
  id: string;
  booking_id: string;
  status: string;
  type: string;
  summary: string;
  created_at: string;
}

interface KycProfile {
  id: string;
  display_name: string | null;
  account_type: string | null;
  kyc_status: string | null;
  agent_license_state: string | null;
}

interface CancellationPolicyRow {
  id: string;
  name: string;
  rules: Record<string, number>;
}

interface FlaggedMessageRow {
  id: string;
  body: string;
  safety_flag: string | null;
  created_at: string;
  sender_id: string;
}

const currencyFormat = (cents?: number | null, currency?: string | null) => {
  if (!cents) return "—";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  });
  return formatter.format(cents / 100);
};

export default function AdminMarketplaceOversightPage() {
  const [bookings, setBookings] = useState<BookingSummaryRow[]>([]);
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [kycQueue, setKycQueue] = useState<KycProfile[]>([]);
  const [policies, setPolicies] = useState<CancellationPolicyRow[]>([]);
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [bookingRes, milestoneRes, disputeRes, kycRes, policyRes, messageRes] =
          await Promise.all([
            supabase
              .from("bookings")
              .select("id, status, escrow_status, total_price_cents, currency, commission_mode")
              .order("created_at", { ascending: false })
              .limit(50),
            supabase
              .from("booking_milestones")
              .select("id, label, status, percentage, due_at, booking_id")
              .order("due_at", { ascending: true })
              .limit(25),
            supabase
              .from("disputes")
              .select("id, booking_id, status, type, summary, created_at")
              .order("created_at", { ascending: false })
              .limit(20),
            supabase
              .from("profiles")
              .select("id, display_name, account_type, kyc_status, agent_license_state")
              .in("kyc_status", ["pending", "rejected"])
              .order("kyc_status", { ascending: true }),
            supabase
              .from("cancellation_policies")
              .select("id, name, rules")
              .order("created_at", { ascending: false }),
            supabase
              .from("messages")
              .select("id, body, safety_flag, created_at, sender_id")
              .not("safety_flag", "is", null)
              .order("created_at", { ascending: false })
              .limit(10),
          ]);

        if (cancelled) return;
        setBookings((bookingRes.data as BookingSummaryRow[]) || []);
        setMilestones((milestoneRes.data as MilestoneRow[]) || []);
        setDisputes((disputeRes.data as DisputeRow[]) || []);
        setKycQueue((kycRes.data as KycProfile[]) || []);
        setPolicies((policyRes.data as CancellationPolicyRow[]) || []);
        setFlaggedMessages((messageRes.data as FlaggedMessageRow[]) || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const escrowSummary = useMemo(() => {
    return bookings.reduce(
      (acc, booking) => {
        const status = booking.escrow_status || "HELD";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [bookings]);

  return (
    <main className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Marketplace Oversight · Goldsainte Admin</title>
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Operations
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Marketplace oversight
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Monitor escrow, commission splits, cancellation protections, partner verification,
            disputes, and on-platform communication risks in one view.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <OverviewCard
            title="Active bookings"
            icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
            value={bookings.length.toString()}
            subtitle={`${escrowSummary["HELD"] || 0} held · ${escrowSummary["PARTIALLY_RELEASED"] || 0} partial`}
          />
          <OverviewCard
            title="Open disputes"
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            value={disputes.length.toString()}
            subtitle="Needs review"
          />
          <OverviewCard
            title="KYC queue"
            icon={<ShieldCheck className="h-5 w-5 text-indigo-600" />}
            value={kycQueue.length.toString()}
            subtitle="Pending or rejected"
          />
        </section>

        <DataCard title="Escrow + commissions" description="Latest bookings and their split.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Booking</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Escrow</th>
                  <th className="py-2 pr-4">Commission</th>
                  <th className="py-2 pr-4 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-900">
                      #{booking.id.slice(0, 6)}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">{booking.status}</td>
                    <td className="py-2 pr-4 text-slate-600">{booking.escrow_status || "HELD"}</td>
                    <td className="py-2 pr-4 text-slate-600">{booking.commission_mode || "—"}</td>
                    <td className="py-2 pr-4 text-right font-semibold text-slate-900">
                      {currencyFormat(booking.total_price_cents, booking.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataCard>

        <div className="grid gap-4 md:grid-cols-2">
          <DataCard title="Escrow milestones" description="Upcoming releases">
            <div className="space-y-2 text-sm">
              {milestones.length === 0 && (
                <p className="text-slate-500">No milestones queued.</p>
              )}
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2"
                >
                  <p className="font-medium text-slate-900">{milestone.label}</p>
                  <p className="text-xs text-slate-500">
                    #{milestone.booking_id.slice(0, 6)} · {milestone.percentage}% · {milestone.status}
                  </p>
                  {milestone.due_at && (
                    <p className="text-xs text-slate-500">
                      Due {new Date(milestone.due_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </DataCard>

          <DataCard title="Disputes" description="Quality, billing, safety">
            <div className="space-y-2 text-sm">
              {disputes.length === 0 && (
                <p className="text-slate-500">No active disputes.</p>
              )}
              {disputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2"
                >
                  <p className="font-medium text-amber-900">{dispute.summary}</p>
                  <p className="text-xs text-amber-700">
                    #{dispute.booking_id.slice(0, 6)} · {dispute.type} · {dispute.status}
                  </p>
                </div>
              ))}
            </div>
          </DataCard>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DataCard title="KYC + licensing" description="Creators & agents requiring attention">
            <div className="space-y-2 text-sm">
              {kycQueue.length === 0 && <p className="text-slate-500">All clear.</p>}
              {kycQueue.map((profile) => (
                <div
                  key={profile.id}
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
                >
                  <p className="font-medium text-slate-900">
                    {profile.display_name || profile.id.slice(0, 6)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {profile.account_type || "partner"} · {profile.kyc_status}
                  </p>
                  {profile.agent_license_state && (
                    <p className="text-xs text-slate-500">
                      License state: {profile.agent_license_state}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </DataCard>

          <DataCard title="Cancellation policies" description="Refund bands in play">
            <div className="space-y-2 text-sm">
              {policies.length === 0 && (
                <p className="text-slate-500">No policies configured.</p>
              )}
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
                >
                  <p className="font-medium text-slate-900">{policy.name}</p>
                  <p className="text-xs text-slate-500">
                    {Object.entries(policy.rules || {})
                      .map(([band, penalty]) => `${band}: ${Math.round((penalty || 0) * 100)}% kept`)
                      .join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </DataCard>
        </div>

        <DataCard title="Flagged messages" description="Potential off-platform contact attempts">
          <div className="space-y-2 text-sm">
            {flaggedMessages.length === 0 && (
              <p className="text-slate-500">No flagged content in the last 10 messages.</p>
            )}
            {flaggedMessages.map((message) => (
              <div
                key={message.id}
                className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2"
              >
                <p className="font-medium text-rose-900">
                  {message.body.replace(/\n/g, " ")}
                </p>
                <p className="text-xs text-rose-700">
                  Sender {message.sender_id.slice(0, 6)} · {message.safety_flag}
                </p>
              </div>
            ))}
          </div>
        </DataCard>

        {loading && <p className="text-center text-xs text-slate-500">Syncing latest data…</p>}
      </div>
    </main>
  );
}

function OverviewCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-2">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function DataCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}
