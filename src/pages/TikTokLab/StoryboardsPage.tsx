import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Image as ImageIcon, Sparkles, ArrowRight, Lightbulb, MapPin, Hotel } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/BackButton";
import { TravelStoryboard } from "@/components/storyboards/TravelStoryboard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  const backLabel = (() => {
    switch (accountType) {
      case "creator":
      case "agent":
        return "Back to Creator Studio";
      case "traveler":
        return "Back to Dashboard";
      default:
        return "Back";
    }
  })();

  const backTo = (() => {
    switch (accountType) {
      case "creator":
        return "/creator-dashboard";
      case "agent":
        return "/agent-dashboard";
      case "traveler":
        return "/traveler";
      default:
        return "/";
    }
  })();

  return (
    <>
      <Helmet>
        <title>My Storyboards · Goldsainte</title>
        <meta name="description" content="Collect and visualize travel inspiration on your personal mood board before posting a trip." />
      </Helmet>

      <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12 space-y-6">
          <BackButton label={backLabel} to={backTo} />

          {/* Header */}
          <header className="space-y-3">
            <div className="space-y-1.5">
              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-[#BFAD72]">
                Your Travel Planning Board
              </span>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                My Storyboards
              </h1>
              <p className="text-sm font-medium text-[#4B5563]">
                Plan visually. Post confidently.
              </p>
              <p className="text-xs text-[#6B7280] max-w-2xl leading-relaxed">
                Save hotels, restaurants, destinations, and experiences into a private board. When you're ready, turn your storyboard into a trip request and receive proposals from trusted creators and travel agents.
              </p>
            </div>

            {/* Subtle explainer link */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-1.5 text-[11px] text-[#8D8D8D] hover:text-[#0a2225] transition-colors">
                  <Lightbulb className="h-3 w-3" />
                  What's the difference between Storyboard &amp; Post a Trip?
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-sm font-semibold">Storyboard vs Post a Trip</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-[#E5DFC6] bg-[#f7f3ea]/60 p-4 space-y-2">
                    <span className="inline-block rounded-full bg-[#BFAD72]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#BFAD72]">
                      Storyboard
                    </span>
                    <p className="text-xs leading-relaxed text-[#4a4a4a]">
                      Your personal mood board. Save images, browse inspiration, and
                      visualize your dream experience.{" "}
                      <span className="font-medium text-[#0a2225]">
                        No commitment, no deadlines. Just vibes.
                      </span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#0c4d47]/20 bg-[#0c4d47]/5 p-4 space-y-2">
                    <span className="inline-block rounded-full bg-[#0c4d47]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0c4d47]">
                      Post a Trip
                    </span>
                    <p className="text-xs leading-relaxed text-[#4a4a4a]">
                      Ready to go? When you post a trip, your storyboard becomes a
                      brief that creators and agents compete to bring to life on the
                      marketplace.
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <Link
                    to="/post-trip"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0c4d47] hover:text-[#073331] transition-colors"
                  >
                    Ready to go? Create &amp; Post Your Trip
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </DialogContent>
            </Dialog>

            {/* Primary CTA — always visible */}
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#0c4d47] text-[#E5DFC6] font-semibold hover:bg-[#073331]"
            >
              <Link to="/storyboards/new">
                <Plus className="h-4 w-4 mr-1.5" />
                Start a Trip Board
              </Link>
            </Button>
          </header>

          {/* Tabs */}
          <Tabs defaultValue="my-storyboards" className="space-y-5">
            <TabsList className="bg-white/80 border border-[#E5DFC6]">
              <TabsTrigger value="my-storyboards" className="text-xs data-[state=active]:text-[#0a2225]">
                My Storyboards
              </TabsTrigger>
              <TabsTrigger value="inspiration" className="text-xs data-[state=active]:text-[#0a2225]">
                Browse Inspiration
              </TabsTrigger>
            </TabsList>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                Your boards are private until you choose to post them.
              </p>

            <TabsContent value="my-storyboards">
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
            </TabsContent>

            <TabsContent value="inspiration">
              <TravelStoryboard title="" subtitle="" maxItems={50} showSaveButtons={true} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}

/* ── Card ─────────────────────────────────────────── */

function StoryboardCard({ storyboard }: { storyboard: Storyboard }) {
  const navigate = useNavigate();
  return (
    <div className="group space-y-2.5">
      <Link
        to={`/storyboards/${storyboard.id}`}
        className="block"
      >
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

          {typeof storyboard.item_count === "number" && storyboard.item_count > 0 && (
            <span className="absolute top-2.5 right-2.5 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
              {storyboard.item_count} item{storyboard.item_count !== 1 ? "s" : ""}
            </span>
          )}

          {/* Draft badge */}
          <span className="absolute top-2.5 left-2.5 rounded-full bg-white/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">
            Draft
          </span>
        </div>
      </Link>

      {/* Metadata below image */}
      <div className="space-y-1 px-0.5">
        <Link to={`/storyboards/${storyboard.id}`}>
          <h3 className="font-secondary text-sm md:text-[15px] text-[#0a2225] font-medium leading-snug line-clamp-1 hover:underline">
            {storyboard.title || "Untitled storyboard"}
          </h3>
        </Link>
        {storyboard.description && (
          <p className="text-[13px] text-[#6B7280] line-clamp-1">{storyboard.description}</p>
        )}
        <p className="text-[11px] text-[#9CA3AF]">
          Edited {formatDistanceToNow(new Date(storyboard.created_at), { addSuffix: true })}
        </p>
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

        {/* Persistent Post to Marketplace link */}
        <button
          onClick={() => navigate(`/post-trip?fromStoryboard=${storyboard.id}`)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c4d47] hover:text-[#073331] transition-colors pt-1"
        >
          Post to Marketplace
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ── Empty State ──────────────────────────────────── */

function StoryboardsEmptyState() {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#f7f3ea] via-white to-[#E5DFC6]/30 border border-[#E5DFC6] p-12 md:p-16 text-center space-y-6">
      <div className="mx-auto flex items-center justify-center gap-3 text-[#BFAD72]">
        <MapPin className="h-7 w-7" />
        <Sparkles className="h-9 w-9" />
        <Hotel className="h-7 w-7" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">Your first storyboard starts here</h2>
        <p className="text-sm text-[#4a4a4a] max-w-md mx-auto leading-relaxed">
          Pin destinations, hotels, and moments that inspire you. When the vision is clear, post it as a trip request.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Button
          asChild
          size="lg"
          className="rounded-full bg-[#0c4d47] text-[#E5DFC6] font-semibold hover:bg-[#073331]"
        >
          <Link to="/storyboards/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Create a Storyboard
          </Link>
        </Button>
        <button
          onClick={() => {
            const tab = document.querySelector('[data-state="inactive"][value="inspiration"]') as HTMLElement;
            tab?.click();
          }}
          className="text-[11px] text-[#8D8D8D] hover:text-[#0a2225] transition-colors"
        >
          or browse inspiration →
        </button>
      </div>
    </div>
  );
}
