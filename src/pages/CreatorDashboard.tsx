import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { Sparkles, TrendingUp, Video, DollarSign, ExternalLink, Plus } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

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
        const { data, error: fnError } = await invokeWithAuth<CreatorStats>(
          "creator-dashboard-stats",
          { body: {} }
        );

        if (fnError) {
          console.error(fnError);
          if (!isMounted) return;
          setError(fnError || "Unable to load creator stats at the moment.");
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
    <div className="flex-1 bg-[#FDF9F0]">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* Back button */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Gold accent line */}
        <div className="w-16 h-0.5 bg-[#C7A962] mb-6" />

        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-[#E5DFC6] mb-4">
          <Sparkles className="h-4 w-4 text-[#C7A962]" />
          <span className="text-sm font-medium text-[#6B7280] tracking-wide">
            Creator Studio
          </span>
        </div>
        
        {/* Header */}
        <header className="mb-12">
          <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225] tracking-tight">
            Creator Dashboard
          </h1>
          <p className="mt-3 text-[#6B7280] text-base max-w-xl leading-relaxed">
            Track your content performance and see how your travel stories are inspiring journeys through Goldsainte.
          </p>
          
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/tiktok-lab"
              className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#0a2225]/90 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Open Creator Lab
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white px-6 py-3 text-sm font-medium text-[#0a2225] shadow-sm hover:bg-[#F6F0E4] transition-colors"
            >
              View Marketplace
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid gap-6 md:grid-cols-3 mb-12">
          <LuxuryStatCard
            icon={<Video className="w-5 h-5 text-[#C7A962]" />}
            label="Trip Stories"
            value={loading ? "—" : stats.totalTripStories.toString()}
            helper="Stories created in Creator Lab"
          />
          <LuxuryStatCard
            icon={<TrendingUp className="w-5 h-5 text-[#C7A962]" />}
            label="TikTok Linked"
            value={loading ? "—" : stats.totalTripsLinked.toString()}
            helper="Trips with content attached"
          />
          <LuxuryStatCard
            icon={<DollarSign className="w-5 h-5 text-[#C7A962]" />}
            label="Estimated Earnings"
            value={
              loading
                ? "—"
                : `$${stats.totalEstimatedEarnings.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}`
            }
            helper="Based on trips sold"
          />
        </section>

        {/* TikTok Connection Card */}
        <section className="mb-12">
          <div className="rounded-2xl bg-white border border-[#E5DFC6] p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F6F0E4] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="font-secondary text-xl text-[#0a2225]">
                    TikTok Connection
                  </h2>
                  <p className="mt-1 text-sm text-[#6B7280] max-w-md">
                    {stats.tiktokConnected
                      ? "Your TikTok account is connected. You're ready to publish stories directly from Creator Lab."
                      : "Connect your TikTok account to publish stories and track performance across platforms."}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  stats.tiktokConnected 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {stats.tiktokConnected ? "Connected" : "Not Connected"}
                </div>
                <Link
                  to="/tiktok-lab"
                  className="rounded-full bg-[#0a2225] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0a2225]/90 transition-colors"
                >
                  {stats.tiktokConnected ? "Manage" : "Connect"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Recent Stories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-secondary text-2xl text-[#0a2225]">
                Recent Stories
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Your latest trip stories from Creator Lab
              </p>
            </div>
            <Link
              to="/tiktok-lab"
              className="inline-flex items-center gap-2 rounded-full border border-[#C7A962] bg-[#C7A962]/10 px-5 py-2.5 text-sm font-medium text-[#0a2225] hover:bg-[#C7A962]/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Story
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <LuxuryEmptyState message="Loading your stories..." />
            ) : stats.recentStories.length === 0 ? (
              <LuxuryEmptyState 
                message="No stories yet"
                subtext="Start creating travel stories in Creator Lab to see them here."
                action={
                  <Link
                    to="/tiktok-lab"
                    className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0a2225]/90 transition-colors mt-4"
                  >
                    Create Your First Story
                  </Link>
                }
              />
            ) : (
              stats.recentStories.map((story) => (
                <div
                  key={story.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-white border border-[#E5DFC6] p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#0a2225] truncate">
                      {story.title}
                    </h3>
                    <p className="text-sm text-[#6B7280] mt-0.5">
                      {new Date(story.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        story.postedToTikTok
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-[#F6F0E4] text-[#6B7280]"
                      }`}
                    >
                      {story.postedToTikTok ? "Published" : "Draft"}
                    </span>
                    {story.tiktokVideoId && (
                      <a
                        href={`https://www.tiktok.com/@goldsainte/video/${story.tiktokVideoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-[#C7A962] hover:text-[#B39952] transition-colors"
                      >
                        View <ExternalLink className="w-3.5 h-3.5" />
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

function LuxuryStatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-[#E5DFC6] p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#F6F0E4] flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="font-secondary text-3xl text-[#0a2225]">
        {value}
      </div>
      <p className="text-sm text-[#6B7280] mt-2">{helper}</p>
    </div>
  );
}

function LuxuryEmptyState({ 
  message, 
  subtext, 
  action 
}: { 
  message: string; 
  subtext?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-[#E5DFC6] p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[#F6F0E4] flex items-center justify-center mx-auto mb-4">
        <Video className="w-7 h-7 text-[#C7A962]" />
      </div>
      <h3 className="font-secondary text-xl text-[#0a2225]">{message}</h3>
      {subtext && (
        <p className="text-sm text-[#6B7280] mt-2 max-w-sm mx-auto">{subtext}</p>
      )}
      {action}
    </div>
  );
}
