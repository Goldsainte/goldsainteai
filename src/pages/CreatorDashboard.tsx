import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type CreatorStats = {
  tiktokConnected: boolean;
  totalTripStories: number;
  totalTripsLinked: number;
  totalEstimatedEarnings: number;
  recentStories: {
    id: string;
    title: string;
    createdAt: string;
    postedToTikTok: boolean;
    tiktokVideoId?: string | null;
  }[];
};

const EMPTY_STATS: CreatorStats = {
  tiktokConnected: false,
  totalTripStories: 0,
  totalTripsLinked: 0,
  totalEstimatedEarnings: 0,
  recentStories: [],
};

export default function CreatorDashboard() {
  const [stats, setStats] = useState<CreatorStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "creator-dashboard-stats",
          {
            body: {},
          }
        );

        if (fnError) {
          console.error(fnError);
          if (!isMounted) return;
          setError(
            fnError.message || "Unable to load creator stats at the moment."
          );
          setStats(EMPTY_STATS);
          return;
        }

        if (!isMounted) return;

        setStats({
          tiktokConnected: !!data?.tiktokConnected,
          totalTripStories: data?.totalTripStories ?? 0,
          totalTripsLinked: data?.totalTripsLinked ?? 0,
          totalEstimatedEarnings: data?.totalEstimatedEarnings ?? 0,
          recentStories: data?.recentStories ?? [],
        });
      } catch (e: any) {
        console.error(e);
        if (!isMounted) return;
        setError("Unexpected error while loading stats.");
        setStats(EMPTY_STATS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {/* HEADER */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Creator Dashboard
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              See how your TikTok travel content is performing and how many
              trips you're selling through Goldsainte.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/tiktok-lab"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Open Goldsainte Creator Lab
            </Link>
            <Link
              to="/browse-creators"
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80"
            >
              View Creator Marketplace
            </Link>
          </div>
        </header>

        {/* TIKTOK CONNECT STATUS + METRICS */}
        <section className="mt-6 grid gap-4 md:grid-cols-[2fr,3fr]">
          {/* TikTok connection card */}
          <div className="rounded-2xl bg-card p-4 shadow-sm border">
            <h2 className="text-sm font-semibold text-card-foreground">
              TikTok connection
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect your TikTok account so we can post on your behalf and
              track performance.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-muted px-3 py-2">
              <div className="flex flex-col text-xs">
                <span className="font-medium text-foreground">
                  {stats.tiktokConnected
                    ? "TikTok account connected"
                    : "TikTok not connected"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {stats.tiktokConnected
                    ? "You're ready to publish from Goldsainte Creator Lab."
                    : "Connect TikTok to start publishing stories."}
                </span>
              </div>
              <Link
                to="/tiktok-lab"
                className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {stats.tiktokConnected ? "Manage connection" : "Connect TikTok"}
              </Link>
            </div>
          </div>

          {/* Summary metrics */}
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryStat
              label="Trip stories created"
              value={loading ? "…" : stats.totalTripStories.toString()}
              helper="Stories built in Goldsainte Creator Lab"
            />
            <SummaryStat
              label="Trips linked to TikTok"
              value={loading ? "…" : stats.totalTripsLinked.toString()}
              helper="Trips that have a TikTok story attached"
            />
            <SummaryStat
              label="Estimated earnings"
              value={
                loading
                  ? "…"
                  : `$${stats.totalEstimatedEarnings.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}`
              }
              helper="Based on trips sold through your content"
            />
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            {error}
          </div>
        )}

        {/* RECENT STORIES */}
        <section className="mt-6 rounded-2xl bg-card p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-card-foreground">
                Recent TikTok trip stories
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                These are stories you've created in Goldsainte Creator Lab and linked
                to trips.
              </p>
            </div>
            <Link
              to="/tiktok-lab"
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Create new story
            </Link>
          </div>

          <div className="mt-3 space-y-2">
            {loading ? (
              <div className="rounded-xl bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                Loading your stories…
              </div>
            ) : stats.recentStories.length === 0 ? (
              <div className="rounded-xl bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                You haven't created any trip stories yet. Start in TikTok Travel
                Lab.
              </div>
            ) : (
              stats.recentStories.map((story) => (
                <div
                  key={story.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {story.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(story.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        story.postedToTikTok
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted-foreground/10 text-muted-foreground",
                      ].join(" ")}
                    >
                      {story.postedToTikTok ? "Sent to TikTok" : "Draft only"}
                    </span>
                    {story.tiktokVideoId && (
                      <a
                        href={`https://www.tiktok.com/@goldsainte/video/${story.tiktokVideoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        View on TikTok
                      </a>
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

function SummaryStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm border">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{helper}</div>
    </div>
  );
}
