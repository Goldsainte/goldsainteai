import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PartnerProfileFora, { type PartnerReview } from "@/components/partner/PartnerProfileFora";
import { MessageButton } from "@/components/messaging/MessageButton";
import { CreatorServicesSection } from "@/components/creator/CreatorServicesSection";

// ============================================================================
// AgentPublicProfilePage v2 (Jul 15) — 1:1 Fora advisor-page structure via the
// shared PartnerProfileFora component (creators reuse it with kind="creator").
// This page is now a pure data loader: profiles + travel_agents by USER id,
// public reviews joined to their bookings for the "travel to {destination}"
// line. The Design-My-Trip flow (agent preselected) is the contact CTA.
// ============================================================================

interface ProfileRow {
  id: string;
  full_name: string | null;
  display_name?: string | null;
  avatar_url: string | null;
  bio: string | null;
  agent_verification_status: string | null;
  instagram_handle: string | null;
  location: string | null;
  featured_photos: string[] | null;
}

interface AgentRow {
  agency_name: string | null;
  bio: string | null;
  specializations: string[] | null;
  destinations: string[] | null;
  website: string | null;
  travel_style?: string | null;
  starting_price_per_night?: number | null;
  logo_url?: string | null;
  linkedin_url?: string | null;
  facebook_url?: string | null;
  pinterest_url?: string | null;
  languages?: string[] | null;
}

export default function AgentPublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [agent, setAgent] = useState<AgentRow | null>(null);
  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [profileRes, agentRes] = await Promise.all([
          supabase
            .from("public_profiles" as unknown as "profiles")
            .select(
              "id, full_name, display_name, avatar_url, bio, agent_verification_status, instagram_handle, location, featured_photos"
            )
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("public_travel_agents" as unknown as "travel_agents")
            .select(
              "agency_name, bio, specializations, destinations, website, travel_style, starting_price_per_night, logo_url, linkedin_url, facebook_url, pinterest_url, languages"
            )
            .eq("user_id", id)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        setProfile((profileRes.data as ProfileRow) ?? null);
        setAgent((agentRes.data as AgentRow) ?? null);

        // Reviews + "travel to {destination}" (joined through the booking)
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
        const bookingIds = [...new Set(rows.map((r) => r.booking_id).filter(Boolean))];
        const [reviewersRes, bookingsRes] = await Promise.all([
          reviewerIds.length
            ? supabase.from("public_profiles" as unknown as "profiles").select("id, display_name, full_name").in("id", reviewerIds)
            : Promise.resolve({ data: [] } as any),
          bookingIds.length
            ? supabase.from("trip_bookings").select("id, metadata").in("id", bookingIds)
            : Promise.resolve({ data: [] } as any),
        ]);
        if (cancelled) return;
        const reviewerById = new Map(((reviewersRes.data as any[]) ?? []).map((p) => [p.id, p]));
        const bookingById = new Map(((bookingsRes.data as any[]) ?? []).map((b) => [b.id, b]));

        setReviews(
          rows.map((r) => {
            const rp = reviewerById.get(r.reviewer_id);
            const fullish = rp?.display_name || rp?.full_name || "Guest";
            const parts = String(fullish).trim().split(/\s+/);
            const first = parts[0] || "Guest";
            const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
            const meta = (bookingById.get(r.booking_id)?.metadata ?? {}) as Record<string, unknown>;
            const destination =
              (meta.destination as string) || (meta.trip_title as string) || null;
            return {
              id: r.id,
              reviewerName: `${first}${lastInitial}`,
              destination,
              rating: Number(r.rating) || 5,
              createdAt: r.created_at ?? new Date().toISOString(),
              comment: r.comment,
            };
          })
        );
      } catch (e) {
        console.error("agent profile load failed", e);
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

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FDF9F0] px-4 text-center">
        <h1 className="font-secondary text-4xl text-[#0a2225]">Agent not found</h1>
        <p className="mt-3 max-w-md text-[#0a2225]/70">
          We couldn't find this agent. They may have been removed or haven't completed onboarding.
        </p>
        <button
          type="button"
          onClick={() => navigate("/agents")}
          className="mt-8 rounded-full bg-[#0c4d47] px-8 py-3.5 text-[14px] text-[#f7f3ea] transition-colors hover:bg-[#0a2225]"
        >
          Browse agents
        </button>
      </div>
    );
  }

  const displayName = profile.display_name || profile.full_name || "Goldsainte Specialist";
  const firstName = displayName.split(" ")[0];
  const askUsAbout = [
    ...new Set([...(agent?.destinations ?? []), ...(agent?.specializations ?? [])]),
  ];

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <Helmet>
        <title>{displayName + " · Goldsainte Travel Specialist"}</title>
        <meta
          name="description"
          content={"Design your dream trip with " + displayName + ". Verified, secure, booked through Goldsainte."}
        />
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 pt-6">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/agents"))}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-[#0a2225]/70 transition-colors hover:text-[#0a2225]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <PartnerProfileFora
        kind="agent"
        userId={profile.id}
        name={displayName}
        avatarUrl={profile.avatar_url}
        logoUrl={agent?.logo_url}
        businessName={agent?.agency_name}
        tierLabel={profile.agent_verification_status === "verified" ? "Goldsainte Verified" : null}
        location={profile.location}
        languages={agent?.languages}
        startingPricePerNight={agent?.starting_price_per_night}
        askUsAbout={askUsAbout}
        story={agent?.bio || profile.bio}
        travelStyle={agent?.travel_style}
        photos={profile.featured_photos ?? []}
        social={{
          instagram: profile.instagram_handle,
          linkedin: agent?.linkedin_url,
          facebook: agent?.facebook_url,
          pinterest: agent?.pinterest_url,
          website: agent?.website,
        }}
        reviews={reviews}
        reviewCount={reviewCount}
        ctaLabel={"Contact " + (agent?.agency_name || firstName)}
        onCta={() =>
          navigate("/post-trip?agentId=" + profile.id + "&agentName=" + encodeURIComponent(displayName))
        }
        belowCta={
          // Visible to everyone except the owner; MessageButton self-hides for
          // self and routes signed-out visitors to /auth on tap.
          <MessageButton
            recipientId={profile.id}
            recipientName={displayName}
            variant="outline"
            className="w-full rounded-full border-[#0a2225]/25 py-6 text-[15px]"
            label={"Message " + firstName}
          />
        }
        ownerActions={
          user?.id === profile.id
            ? [
                { label: "Edit public profile", onClick: () => navigate("/agent-settings") },
                { label: "Travel guides", onClick: () => navigate("/agent-guides") },
              ]
            : undefined
        }
        contentSlot={
          /* Services + on-trip hire — shared with creator profiles. Renders
             nothing publicly until the specialist lists a service. */
          <section className="mt-14">
            <CreatorServicesSection
              creatorId={profile.id}
              isOwnProfile={user?.id === profile.id}
              requestBaseParams={
                agent
                  ? "agentId=" + agent.id + "&agentName=" + encodeURIComponent(displayName)
                  : "agentId=" + profile.id
              }
            />
          </section>
        }
      />
    </div>
  );
}
