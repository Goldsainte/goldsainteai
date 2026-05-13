import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BadgeCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "@/pages/NotFound";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LiveTripCard } from "@/components/marketplace/LiveTripCard";
import { ItineraryGuideCard } from "@/components/marketplace/ItineraryGuideCard";
import { BundleCard } from "@/components/marketplace/BundleCard";
import { ShareButton } from "@/components/ShareButton";

interface ProfileRow {
  id: string;
  username: string | null;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  bio: string | null;
  is_verified: boolean | null;
  followers_count: number | null;
  account_type: string | null;
  role: string | null;
}

export default function ShopPage() {
  const { username } = useParams();
  const handle = (username || "").replace(/^@/, "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);

  useEffect(() => {
    if (!handle) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: prof } = await supabase
        .from("profiles")
        .select(
          "id, username, full_name, display_name, avatar_url, cover_image_url, bio, is_verified, followers_count, account_type, role"
        )
        .eq("username", handle)
        .maybeSingle();
      if (cancel) return;
      if (!prof) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(prof as ProfileRow);
      const [tripsRes, guidesRes, bundlesRes] = await Promise.all([
        supabase
          .from("packaged_trips")
          .select("*")
          .eq("creator_id", prof.id)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
        supabase
          .from("itinerary_products")
          .select("*")
          .eq("creator_id", prof.id)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
        supabase
          .from("product_bundles")
          .select("*")
          .eq("creator_id", prof.id)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
      ]);
      if (cancel) return;
      setTrips(tripsRes.data || []);
      setGuides(
        (guidesRes.data || []).map((g: any) => ({
          ...g,
          creator: {
            id: prof.id,
            full_name: prof.full_name,
            avatar_url: prof.avatar_url,
            username: prof.username,
          },
        }))
      );
      setBundles(
        (bundlesRes.data || []).map((b: any) => ({
          ...b,
          creator: { full_name: prof.full_name, username: prof.username },
        }))
      );
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [handle]);

  const merged = useMemo(() => {
    const all = [
      ...trips.map((t) => ({ kind: "trip" as const, item: t, ts: t.created_at })),
      ...guides.map((g) => ({ kind: "guide" as const, item: g, ts: g.created_at })),
      ...bundles.map((b) => ({ kind: "bundle" as const, item: b, ts: b.created_at })),
    ];
    return all.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  }, [trips, guides, bundles]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-[#6B7280]">
        Loading shop…
      </div>
    );
  }
  if (!profile) return <NotFound />;

  const displayName = profile.full_name || profile.display_name || profile.username || "Creator";
  const shopPath = `/@${profile.username}/shop`;

  return (
    <div className="min-h-screen bg-[#F7F3EA]">
      <Helmet>
        <title>{`${displayName} (@${profile.username}) — Goldsainte`}</title>
        <meta name="description" content={profile.bio?.slice(0, 155) || `Shop trips and guides by ${displayName} on Goldsainte.`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://goldsainte.ai${shopPath}`} />
        <meta property="og:title" content={`${displayName} on Goldsainte`} />
        <meta property="og:description" content={profile.bio || `Trips & guides by ${displayName}`} />
        <meta property="og:image" content={profile.cover_image_url || profile.avatar_url || "https://goldsainte.ai/og-hero-v3.jpg"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${displayName} on Goldsainte`} />
        <meta name="twitter:description" content={profile.bio?.slice(0, 200) || `Trips & guides by ${displayName}`} />
        <meta name="twitter:image" content={profile.cover_image_url || profile.avatar_url || "https://goldsainte.ai/og-hero-v3.jpg"} />
        <link rel="canonical" href={`https://goldsainte.ai${shopPath}`} />
      </Helmet>

      {/* Cover */}
      <div
        className="relative h-[180px] w-full bg-gradient-to-br from-[#0c4d47] via-[#0a2225] to-[#C7A962]/40 md:h-[280px]"
        style={
          profile.cover_image_url
            ? { backgroundImage: `url(${profile.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      />

      <div className="mx-auto max-w-5xl px-4 pb-16">
        {/* Header */}
        <div className="-mt-12 flex flex-col gap-4 md:-mt-16 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-[#F7F3EA] shadow md:h-32 md:w-32">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
              <AvatarFallback className="bg-[#0c4d47] text-2xl text-white">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="pb-2">
              <h1 className="font-secondary text-2xl text-[#0a2225] md:text-3xl flex items-center gap-2">
                {displayName}
                {profile.is_verified && <BadgeCheck className="h-5 w-5 text-[#0c4d47]" />}
              </h1>
              <p className="text-sm text-[#6B7280]">@{profile.username}</p>
              {(profile.followers_count ?? 0) > 0 && (
                <p className="mt-1 flex items-center gap-1 text-xs text-[#6B7280]">
                  <Users className="h-3 w-3" />
                  {profile.followers_count?.toLocaleString()} followers
                </p>
              )}
            </div>
          </div>
          <ShareButton url={shopPath} title={`${displayName} on Goldsainte`} description={profile.bio || undefined} />
        </div>

        {profile.bio && (
          <p className="mt-4 max-w-2xl text-sm text-[#0a2225]/80">{profile.bio}</p>
        )}

        {/* Tabs */}
        <div className="mt-8">
          {merged.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5DFC6] bg-white/60 p-12 text-center">
              <p className="font-secondary text-lg text-[#0a2225]">
                {displayName} hasn’t published anything yet.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="bg-white border border-[#E5DFC6]">
                <TabsTrigger value="all">All Products ({merged.length})</TabsTrigger>
                <TabsTrigger value="trips">Trips ({trips.length})</TabsTrigger>
                <TabsTrigger value="guides">Guides ({guides.length})</TabsTrigger>
                <TabsTrigger value="bundles">Bundles ({bundles.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-6">
                <ProductGrid items={merged} />
              </TabsContent>
              <TabsContent value="trips" className="mt-6">
                <ProductGrid items={merged.filter((m) => m.kind === "trip")} />
              </TabsContent>
              <TabsContent value="guides" className="mt-6">
                <ProductGrid items={merged.filter((m) => m.kind === "guide")} />
              </TabsContent>
              <TabsContent value="bundles" className="mt-6">
                <ProductGrid items={merged.filter((m) => m.kind === "bundle")} />
              </TabsContent>
            </Tabs>
          )}
        </div>

        <p className="mt-12 text-center text-xs text-[#6B7280]">
          <Link to="/" className="hover:text-[#0c4d47]">goldsainte.ai</Link>
        </p>
      </div>
    </div>
  );
}

function ProductGrid({ items }: { items: { kind: "trip" | "guide" | "bundle"; item: any }[] }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-[#6B7280]">Nothing here yet.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ kind, item }) => {
        if (kind === "trip") return <LiveTripCard key={`t-${item.id}`} trip={item} />;
        if (kind === "guide") return <ItineraryGuideCard key={`g-${item.id}`} guide={item} />;
        return <BundleCard key={`b-${item.id}`} bundle={item} />;
      })}
    </div>
  );
}