// src/pages/creators/CreatorPublicProfilePage.tsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SaveToStoryboardButton } from "@/components/storyboards/SaveToStoryboardButton";
import {
  CheckCircle2,
  ArrowRight,
  MapPin,
  PlayCircle,
  Users,
} from "lucide-react";

type CreatorProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  tiktok_handle: string | null;
  instagram_handle: string | null;
  creator_niches: string[] | null;
  creator_avg_views: number | null;
  creator_followers: number | null;
  featured_photos: string[] | null;
};

export default function CreatorPublicProfilePage() {
  const { id } = useParams();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCreator() {
      if (!id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          avatar_url,
          bio,
          location,
          tiktok_handle,
          instagram_handle,
          creator_niches,
          creator_avg_views,
          creator_followers,
          featured_photos
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error loading creator profile", error);
      }

      setCreator(data as CreatorProfile | null);
      setLoading(false);
    }

    loadCreator();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-6 py-10 text-[#0a2225]">
        <p className="text-[12px]">Loading creator…</p>
      </main>
    );
  }

  if (!creator) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-6 py-10 text-[#0a2225]">
        <p className="text-[12px]">Creator not found.</p>
      </main>
    );
  }

  const heroImage =
    creator.featured_photos?.[0] ||
    creator.avatar_url ||
    "/images/default-creator-hero.jpg";

  const formattedFollowers =
    creator.creator_followers && creator.creator_followers > 0
      ? Intl.NumberFormat(undefined, { notation: "compact" }).format(
          creator.creator_followers
        )
      : "—";

  const formattedViews =
    creator.creator_avg_views && creator.creator_avg_views > 0
      ? Intl.NumberFormat(undefined, { notation: "compact" }).format(
          creator.creator_avg_views
        )
      : "—";

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      {/* HERO */}
      <section className="relative h-[340px] w-full overflow-hidden rounded-b-3xl">
        <img
          src={heroImage}
          className="h-full w-full object-cover"
          alt={creator.full_name || "Creator hero"}
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 text-white">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-[28px] md:text-[32px]">
                {creator.full_name || "Goldsainte Creator"}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0c4d47] px-2 py-1 text-[10px] text-[#E5DFC6]">
                <CheckCircle2 className="h-3 w-3" />
                Goldsainte Creator
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              {creator.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {creator.location}
                </span>
              )}
              {creator.tiktok_handle && (
                <a
                  href={`https://www.tiktok.com/@${creator.tiktok_handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  TikTok @{creator.tiktok_handle}
                </a>
              )}
              {creator.instagram_handle && (
                <a
                  href={`https://www.instagram.com/${creator.instagram_handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  Instagram @{creator.instagram_handle}
                </a>
              )}
            </div>
          </div>

          {creator.avatar_url && (
            <img
              src={creator.avatar_url}
              alt={creator.full_name || "Creator avatar"}
              className="h-16 w-16 md:h-20 md:w-20 rounded-full border-2 border-white object-cover"
            />
          )}
        </div>
      </section>

      {/* BODY */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        {/* Top row: bio + stats */}
        <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)] gap-8 mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-2">
              About
            </p>
            <p className="text-[12px] leading-relaxed text-[#4a4a4a]">
              {creator.bio ||
                "This creator hasn't added a full bio yet, but you can explore their storyboard and stats below."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Followers"
              value={formattedFollowers}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="Avg. views"
              value={formattedViews}
              icon={<PlayCircle className="h-4 w-4" />}
            />
            <StatCard
              label="Niches"
              value={
                creator.creator_niches && creator.creator_niches.length > 0
                  ? creator.creator_niches.length
                  : "—"
              }
              icon={<ArrowRight className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Niches */}
        {creator.creator_niches && creator.creator_niches.length > 0 && (
          <div className="mb-10">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-2">
              Niches
            </p>
            <div className="flex flex-wrap gap-2">
              {creator.creator_niches.map((niche) => (
                <span
                  key={niche}
                  className="rounded-full bg-[#E5DFC6] text-[#0a2225] text-[11px] px-3 py-1"
                >
                  {niche}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Storyboard wall */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8D8D8D]">
              Storyboard Preview
            </p>
            <Link
              to={`/tiktok-lab/storyboards?creatorId=${creator.id}`}
              className="inline-flex items-center gap-1 text-[11px] text-[#0c4d47] underline underline-offset-2"
            >
              View full storyboard
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="columns-2 md:columns-3 gap-3 space-y-3">
            {(creator.featured_photos || []).map((src) => (
              <img
                key={src}
                src={src}
                alt="Storyboard"
                className="w-full rounded-2xl object-cover"
              />
            ))}

            {(!creator.featured_photos ||
              creator.featured_photos.length === 0) && (
              <div className="rounded-2xl bg-[#E5DFC6]/60 px-4 py-6 text-[11px] text-[#4a4a4a]">
                This creator hasn&apos;t added storyboard photos yet. Once they
                build trips in Goldsainte Creator Lab, their highlights will appear here.
              </div>
            )}
          </div>
        </div>

        {/* CTA: Partner with creator */}
        <div className="border-t border-[#E5DFC6] pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-1">
              Partner with this creator
            </p>
            <p className="text-[12px] text-[#4a4a4a] max-w-md">
              Travel agents can collaborate with {creator.full_name || "this creator"}{" "}
              to launch co-branded trips on Goldsainte. We handle matching,
              messaging and payouts — you focus on the experience.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SaveToStoryboardButton
              assetType="creator_profile"
              assetData={{
                id: creator.id,
                name: creator.full_name || "Creator",
                avatar_url: creator.avatar_url,
                tags: creator.creator_niches,
              }}
              variant="outline"
              size="sm"
              className="rounded-full"
            />
            <Link
              to={`/tiktok-lab/matches?creatorId=${creator.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-5 py-2 text-[11px] font-semibold hover:bg-[#073331]"
            >
              Find an agent match
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              to={`/post-trip?fromCreator=${creator.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-white text-[#0a2225] border border-[#BFAD72] px-5 py-2 text-[11px] font-semibold hover:bg-[#f7f3ea]"
            >
              Request a trip
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
};

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white/90 border border-[#E5DFC6] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#8D8D8D] uppercase tracking-[0.14em]">
          {label}
        </p>
        <div className="text-[#0c4d47]">{icon}</div>
      </div>
      <div className="font-display text-[20px]">{value}</div>
    </div>
  );
}
