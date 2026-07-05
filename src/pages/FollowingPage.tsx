import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import FollowButton from "@/components/FollowButton";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Users } from "lucide-react";

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
  }, [user, authLoading, navigate]);

  return (
    <>
      <Helmet>
        <title>Following · Goldsainte</title>
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
            Creators you follow
          </h1>

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
        </div>
      </div>
    </>
  );
}
