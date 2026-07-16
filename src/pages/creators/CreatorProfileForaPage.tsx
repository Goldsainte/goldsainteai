import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PartnerProfileFora, { type PartnerReview } from "@/components/partner/PartnerProfileFora";
import { ProfileTripsGrid } from "@/components/profile/ProfileTripsGrid";
import { PartnerMediaGallery } from "@/components/PartnerMediaGallery";
import TravelMap from "@/components/partner/TravelMap";
import { MessageButton } from "@/components/messaging/MessageButton";
import { CreatorMediaGallery } from "@/components/creator/CreatorMediaGallery";

// ============================================================================
// CreatorProfileForaPage (Phase B preview — Jul 16 AM)
// The content-first creator profile on the shared Fora chassis:
// agents read like a magazine, creators play like a feed — same funnel.
// Center band order: creator CONTENT (media feed) → "Trips inspired by this
// creator" → reviews → travel ideas (guides) → photos.
// Preview route: /creators-preview/:id — flips to /creators/:id only after
// the founder's side-by-side eyeball.
// Reads exclusively through public windows (creator_directory,
// public_creator_profiles, public_profiles) so logged-out visitors see it.
// ============================================================================

interface DirRow {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  creator_niches: string[] | null;
  content_style_tags: string[] | null;
  home_base: string | null;
  tiktok_followers: number | null;
  creator_followers: number | null;
  followers_count: number | null;
  creator_avg_views: number | null;
}

interface ExtraRow {
  handle: string | null;
  bio: string | null;
  travel_style: string | null;
  primary_niches: string[] | null;
  primary_regions: string[] | null;
  specialties: string[] | null;
  starting_price_per_night: number | null;
  logo_url: string | null;
  website: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  pinterest_url: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  visited_countries: string[] | null;
  upcoming_trips: { destination: string; timing: string }[] | null;
  open_to_collabs: boolean | null;
  collab_types: string[] | null;
  media_kit_url: string | null;
  ai_summary: string | null;
  languages: string[] | null;
}

export default function CreatorProfileForaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dir, setDir] = useState<DirRow | null>(null);
  const [extra, setExtra] = useState<ExtraRow | null>(null);
  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [dirRes, extraRes] = await Promise.all([
          supabase
            .from("creator_directory" as unknown as "profiles")
            .select("id, display_name, full_name, avatar_url, creator_niches, content_style_tags, home_base, tiktok_followers, creator_followers, followers_count, creator_avg_views")
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("public_creator_profiles" as unknown as "creator_profiles")
            .select(
              "handle, bio, travel_style, primary_niches, primary_regions, specialties, starting_price_per_night, logo_url, website, linkedin_url, facebook_url, pinterest_url, instagram_handle, tiktok_handle, visited_countries, upcoming_trips, open_to_collabs, collab_types, media_kit_url, ai_summary, languages"
            )
            .eq("user_id", id)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        setDir((dirRes.data as unknown as DirRow) ?? null);
        setExtra((extraRes.data as unknown as ExtraRow) ?? null);

        const { data: reviewRows, count } = await supabase
          .from("reviews")
          .select("id, comment, rating, created_at, reviewer_id, booking_id", { count: "exact" })
          .eq("reviewee_id", id)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(30);
        const rows = reviewRows ?? [];
        setReviewCount(count ?? rows.length);
        const reviewerIds = [...new Set(rows.map((r) => r.reviewer_id).filter(Boolean))];
        const { data: reviewers } = reviewerIds.length
          ? await supabase
              .from("public_profiles" as unknown as "profiles")
              .select("id, display_name, full_name")
              .in("id", reviewerIds)
          : { data: [] as any[] };
        if (cancelled) return;
        const byId = new Map(((reviewers as any[]) ?? []).map((p) => [p.id, p]));
        setReviews(
          rows.map((r) => {
            const rp = byId.get(r.reviewer_id);
            const fullish = rp?.display_name || rp?.full_name || "Guest";
            const parts = String(fullish).trim().split(/\s+/);
            const first = parts[0] || "Guest";
            const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
            return {
              id: r.id,
              reviewerName: `${first}${lastInitial}`,
              destination: null,
              rating: Number(r.rating) || 5,
              createdAt: r.created_at ?? new Date().toISOString(),
              comment: r.comment,
            };
          })
        );
      } catch (e) {
        console.error("creator profile load failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#FDF9F0]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C7A962]" />
      </div>
    );
  }

  if (!dir) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FDF9F0] px-4 text-center">
        <h1 className="font-secondary text-4xl text-[#0a2225]">Creator not found</h1>
        <button type="button" onClick={() => navigate("/creators")}
          className="mt-8 rounded-full bg-[#0c4d47] px-8 py-3.5 text-[14px] text-[#f7f3ea] hover:bg-[#0a2225]">
          Browse creators
        </button>
      </div>
    );
  }

  const displayName = dir.display_name || dir.full_name || "Goldsainte Creator";
  const compact = (n: number) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
    : n >= 1_000 ? (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
    : String(n);
  const followers = dir.tiktok_followers ?? dir.creator_followers ?? dir.followers_count;
  const visitedCountries = extra?.visited_countries ?? [];
  const stats = [
    visitedCountries.length > 0 ? { label: "Countries", value: String(visitedCountries.length) } : null,
    followers != null && followers > 0 ? { label: "Followers", value: compact(followers) } : null,
    dir.creator_avg_views != null && dir.creator_avg_views > 0
      ? { label: "Avg views", value: compact(dir.creator_avg_views) }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];
  const firstName = displayName.split(" ")[0];
  const askUsAbout = [
    ...new Set([
      ...(extra?.primary_niches ?? dir.creator_niches ?? []),
      ...(extra?.primary_regions ?? []),
      ...(extra?.specialties ?? dir.content_style_tags ?? []),
    ]),
  ];

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <Helmet>
        <title>{displayName + " · Goldsainte Creator"}</title>
        <meta name="description" content={"Turn " + displayName + "'s journeys into your next trip — booked securely through Goldsainte."} />
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/creators"))}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-[#0a2225]/70 transition-colors hover:text-[#0a2225]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <PartnerProfileFora
        kind="creator"
        userId={dir.id}
        name={displayName}
        avatarUrl={dir.avatar_url}
        logoUrl={extra?.logo_url}
        businessName={extra?.handle ? "@" + extra.handle.replace(/^@/, "") : null}
        tierLabel="Goldsainte Creator"
        location={dir.home_base}
        languages={extra?.languages}
        startingPricePerNight={extra?.starting_price_per_night}
        askUsAbout={askUsAbout}
        story={extra?.bio}
        travelStyle={extra?.travel_style}
        photos={[]}
        social={{
          tiktok: extra?.tiktok_handle,
          instagram: extra?.instagram_handle,
          linkedin: extra?.linkedin_url,
          facebook: extra?.facebook_url,
          pinterest: extra?.pinterest_url,
          website: extra?.website,
        }}
        reviews={reviews}
        reviewCount={reviewCount}
        ctaLabel={"Design my trip with " + firstName}
        onCta={() =>
          navigate("/post-trip?fromCreator=" + dir.id)
        }
        stats={stats}
        belowCta={
          user && user.id !== dir.id ? (
            <MessageButton
              recipientId={dir.id}
              recipientName={displayName}
              variant="outline"
              className="w-full rounded-full border-[#0a2225]/25 py-6 text-[15px]"
              label={"Message " + firstName}
            />
          ) : undefined
        }
        ownerActions={
          user?.id === dir.id
            ? [
                { label: "Edit public profile", onClick: () => navigate("/creator-settings") },
                { label: "Travel guides", onClick: () => navigate("/creator-guides") },
              ]
            : undefined
        }
        contentSlot={
          <>
            {extra?.ai_summary && (
              <section className="mt-12 rounded-3xl bg-[#0c4d47]/[0.06] p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8D6B2F]">
                  Goldsainte AI on {firstName}
                </p>
                <p className="mt-3 font-secondary italic text-[18px] leading-relaxed text-[#0a2225]">
                  {extra.ai_summary}
                </p>
              </section>
            )}
            {visitedCountries.length > 0 && (
              <section className="mt-14">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-secondary text-3xl text-[#0a2225]">Where I've been</h2>
                  <p className="font-secondary text-xl text-[#8D6B2F]">
                    {visitedCountries.length} {visitedCountries.length === 1 ? "country" : "countries"}
                  </p>
                </div>
                <div className="mt-6 rounded-3xl bg-white/60 p-4">
                  <TravelMap visited={visitedCountries} />
                </div>
              </section>
            )}
            <section className="mt-14">
              <h2 className="mb-6 font-secondary text-3xl text-[#0a2225]">Content</h2>
              <CreatorMediaGallery
                creatorId={dir.id}
                fallbackPhotos={null}
                instagramHandle={extra?.instagram_handle ?? null}
                isOwnProfile={user?.id === dir.id}
              />
              <div className="mt-8">
                <PartnerMediaGallery userId={dir.id} />
              </div>
            </section>
            <section className="mt-14">
              <ProfileTripsGrid creatorId={dir.id} creatorType="creator" title="Trips inspired by this creator" />
            </section>
            {(extra?.upcoming_trips ?? []).length > 0 && (
              <section className="mt-14">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8D6B2F]">
                  Travel with {firstName}
                </p>
                <h2 className="mt-2 font-secondary text-3xl text-[#0a2225]">Upcoming trips</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-[#0a2225]/75">
                  Trips {firstName} is planning to film and lead. Request a spot — {firstName} designs
                  the itinerary with you, and everything is booked securely through Goldsainte.
                </p>
                <div className="mt-6 space-y-3">
                  {(extra!.upcoming_trips as { destination: string; timing: string }[]).map((t, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F5F0E0]/70 px-6 py-4">
                      <div>
                        <p className="font-secondary text-xl text-[#0a2225]">{t.destination}</p>
                        {t.timing && <p className="text-[13px] uppercase tracking-[0.12em] text-[#0a2225]/60">{t.timing}</p>}
                      </div>
                      <button type="button"
                        onClick={() =>
                          navigate("/post-trip?fromCreator=" + dir.id + "&destination=" + encodeURIComponent(t.destination))
                        }
                        className="rounded-full border border-[#0a2225]/30 px-6 py-2.5 text-[14px] font-medium text-[#0a2225] hover:bg-white">
                        Request to join
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {extra?.open_to_collabs && (
              <section className="mt-14 rounded-3xl bg-[#F0EADA]/80 p-8">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8D6B2F]">
                  For brands & partners
                </p>
                <h2 className="mt-2 font-secondary text-3xl text-[#0a2225]">Work with {firstName}</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-[#0a2225]/80">
                  {firstName} is open to paid brand collaborations — the formats below. Download the
                  media kit for audience details and rates.
                </p>
                {(extra.collab_types ?? []).length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(extra.collab_types as string[]).map((t) => (
                      <span key={t} className="rounded-full bg-white px-4 py-1.5 text-[13px] text-[#0a2225]">{t}</span>
                    ))}
                  </div>
                )}
                {extra.media_kit_url && (
                  <a href={extra.media_kit_url} target="_blank" rel="noopener noreferrer"
                    className="mt-6 inline-block rounded-full bg-[#0a2225] px-7 py-3.5 text-[13px] font-medium uppercase tracking-[0.14em] text-[#f7f3ea] hover:bg-[#0c4d47]">
                    Download media kit
                  </a>
                )}
              </section>
            )}
          </>
        }
        hideBottomGallery
      />
    </div>
  );
}
