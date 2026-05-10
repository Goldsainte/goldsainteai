import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type AgentDealsStats = {
  totalDeals: number;
  pendingDeals: number;
  activeDeals: number;
  totalRevenue: number;
  recentDeals: {
    id: string;
    tripTitle: string;
    status: string;
    compensation?: string | null;
    createdAt: string;
  }[];
};

const EMPTY_STATS: AgentDealsStats = {
  totalDeals: 0,
  pendingDeals: 0,
  activeDeals: 0,
  totalRevenue: 0,
  recentDeals: [],
};

export default function AgentDealsDashboardPage() {
  const navigate = useNavigate();
  const { isAdmin, isAgent, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<AgentDealsStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleLoading) return;
    
    if (!isAdmin && !isAgent) {
      navigate('/');
      return;
    }

    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke(
          "agent-deals-stats",
          { body: {} }
        );
        if (error) {
          console.error(error);
          if (!isMounted) return;
          setError("Unable to load agent deals.");
          setStats(EMPTY_STATS);
          return;
        }

        if (!isMounted) return;
        setStats({
          totalDeals: data?.totalDeals ?? 0,
          pendingDeals: data?.pendingDeals ?? 0,
          activeDeals: data?.activeDeals ?? 0,
          totalRevenue: data?.totalRevenue ?? 0,
          recentDeals: data?.recentDeals ?? [],
        });
      } catch (e: any) {
        console.error(e);
        if (!isMounted) return;
        setError("Unexpected error while loading deals.");
        setStats(EMPTY_STATS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, isAgent, roleLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Agent Deals Dashboard
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Track your collaborations with TikTok creators and the trips
              you're selling through Goldsainte.
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          <StatCard
            label="Total collab deals"
            value={
              loading ? "…" : stats.totalDeals.toLocaleString("en-US")
            }
          />
          <StatCard
            label="Pending proposals"
            value={
              loading ? "…" : stats.pendingDeals.toLocaleString("en-US")
            }
          />
          <StatCard
            label="Active collabs"
            value={
              loading ? "…" : stats.activeDeals.toLocaleString("en-US")
            }
          />
          <StatCard
            label="Total revenue (est.)"
            value={
              loading
                ? "…"
                : `$${stats.totalRevenue.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}`
            }
          />
        </section>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {isAdmin && (
                <span className="block mt-2 text-xs">
                  Note: Backend access for admins may be pending. Contact system administrator.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <section className="mt-6 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <h2 className="text-sm font-semibold">
            Recent collaboration requests
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            These are the latest deals you've proposed to creators.
          </p>

          <div className="mt-3 space-y-2">
            {loading ? (
              <div className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                Loading your deals…
              </div>
            ) : stats.recentDeals.length === 0 ? (
              <div className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                You haven't proposed any collaborations yet.
              </div>
            ) : (
              stats.recentDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {deal.tripTitle}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(deal.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs">
                    <span className={statusChipClass(deal.status)}>
                      {deal.status}
                    </span>
                    {deal.compensation && (
                      <span className="text-muted-foreground">
                        {deal.compensation}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">
        {value}
      </div>
    </div>
  );
}

function statusChipClass(status: string) {
  const base = "rounded-full px-2 py-0.5 text-[10px] font-semibold";
  switch (status) {
    case "pending":
      return `${base} bg-[#C7A962]/10 text-[#C7A962]`;
    case "accepted":
    case "live":
      return `${base} bg-green-500/10 text-green-700 dark:text-green-400`;
    case "rejected":
      return `${base} bg-red-500/10 text-red-700 dark:text-red-400`;
    case "completed":
      return `${base} bg-muted text-muted-foreground`;
    default:
      return `${base} bg-muted text-muted-foreground`;
  }
}
