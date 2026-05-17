import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileTripsGrid } from "@/components/profile/ProfileTripsGrid";
import { ReviewsList } from "@/components/profile/ReviewsList";
import { WriteReviewModal } from "@/components/profile/WriteReviewModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageButton } from "@/components/messaging/MessageButton";

interface AgentProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  agent_verification_status: string | null;
  tiktok_handle: string | null;
  instagram_handle: string | null;
  location: string | null;
  featured_photos: string[] | null;
  last_active_at?: string | null;
}

interface AgentDetails {
  agency_name: string | null;
  rating: number | null;
  total_reviews: number | null;
  specializations: string[] | null;
  destinations: string[] | null;
  website: string | null;
  experience_years: number | null;
  response_time_hours?: number | null;
  professional_license_verified?: boolean | null;
  insurance_verified?: boolean | null;
}

export default function AgentPublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [details, setDetails] = useState<AgentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  const [completedBookings, setCompletedBookings] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [profileRes, agentRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, avatar_url, bio, agent_verification_status, tiktok_handle, instagram_handle, location, featured_photos"
          )
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("travel_agents")
          .select(
            "agency_name, rating, total_reviews, specializations, destinations, website, experience_years"
          )
          .eq("user_id", id)
          .maybeSingle(),
      ]);
      setAgent(profileRes.data as AgentProfile | null);
      setDetails(agentRes.data as AgentDetails | null);
      const { count } = await supabase
        .from("trip_bookings")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", id)
        .eq("status", "completed");
      setCompletedBookings(count || 0);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="animate-pulse">
          <div className="h-64 md:h-80 bg-[#E5DFC6]" />
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="h-8 w-64 rounded bg-[#E5DFC6]" />
            <div className="mt-4 h-4 w-96 rounded bg-[#E5DFC6]" />
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="font-secondary text-2xl text-[#0a2225]">
            Agent not found
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            We couldn't find this agent. They may have been removed or haven't completed onboarding.
          </p>
          <button
            onClick={() =>
              window.history.length > 1 ? navigate(-1) : navigate("/agents")
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0c4d47] px-5 py-2.5 text-sm text-white hover:bg-[#0a3d39]"
          >
            Browse agents
          </button>
        </div>
      </div>
    );
  }

  const isVerified = agent.agent_verification_status === "verified";
  const allSpecialties = [
    ...(details?.specializations || []),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const socialLinks = [
    agent.tiktok_handle && {
      platform: "TikTok",
      handle: agent.tiktok_handle,
      url: `https://www.tiktok.com/@${agent.tiktok_handle}`,
    },
    agent.instagram_handle && {
      platform: "Instagram",
      handle: agent.instagram_handle,
      url: `https://www.instagram.com/${agent.instagram_handle}`,
    },
  ].filter(Boolean) as { platform: string; handle: string; url: string }[];

  const displayName =
    details?.agency_name || agent.full_name || "Travel Agent";

  return (
    <>
      <Helmet>
        <title>{displayName} · Goldsainte Agents</title>
        <meta
          name="description"
          content={
            agent.bio || `Discover ${displayName} on Goldsainte`
          }
        />
      </Helmet>

      <div className="min-h-screen bg-[#FDF9F0]">
        {/* Back bar */}
        <div className="sticky top-0 z-10 bg-[#FDF9F0]/80 backdrop-blur-sm border-b border-[#E5DFC6]/40">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-[#4a4a4a] hover:text-[#0a2225] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>

        {/* Cover photo */}
        <div className="relative h-48 md:h-64 w-full overflow-hidden bg-gradient-to-br from-[#0c4d47] to-[#0a2225]">
          {agent.featured_photos?.[0] && (
            <img
              src={agent.featured_photos[0]}
              alt=""
              className="w-full h-full object-cover opacity-70"
              loading="lazy"
            />
          )}
        </div>

        {/* Hero */}
        <ProfileHero
          name={displayName}
          avatarUrl={agent.avatar_url}
          isVerified={isVerified}
          bio={agent.bio}
          location={agent.location}
        />

        {/* Two-column layout */}
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Left column */}
            <div className="space-y-8">
              {/* About */}
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                  About {displayName}
                </h2>
                <p className="mt-3 text-[#0a2225] leading-relaxed whitespace-pre-line">
                  {agent.bio ||
                    "This agent hasn't added a bio yet, but their trips speak for themselves."}
                </p>
                {details?.experience_years ? (
                  <p className="text-sm text-[#6B7280] mt-2">
                    <span className="font-medium text-[#0a2225]">{details.experience_years}</span> years experience
                  </p>
                ) : null}
                {completedBookings > 0 && (
                  <p className="text-sm text-[#6B7280] mt-1">
                    <span className="font-medium text-[#0a2225]">{completedBookings}</span> trip{completedBookings === 1 ? "" : "s"} completed on Goldsainte
                  </p>
                )}
              </section>

              {/* Specialties */}
              {allSpecialties.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-3">
                    Specialties
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {allSpecialties.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#C7B892]/20 border border-[#C7B892]/30 px-4 py-1.5 text-sm text-[#0a2225]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Destinations */}
              {details?.destinations && details.destinations.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-3">
                    Destinations
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {details.destinations.map((dest) => (
                      <span
                        key={dest}
                        className="inline-flex items-center gap-1 rounded-full bg-white border border-[#E5DFC6] px-4 py-1.5 text-sm text-[#0a2225]"
                      >
                        {dest}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Gallery */}
              {agent.featured_photos && agent.featured_photos.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
                    Portfolio
                  </h2>
                  <div className="columns-2 md:columns-3 gap-3 space-y-3">
                    {agent.featured_photos.map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt="Portfolio"
                        className="w-full rounded-2xl object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Trips */}
              <ProfileTripsGrid creatorId={agent.id} creatorType="agent" />

              {/* Reviews */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                    Reviews
                  </h2>
                  {user && user.id !== agent.id && (
                    <WriteReviewModal
                      revieweeId={agent.id}
                      revieweeName={displayName}
                      onSuccess={() => setReviewRefreshKey((k) => k + 1)}
                    >
                      <Button variant="outline" size="sm" className="border-[#E5DFC6] text-[#0a2225]">
                        <PenLine className="mr-1.5 h-3.5 w-3.5" />
                        Write a Review
                      </Button>
                    </WriteReviewModal>
                  )}
                </div>
                <ReviewsList revieweeId={agent.id} refreshKey={reviewRefreshKey} />
              </section>
            </div>

            {/* Right column — sticky sidebar */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              {user && user.id !== agent.id && (
                <div className="mb-3">
                  <MessageButton
                    recipientId={agent.id}
                    recipientName={displayName}
                    className="w-full rounded-xl border-[#E5DFC6]"
                    label="Message Agent"
                  />
                </div>
              )}
              <ProfileSidebar
                name={displayName}
                targetUserId={agent.id}
                rating={details?.rating}
                reviewCount={details?.total_reviews}
                responseTimeHours={details?.response_time_hours ?? null}
                lastActiveAt={agent.last_active_at ?? null}
                isVerified={isVerified}
                professionalLicenseVerified={details?.professional_license_verified ?? null}
                insuranceVerified={details?.insurance_verified ?? null}
                onRequestTrip={() =>
                  navigate(`/post-trip?agentId=${agent.id}&agentName=${encodeURIComponent(displayName)}`)
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
