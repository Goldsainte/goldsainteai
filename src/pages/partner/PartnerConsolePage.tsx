// src/pages/partner/PartnerConsolePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMyPartnerPipeline } from "@/services/partnerPipelineService";
import { getMyEarningsSummary } from "@/services/earningsService";
import { Sparkles, FileText, DollarSign, Video, ArrowRight } from "lucide-react";
import { useRequireOnboarding } from "@/hooks/useRequireOnboarding";
import { useUserRole } from "@/hooks/useUserRole";

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
  // Live from the database (profiles.account_type), not stale auth signup metadata.
  const { isCreator } = useUserRole();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        sessionStorage.setItem('returnTo', '/partner');
        navigate("/auth?returnTo=/partner", { replace: true });
        return;
      }

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
      <main className="min-h-screen bg-[#FDF9F0] text-[#0a2225] flex items-center justify-center">
        <p className="text-xs text-[#6B7280]">Loading your Goldsainte space…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDF9F0] text-[#0a2225] px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#7A7151] font-medium">
              <Sparkles className="h-3 w-3 text-[#C7A962]" />
              Partner console
            </p>
            <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225] mt-1">
              Your travel pipeline
            </h1>
            <p className="text-sm text-[#6B7280] max-w-md mt-2">
              Briefs you've responded to, bookings in progress, and what
              you've earned — in one editorial view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/storyboards"
              className="rounded-full bg-[#0c4d47] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#0a3d39] transition-colors"
            >
              Open Creator Lab
            </Link>
            <Link
              to="/earnings"
              className="rounded-full border border-[#E5DFC6] bg-white px-5 py-2.5 text-xs font-medium text-[#0a2225] hover:bg-[#F5F0E0] transition-colors"
            >
              Earnings & payouts
            </Link>
          </div>
        </header>

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            {error}
          </p>
        )}

        {loading && <p className="text-xs text-[#6B7280]">Loading your pipeline…</p>}

        {/* Top summary cards */}
        {earnings && (
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={<FileText className="h-4 w-4 text-[#C7A962]" />}
              label="Open briefs & proposals"
              value={pipeline.proposals.length}
              helper="Trip requests you've responded to."
            />
            <SummaryCard
              icon={<DollarSign className="h-4 w-4 text-[#C7A962]" />}
              label="Available earnings"
              value={`${currency} ${earnings.available.toFixed(2)}`}
              helper="Ready to move to your payout account."
            />
            <SummaryCard
              icon={<Video className="h-4 w-4 text-[#C7A962]" />}
              label={
                isCreator
                  ? "Storyboard tasks"
                  : "Trips needing details"
              }
              value={
                pipeline.bookings.filter(
                  (b) => b.status === "paid" || b.status === "in_progress",
                ).length
              }
              helper="Trips where your work matters now."
            />
          </section>
        )}

        {/* Pipeline */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="bg-white border border-[#E5DFC6] rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-secondary text-lg text-[#0a2225]">
                  Trip briefs & proposals
                </h2>
                <p className="text-xs text-[#6B7280] mt-1">
                  Requests you've pitched on, before they become bookings.
                </p>
              </div>
              <FileText className="h-4 w-4 text-[#C7A962] mt-1" />
            </div>

            {pipeline.proposals.length === 0 && !loading ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#6B7280] max-w-xs mx-auto">
                  No active proposals yet. Head to the Creator Lab or trip
                  marketplace to find briefs to respond to.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {pipeline.proposals.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/trip/${p.trip_request_id}`)}
                    className="w-full text-left rounded-xl bg-[#FDF9F0] border border-[#E5DFC6] px-4 py-3 hover:border-[#0c4d47] transition-colors"
                  >
                    <p className="text-[11px] text-[#7A7151]">
                      {new Date(p.created_at).toLocaleDateString()} ·{" "}
                      <span className="text-[#0c4d47] font-medium uppercase tracking-wide">{p.status}</span>
                    </p>
                    <p className="text-sm font-medium text-[#0a2225] mt-0.5">
                      {p.trips?.title || "Trip brief"}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {p.trips?.destination || "Destination TBD"}
                    </p>
                    {p.price_from && (
                      <p className="mt-1 text-xs text-[#0c4d47] font-medium">
                        Proposed: ${p.price_from}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E5DFC6] rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-secondary text-lg text-[#0a2225]">Active bookings</h2>
                <p className="text-xs text-[#6B7280] mt-1">
                  Deals that have moved beyond the pitch — where your delivery matters.
                </p>
              </div>
              <DollarSign className="h-4 w-4 text-[#C7A962] mt-1" />
            </div>

            {pipeline.bookings.length === 0 && !loading ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#6B7280] max-w-xs mx-auto">
                  Once a traveler accepts your proposal and pays, those trips will
                  appear here as active bookings.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {pipeline.bookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => navigate(`/booking/${b.id}`)}
                    className="w-full text-left rounded-xl bg-[#FDF9F0] border border-[#E5DFC6] px-4 py-3 hover:border-[#0c4d47] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-[#7A7151]">
                          {new Date(b.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-medium text-[#0a2225] mt-0.5">
                          {b.trips?.title || "Trip booking"}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {b.trips?.destination || "Destination TBD"}
                        </p>
                      </div>
                      <div className="text-right">
                        {b.total_amount && (
                          <p className="text-sm text-[#0c4d47] font-medium">
                            {b.currency || "USD"} {b.total_amount}
                          </p>
                        )}
                        <p className="text-[10px] uppercase tracking-wide text-[#7A7151] mt-0.5">
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

        {/* Creator Lab CTA */}
        <section className="rounded-2xl bg-white border border-[#E5DFC6] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#7A7151]">
              Grow with Goldsainte
            </p>
            <h2 className="font-secondary text-xl text-[#0a2225]">
              Design better boards. Close more trips.
            </h2>
            <p className="text-sm text-[#6B7280]">
              Creators storyboard each journey like an editorial series. Agents
              plug in the contracts behind the scenes. Together, you ship trips
              travelers brag about.
            </p>
          </div>
          <Link
            to="/storyboards"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#0a3d39] transition-colors whitespace-nowrap"
          >
            Open Creator Lab
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
    <div className="bg-white border border-[#E5DFC6] rounded-2xl p-5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wide text-[#7A7151]">{label}</p>
        {icon}
      </div>
      <p className="font-secondary text-2xl text-[#0a2225]">{value}</p>
      <p className="text-xs text-[#6B7280]">{helper}</p>
    </div>
  );
}
