import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PartnerProfileFora, { type PartnerReview } from "@/components/partner/PartnerProfileFora";
import { ProfileTripsGrid } from "@/components/profile/ProfileTripsGrid";
import { PartnerMediaGallery } from "@/components/PartnerMediaGallery";

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
            .select("id, display_name, full_name, avatar_url, creator_niches, content_style_tags, home_base")
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("public_creator_profiles" as unknown as "creator_profiles")
            .select(
              "handle, bio, travel_style, primary_niches, primary_regions, specialties, starting_price_per_night, logo_url, website, linkedin_url, facebook_url, pinterest_url, instagram_handle, tiktok_handle"
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
          navigate("/post-trip?creatorId=" + dir.id + "&creatorName=" + encodeURIComponent(displayName))
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
            <section className="mt-14">
              <h2 className="mb-6 font-secondary text-3xl text-[#0a2225]">Content</h2>
              <PartnerMediaGallery userId={dir.id} />
            </section>
            <section className="mt-14">
              <ProfileTripsGrid creatorId={dir.id} creatorType="creator" title="Trips inspired by this creator" />
            </section>
          </>
        }
        hideBottomGallery
      />
    </div>
  );
}
