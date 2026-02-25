import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Image as ImageIcon, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/BackButton";
import { TravelStoryboard } from "@/components/storyboards/TravelStoryboard";
import { StoryboardExplainerCard } from "@/components/storyboards/StoryboardExplainerCard";

type Storyboard = {
  id: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  cover_image_url: string | null;
  is_public: boolean | null;
  created_at: string;
  item_count?: number;
};

type AccountType = "traveler" | "creator" | "agent" | "brand" | null;

export default function TikTokLabStoryboardsPage() {
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<AccountType>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .single();

      if (!cancelled && profile) {
        setAccountType(profile.account_type as AccountType);
      }

      // Fetch storyboards with cover image
      const { data, error } = await supabase
        .from("storyboards")
        .select("id, title, description, tags, cover_image_url, is_public, created_at, storyboard_items(count)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        if (error) {
          console.error("Error loading storyboards:", error);
          setStoryboards([]);
        } else {
          const mapped = (data || []).map((s: any) => ({
            ...s,
            item_count: s.storyboard_items?.[0]?.count ?? 0,
            storyboard_items: undefined,
          }));
          // Enrich storyboards without cover images with first item image
          const enriched = await Promise.all(
            mapped.map(async (sb) => {
              if (sb.cover_image_url) return sb;
              const { data: firstItem } = await supabase
                .from("storyboard_items")
                .select("image_url")
                .eq("storyboard_id", sb.id)
                .not("image_url", "is", null)
                .order("position", { ascending: true })
                .limit(1)
                .maybeSingle();
              return { ...sb, cover_image_url: firstItem?.image_url || null };
            })
          );
          setStoryboards(enriched);
        }
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const isCreatorOrAgent = accountType === "creator" || accountType === "agent";

  const backLabel = isCreatorOrAgent ? "Back to Creator Studio" : "Back to Dashboard";
  const backTo = isCreatorOrAgent ? "/tiktok-lab" : "/dashboard";

  const subtitle = "Think Pinterest — but for planning a trip. Save hotels, destinations, restaurants, videos, and experiences into one visual board. When you're ready, submit your storyboard to the marketplace and let creators or certified agents turn your ideas into a fully designed trip.";

  return (
    <>
      <Helmet>
        <title>My Storyboards · Goldsainte</title>
        <meta name="description" content="Collect and visualize travel inspiration on your personal mood board before posting a trip." />
      </Helmet>

      <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12 space-y-6">
          <BackButton label={backLabel} to={backTo} />

          {/* Editorial header */}
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1.5">
              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-[#BFAD72]">
                Your Travel Planning Board
              </span>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                My Storyboards
              </h1>
              <p className="max-w-xl text-xs leading-relaxed text-[#4a4a4a] md:text-sm">
                {subtitle}
              </p>
            </div>
            {!loading && storyboards.length > 0 && (
              <Button
                asChild
                className="rounded-full bg-[#0c4d47] text-[#E5DFC6] text-xs font-semibold hover:bg-[#073331] shrink-0"
              >
                <Link to="/storyboards/new">
                  <Plus className="h-3 w-3 mr-1" />
                  New storyboard
                </Link>
              </Button>
            )}
          </header>

          {/* Explainer card */}
          <StoryboardExplainerCard />

          {/* Storyboard grid / empty / loading */}
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2.5">
                  <div className="aspect-[4/3] rounded-xl md:rounded-2xl bg-white/90 animate-pulse" />
                  <div className="space-y-1.5 px-0.5">
                    <div className="h-4 w-3/4 rounded bg-white/90 animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-white/90 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : storyboards.length === 0 ? (
            <StoryboardsEmptyState />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {storyboards.map((sb) => (
                <StoryboardCard key={sb.id} storyboard={sb} />
              ))}
            </div>
          )}

          {/* Browse Inspiration */}
          <div className="pt-8 border-t border-[#E5DFC6]">
            <div className="mb-4">
              <h2 className="text-sm font-semibold tracking-tight md:text-base">
                Browse Inspiration
              </h2>
              <p className="text-xs text-[#4a4a4a] md:text-sm">
                Save any image to your storyboard. When you're ready, convert your favorite board into a trip request.
              </p>
            </div>
            <TravelStoryboard title="" subtitle="" maxItems={50} showSaveButtons={true} />
          </div>
        </div>
      </main>
    </>
  );
}

/* ── Card ─────────────────────────────────────────── */

function StoryboardCard({ storyboard }: { storyboard: Storyboard }) {
  const navigate = useNavigate();
  return (
    <Link
      to={`/storyboards/${storyboard.id}`}
      className="group cursor-pointer space-y-2.5"
    >
      {/* Clean image — Airbnb style */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl">
        {storyboard.cover_image_url ? (
          <img
            src={storyboard.cover_image_url}
            alt={storyboard.title || "Storyboard"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-[#F0EBE0] flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-[#C7A962]/30" />
          </div>
        )}

        {/* Item count badge */}
        {typeof storyboard.item_count === "number" && storyboard.item_count > 0 && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
            {storyboard.item_count} item{storyboard.item_count !== 1 ? "s" : ""}
          </span>
        )}

        {/* Convert to Trip hover CTA */}
        <div
          className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-[#0c4d47] text-[#E5DFC6] text-xs font-semibold text-center py-2.5 flex items-center justify-center gap-1 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/post-trip?fromStoryboard=${storyboard.id}`);
          }}
        >
          Convert to Trip
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>

      {/* Metadata below image */}
      <div className="space-y-1 px-0.5">
        <h3 className="font-secondary text-sm md:text-[15px] text-[#0a2225] font-medium leading-snug line-clamp-1">
          {storyboard.title || "Untitled storyboard"}
        </h3>
        {storyboard.description && (
          <p className="text-[13px] text-[#6B7280] line-clamp-1">{storyboard.description}</p>
        )}
        {storyboard.tags && storyboard.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {storyboard.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-full border border-[#E5DFC6] bg-[#FDF9F0]/50 px-1.5 py-0 text-[9px] text-[#6B7280]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ── Empty State ──────────────────────────────────── */

function StoryboardsEmptyState() {
  return (
    <div className="rounded-3xl bg-white/90 border border-[#E5DFC6] p-10 text-center space-y-4">
      <Sparkles className="h-10 w-10 mx-auto text-[#BFAD72]" />
      <h2 className="text-lg font-semibold">Start your travel vision board</h2>
      <p className="text-sm text-[#4a4a4a] max-w-md mx-auto">
        Save photos of destinations, hotels, experiences, and aesthetics that excite you. When you're ready to travel, turn any storyboard into a trip request.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          asChild
          className="rounded-full bg-[#0c4d47] text-[#E5DFC6] text-xs font-semibold hover:bg-[#073331]"
        >
          <Link to="/storyboards/new">
            <Plus className="h-3 w-3 mr-1" />
            Create a Storyboard
          </Link>
        </Button>
        <Button
          variant="outline"
          className="rounded-full text-xs font-semibold border-[#E5DFC6] hover:border-[#BFAD72]"
          onClick={() => {
            document.getElementById("browse-inspiration")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Browse Inspiration
        </Button>
      </div>
    </div>
  );
}
