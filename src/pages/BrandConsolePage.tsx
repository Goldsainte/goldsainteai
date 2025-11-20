import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface BrandConsoleProfile {
  profile_id: string;
  name: string;
  avatar_url?: string | null;
  categories?: string[] | null;
  regions?: string[] | null;
  content_style_tags?: string[] | null;
}

export default function BrandConsolePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrandConsoleProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Placeholder metrics
  const [metrics, setMetrics] = useState({
    discoveries: 0,
    profileViews: 0,
    savesToMoodboards: 0,
    tripInquiries: 0,
  });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("brand_profiles_discovery")
        .select(
          "profile_id, name, avatar_url, categories, regions, tags"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile({
          profile_id: data.profile_id,
          name: data.name,
          avatar_url: data.avatar_url,
          categories: data.categories,
          regions: data.regions,
          content_style_tags: data.tags,
        });
      } else {
        setProfile(null);
      }

      // TODO: replace with real metrics table
      setMetrics({
        discoveries: 132,
        profileViews: 58,
        savesToMoodboards: 27,
        tripInquiries: 6,
      });

      setLoading(false);
    };

    void load();
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-[#4a4a4a]">
          Sign in to access your brand console.
        </p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Brand Console · Goldsainte</title>
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-[#F5F0E0]">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#0a2225]">
                  {profile?.name ? profile.name.slice(0, 2).toUpperCase() : "GS"}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display text-xl text-[#0a2225]">
                {profile?.name ?? "Your Brand"}
              </h1>
              <p className="text-xs text-[#7A7151]">
                Brand Console · Goldsainte Discovery
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.open("/marketplace?tab=brands", "_blank")}
            className="rounded-full bg-[#0a2225] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#E5DFC6]"
          >
            View as traveler
          </button>
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-[#F5F0E0]" />
            ))}
          </div>
        ) : (
          <>
            {/* Metrics */}
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard
                label="Discoveries"
                value={metrics.discoveries}
                helper="Times you appeared in AI & search results."
              />
              <MetricCard
                label="Profile Views"
                value={metrics.profileViews}
                helper="Travelers who opened your brand profile."
              />
              <MetricCard
                label="Moodboard Saves"
                value={metrics.savesToMoodboards}
                helper="Saves of your brand into traveler moodboards."
              />
              <MetricCard
                label="Trip Inquiries"
                value={metrics.tripInquiries}
                helper="Travelers who started a trip conversation."
              />
            </section>

            {/* Positioning summary */}
            {profile && (
              <section className="space-y-3 rounded-2xl border border-[#E5DFC6] bg-white px-4 py-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                  How Goldsainte AI sees your brand
                </h2>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {(profile.categories ?? []).map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-[#E5DFC6] px-3 py-1 uppercase tracking-wide text-[#7A7151]"
                    >
                      {c}
                    </span>
                  ))}
                  {(profile.regions ?? []).map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-[#F5F0E0] px-3 py-1 text-[#4a4a4a]"
                    >
                      {r}
                    </span>
                  ))}
                  {(profile.content_style_tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-dashed border-[#E5DFC6] px-3 py-1 text-[#4a4a4a]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[#4a4a4a]">
                  Adjust this by updating your brand profile and tags in the
                  onboarding wizard. The closer this matches your real-world
                  positioning, the better AI can match you with the right
                  travelers.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  helper?: string;
}

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-[#7A7151]">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-[#0a2225]">
        {value}
      </p>
      {helper && (
        <p className="mt-1 text-[11px] text-[#8C8470]">
          {helper}
        </p>
      )}
    </div>
  );
}
