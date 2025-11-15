// src/pages/partner/PartnerConsolePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMyPartnerPipeline } from "@/services/partnerPipelineService";
import { getMyEarningsSummary } from "@/services/earningsService";
import { Sparkles, FileText, DollarSign, Video, ArrowRight } from "lucide-react";
import { useRequireOnboarding } from "@/hooks/useRequireOnboarding";

export default function PartnerConsolePage() {
  const { checking, allowed } = useRequireOnboarding();
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState<{ proposals: any[]; bookings: any[] }>({
    proposals: [],
    bookings: [],
  });
  const [earnings, setEarnings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login?redirect=/partner", { replace: true });
        return;
      }

      const type =
        (user.user_metadata?.account_type as string | undefined) ?? null;
      setAccountType(type);

      try {
        const [pipe, earn] = await Promise.all([
          getMyPartnerPipeline(),
          getMyEarningsSummary(),
        ]);
        if (!cancelled) {
          setPipeline(pipe);
          setEarnings(earn);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          setError(err.message || "Could not load partner console.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const currency = earnings?.currency || "USD";

  if (checking || !allowed) {
    return (
      <main className="min-h-screen bg-[#0a2225] text-[#E5DFC6] flex items-center justify-center">
        <p className="text-xs">Loading your Goldsainte space…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] text-primary font-semibold">
              <Sparkles className="h-3 w-3" />
              Goldsainte partner console
            </p>
            <h1 className="text-lg md:text-xl font-semibold">
              Your TikTok travel pipeline
            </h1>
            <p className="text-[11px] text-muted-foreground max-w-md">
              View briefs you've responded to, bookings in progress, and what
              you've earned — in one clean view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <Link
              to="/tiktok-lab"
              className="rounded-full bg-primary text-primary-foreground px-3 py-1 font-semibold hover:bg-primary/90"
            >
              Open TikTok Lab
            </Link>
            <Link
              to="/earnings"
              className="rounded-full border border-border bg-card px-3 py-1 hover:bg-accent"
            >
              View earnings & payouts
            </Link>
          </div>
        </header>

        {error && (
          <p className="text-[11px] text-destructive bg-destructive/10 border border-destructive/40 rounded-2xl px-3 py-2">
            {error}
          </p>
        )}

        {loading && <p className="text-xs">Loading your pipeline…</p>}

        {/* Top summary cards */}
        {earnings && (
          <section className="grid gap-4 md:grid-cols-3 text-xs">
            <SummaryCard
              icon={<FileText className="h-4 w-4 text-primary" />}
              label="Open briefs & proposals"
              value={pipeline.proposals.length}
              helper="Trip requests you've responded to."
            />
            <SummaryCard
              icon={<DollarSign className="h-4 w-4 text-primary" />}
              label="Available earnings"
              value={`${currency} ${earnings.available.toFixed(2)}`}
              helper="Ready to move to your payout account."
            />
            <SummaryCard
              icon={<Video className="h-4 w-4 text-primary" />}
              label={
                accountType === "creator"
                  ? "Storyboard tasks"
                  : "Trips needing details"
              }
              value={
                pipeline.bookings.filter(
                  (b) => b.status === "paid" || b.status === "in_progress",
                ).length
              }
              helper="Trips where your creative or itinerary work matters now."
            />
          </section>
        )}

        {/* Pipeline: proposals */}
        <section className="grid gap-4 md:grid-cols-2 text-xs">
          <div className="rounded-3xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold">
                  Trip briefs & proposals
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Requests you've pitched on, before they become bookings.
                </p>
              </div>
              <FileText className="h-4 w-4 text-primary" />
            </div>

            {pipeline.proposals.length === 0 && !loading ? (
              <p className="text-[11px] text-muted-foreground">
                No active proposals yet. Head to TikTok Lab or the trip
                marketplace to find briefs to respond to.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {pipeline.proposals.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/trip/${p.trip_request_id}`)}
                    className="w-full text-left rounded-2xl bg-muted/40 border border-border px-3 py-2 hover:border-primary"
                  >
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()} ·{" "}
                      <span className="text-primary">{p.status}</span>
                    </p>
                    <p className="text-[12px] font-semibold">
                      {p.trips?.title || "Trip brief"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.trips?.destination || "Destination TBD"}
                    </p>
                    {p.price_from && (
                      <p className="mt-1 text-[10px] text-primary">
                        Proposed: ${p.price_from}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pipeline: bookings */}
          <div className="rounded-3xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold">Active bookings</p>
                <p className="text-[10px] text-muted-foreground">
                  Deals that have moved beyond the pitch — where your delivery
                  matters.
                </p>
              </div>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>

            {pipeline.bookings.length === 0 && !loading ? (
              <p className="text-[11px] text-muted-foreground">
                Once a traveler accepts your proposal and pays, those trips will
                show up here as active bookings.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {pipeline.bookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => navigate(`/booking/${b.id}`)}
                    className="w-full text-left rounded-2xl bg-muted/40 border border-border px-3 py-2 hover:border-primary"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(b.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-[12px] font-semibold">
                          {b.trips?.title || "Trip booking"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {b.trips?.destination || "Destination TBD"}
                        </p>
                      </div>
                      <div className="text-right">
                        {b.total_amount && (
                          <p className="text-[11px] text-primary font-semibold">
                            {b.currency || "USD"} {b.total_amount}
                          </p>
                        )}
                        <p className="text-[9px] text-muted-foreground">
                          {b.status}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* TikTok Lab CTA */}
        <section className="rounded-3xl bg-accent text-accent-foreground p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
          <div className="space-y-1 max-w-xl">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Grow with Goldsainte
            </p>
            <p className="text-sm font-semibold">
              Use TikTok Lab to design better boards and close more trips.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Creators: storyboard each journey like a TikTok series. Agents:
              plug in the contracts behind the scenes. Together, you ship trips
              travelers brag about.
            </p>
          </div>
          <Link
            to="/tiktok-lab"
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] hover:bg-accent/50"
          >
            Open TikTok Lab
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-3xl bg-card border border-border p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{helper}</p>
    </div>
  );
}
