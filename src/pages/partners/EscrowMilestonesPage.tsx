import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Clock3, PauseCircle, AlertTriangle } from "lucide-react";

interface PartnerBookingRow {
  id: string;
  status: string;
  escrow_status: string | null;
  total_price_cents: number | null;
  currency: string | null;
  commission_mode: string | null;
  booking_milestones: {
    id: string;
    label: string;
    status: string;
    percentage: number;
    due_at: string | null;
  }[];
}

const currencyFormat = (cents?: number | null, currency?: string | null) => {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

export default function EscrowMilestonesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<PartnerBookingRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          navigate("/login?redirect=/partner/escrow", { replace: true });
          return;
        }

        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            status,
            escrow_status,
            total_price_cents,
            currency,
            commission_mode,
            booking_milestones (
              id,
              label,
              status,
              percentage,
              due_at
            )
          `)
          .or(`agent_id.eq.${user.id},creator_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!cancelled) setBookings((data as PartnerBookingRow[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50">
      <Helmet>
        <title>Escrow milestones · Goldsainte Partners</title>
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Partners</p>
          <h1 className="text-2xl font-semibold">Escrow + commission tracker</h1>
          <p className="text-sm text-slate-300">
            See how traveler payments move through escrow, when the next release triggers, and what portion of each booking belongs to you.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading bookings…
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl border border-slate-700 bg-slate-800/70 px-4 py-6 text-center text-sm text-slate-300">
            You don't have any escrowed bookings yet.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-3xl border border-slate-800 bg-slate-800/70 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      #{booking.id.slice(0, 6)}
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {currencyFormat(booking.total_price_cents, booking.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={booking.status} />
                    <StatusPill label={booking.escrow_status || "HELD"} tone="amber" />
                    {booking.commission_mode && (
                      <StatusPill label={booking.commission_mode} tone="slate" />
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {booking.booking_milestones?.length === 0 && (
                    <p className="text-xs text-slate-400">No milestones created.</p>
                  )}
                  {booking.booking_milestones?.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-white">{milestone.label}</p>
                        <p className="text-xs text-slate-400">
                          {milestone.percentage}% of partner payout
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <MilestoneStatus status={milestone.status} />
                        {milestone.due_at && (
                          <span>{new Date(milestone.due_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatusPill({ label, tone = "emerald" }: { label: string; tone?: "emerald" | "amber" | "slate" }) {
  const toneClasses: Record<string, string> = {
    emerald: "bg-emerald-500/20 text-emerald-200",
    amber: "bg-amber-500/20 text-amber-200",
    slate: "bg-slate-500/20 text-slate-200",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${toneClasses[tone] || toneClasses.emerald}`}>
      {label}
    </span>
  );
}

function MilestoneStatus({ status }: { status: string }) {
  if (status === "RELEASED") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-300">
        <CheckCircle2 className="h-3 w-3" /> Released
      </span>
    );
  }
  if (status === "ON_HOLD") {
    return (
      <span className="inline-flex items-center gap-1 text-amber-300">
        <PauseCircle className="h-3 w-3" /> On hold
      </span>
    );
  }
  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1 text-rose-300">
        <AlertTriangle className="h-3 w-3" /> Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-slate-300">
      <Clock3 className="h-3 w-3" /> Pending
    </span>
  );
}
