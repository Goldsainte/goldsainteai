import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import FollowButton from "@/components/FollowButton";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Users, Heart } from "lucide-react";
import { LiveTripGrid } from "@/components/marketplace/LiveTripGrid";

interface FollowedCreator {
  id: string;
  display_name: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  location: string | null;
  creator_niches: string[] | null;
  is_verified: boolean | null;
}

/* The follow relationship existed (user_follows + FollowButton) but had no
   destination — travelers could follow creators and then never find them
   again. This page closes that loop. */
export default function FollowingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [creators, setCreators] = useState<FollowedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"saved" | "following">("saved");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      // Step 1: who do I follow?
      const { data: follows, error } = await supabase
        .from("user_follows")
        .select("following_id, created_at")
        .eq("follower_id", user.id)
        .order("created_at", { ascending: false });
      if (error || !follows?.length) {
        setCreators([]);
        setLoading(false);
        return;
      }
      // Step 2: hydrate through the public window (profiles is RLS-locked;
      // creator_directory is the readable view). Non-creator follows simply
      // won't hydrate and are omitted.
      const ids = follows.map((f) => f.following_id);
      const { data: rows } = await supabase
        .from("creator_directory" as unknown as "profiles")
        .select("id, display_name, full_name, username, avatar_url, location, creator_niches, is_verified")
        .in("id", ids);
      const byId = new Map((rows || []).map((r: any) => [r.id, r]));
      setCreators(ids.map((i) => byId.get(i)).filter(Boolean) as FollowedCreator[]);
      setLoading(false);
    })();

    // Saved trips — the heart writes trip_wishlists; this page is their home.
    (async () => {
      const { data: wishes } = await supabase
        .from("trip_wishlists" as any)
        .select("trip_id")
        .eq("user_id", user.id);
      const tripIds = (wishes || []).map((w: any) => w.trip_id);
      if (tripIds.length === 0) {
        setSavedTrips([]);
        setSavedLoading(false);
        return;
      }
      const { data: trips } = await supabase
        .from("packaged_trips")
        .select(`
          id, slug, title, destination, cover_image_url, price_per_person, currency,
          duration_nights, highlights, creator_type,
          duration_days, max_participants, current_bookings, difficulty_level,
          rating, review_count, available_from, available_until, tags,
          wishlist_count, booking_count, view_count, is_verified, created_at,
          creator:profiles!packaged_trips_creator_id_fkey(id, full_name, avatar_url, home_base, content_style_tags, is_verified)
        `)
        .in("id", tripIds)
        .eq("status", "published");
      setSavedTrips(trips || []);
      setSavedLoading(false);
    })();
  }, [user, authLoading, navigate]);

  return (
    <>
      <Helmet>
        <title>Saved &amp; Following · Goldsainte</title>
      </Helmet>
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          <p
            className="font-sans text-[13px] uppercase tracking-[0.25em] text-[#C7A962]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Your circle
          </p>
          <h1 className="mt-1.5 font-secondary text-3xl font-semibold text-[#0a2225]">
            Saved &amp; Following
          </h1>

          {/* Saved trips and followed creators are the same instinct —
              "keep this close" — so they live on one page. */}
          <div className="mt-6 flex w-fit items-center rounded-full border border-[#E5DFC6] bg-white p-1" style={{ fontFamily: "Inter, sans-serif" }}>
            <button
              role="tab"
              aria-selected={activeTab === "saved"}
              onClick={() => setActiveTab("saved")}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] transition-colors ${
                activeTab === "saved" ? "bg-[#0c4d47] font-semibold text-white" : "text-[#6B7280] hover:text-[#0a2225]"
              }`}
            >
              Saved trips{!savedLoading && <span className={activeTab === "saved" ? " text-white/70" : " text-[#9CA3AF]"}> · {savedTrips.length}</span>}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "following"}
              onClick={() => setActiveTab("following")}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] transition-colors ${
                activeTab === "following" ? "bg-[#0c4d47] font-semibold text-white" : "text-[#6B7280] hover:text-[#0a2225]"
              }`}
            >
              Following{!loading && <span className={activeTab === "following" ? " text-white/70" : " text-[#9CA3AF]"}> · {creators.length}</span>}
            </button>
          </div>

          {activeTab === "saved" && (
            savedLoading ? (
              <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl" />
                ))}
              </div>
            ) : savedTrips.length === 0 ? (
              <div className="mt-12 rounded-2xl border border-[#E5DFC6] bg-white px-6 py-14 text-center">
                <Heart className="mx-auto h-8 w-8 text-[#C7A962]" />
                <h2 className="mt-4 font-secondary text-xl text-[#0a2225]">No saved trips yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-[#6B7280]">
                  Tap the heart on any trip to keep it here for later.
                </p>
                <button
                  onClick={() => navigate("/marketplace")}
                  className="mt-6 rounded-full bg-[#0c4d47] px-7 py-3 text-sm font-medium text-white hover:bg-[#0a3d39]"
                >
                  Browse trips
                </button>
              </div>
            ) : (
              <div className="mt-8">
                <LiveTripGrid trips={savedTrips as any} />
              </div>
            )
          )}

          {activeTab === "following" && (<>

          {loading ? (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : creators.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-[#E5DFC6] bg-white px-6 py-14 text-center">
              <Users className="mx-auto h-8 w-8 text-[#C7A962]" />
              <h2 className="mt-4 font-secondary text-xl text-[#0a2225]">
                You're not following anyone yet
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[#6B7280]">
                Follow creators to keep their profiles one tap away — new guides
                and trips from your circle are the fastest way to plan.
              </p>
              <button
                onClick={() => navigate("/creators")}
                className="mt-6 rounded-full bg-[#0c4d47] px-7 py-3 text-sm font-medium text-white hover:bg-[#0a3d39]"
              >
                Browse creators
              </button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((c) => {
                const name = c.display_name || c.full_name || "Creator";
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-4 rounded-2xl border border-[#E5DFC6] bg-white p-4 transition hover:border-[#C7A962]/60 hover:shadow-sm"
                  >
                    <button
                      onClick={() => navigate(`/creators/${c.username || c.id}`)}
                      className="flex min-w-0 flex-1 items-center gap-4 text-left"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#F6F0E4]">
                        {c.avatar_url ? (
                          <img src={c.avatar_url} alt={name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-secondary text-xl text-[#C7A962]">
                            {name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-secondary text-[17px] text-[#0a2225]">
                          {name}
                          {c.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#C7A962]" />}
                        </p>
                        {(c.creator_niches?.[0] || c.location) && (
                          <p className="truncate text-sm capitalize text-[#6B7280]">
                            {c.creator_niches?.[0] || c.location}
                          </p>
                        )}
                      </div>
                    </button>
                    <FollowButton
                      targetUserId={c.id}
                      className="h-9 shrink-0 rounded-full border-[#E5DFC6] px-4 text-xs"
                    />
                  </div>
                );
              })}
            </div>
          )}
          </>)}
        </div>
      </div>
    </>
  );
}
