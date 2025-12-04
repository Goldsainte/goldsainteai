import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TravelStoryboard } from "@/components/storyboards/TravelStoryboard";

type Storyboard = {
  id: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  created_at: string;
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

      // Fetch user profile to get account type
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .single();

      if (!cancelled && profile) {
        setAccountType(profile.account_type as AccountType);
      }

      // Fetch storyboards owned by this user
      const { data, error } = await supabase
        .from("storyboards")
        .select("id, title, description, tags, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        if (error) {
          console.error("Error loading storyboards:", error);
          setStoryboards([]);
        } else {
          setStoryboards(data || []);
        }
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isCreatorOrAgent = accountType === "creator" || accountType === "agent";

  // Role-specific copy
  const copy = {
    pageTitle: isCreatorOrAgent 
      ? "My Storyboards · Goldsainte Creator Lab" 
      : "My Storyboards · Goldsainte",
    metaDescription: isCreatorOrAgent
      ? "Manage your storyboards and turn your travel content into bookable trips."
      : "Collect and organize travel inspiration for your dream trips.",
    headerSubtitle: isCreatorOrAgent
      ? "These are your trip templates. Share them in your TikTok bio, and earn commission when your audience books through Goldsainte."
      : "Collect and organize travel inspiration. Save your favorite destinations, experiences, and aesthetic ideas to shape your perfect trip.",
    emptyTitle: "No storyboards yet",
    emptyDescription: isCreatorOrAgent
      ? "Create your first storyboard from your existing travel content. Each storyboard becomes a bookable trip template your audience can request."
      : "Start collecting travel inspiration! Save photos, destinations, and experiences you love — then turn your favorite storyboard into a trip request.",
    emptyCta: isCreatorOrAgent
      ? "Create your first storyboard"
      : "Start collecting inspiration",
  };

  return (
    <>
      <Helmet>
        <title>{copy.pageTitle}</title>
        <meta name="description" content={copy.metaDescription} />
      </Helmet>

      <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">
                My Storyboards
              </h1>
              <p className="max-w-2xl text-xs text-[#4a4a4a] md:text-sm">
                {copy.headerSubtitle}
              </p>
            </div>
            {!loading && storyboards.length > 0 && (
              <Button
                asChild
                className="rounded-full bg-[#0c4d47] text-[#E5DFC6] text-xs font-semibold hover:bg-[#073331]"
              >
                <Link to="/storyboards/new">
                  <Plus className="h-3 w-3 mr-1" />
                  New storyboard
                </Link>
              </Button>
            )}
          </header>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white/90 border border-[#E5DFC6] p-4 h-48 animate-pulse"
                />
              ))}
            </div>
          ) : storyboards.length === 0 ? (
            <div className="rounded-3xl bg-white/90 border border-[#E5DFC6] p-8 text-center space-y-3">
              <ImageIcon className="h-10 w-10 mx-auto text-[#BFAD72]" />
              <h2 className="text-lg font-semibold">{copy.emptyTitle}</h2>
              <p className="text-sm text-[#4a4a4a] max-w-md mx-auto">
                {copy.emptyDescription}
              </p>
              <Button
                asChild
                className="rounded-full bg-[#0c4d47] text-[#E5DFC6] text-xs font-semibold hover:bg-[#073331]"
              >
                <Link to="/storyboards/new">
                  {copy.emptyCta}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {storyboards.map((storyboard) => (
                <Link
                  key={storyboard.id}
                  to={`/storyboards/${storyboard.id}`}
                  className="group rounded-2xl bg-white/90 border border-[#E5DFC6] p-4 space-y-2 hover:border-[#BFAD72] transition-colors"
                >
                  <div className="h-32 rounded-xl bg-gradient-to-br from-[#0a2225] to-[#0c4d47] flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-[#BFAD72]/50" />
                  </div>
                  <h3 className="text-base font-semibold line-clamp-1">
                    {storyboard.title || 'Untitled storyboard'}
                  </h3>
                  {storyboard.description && (
                    <p className="text-xs text-[#8D8D8D] line-clamp-2">
                      {storyboard.description}
                    </p>
                  )}
                  {storyboard.tags && storyboard.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {storyboard.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex rounded-full bg-[#f7f3ea] px-2 py-0.5 text-[9px] text-[#4a4a4a]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Inspiration gallery with save buttons */}
          <div className="mt-10 pt-8 border-t border-[#E5DFC6]">
            <div className="mb-4">
              <h2 className="text-sm font-semibold tracking-tight md:text-base">
                Browse Inspiration
              </h2>
              <p className="text-xs text-[#4a4a4a] md:text-sm">
                Save visual ideas to your storyboards for future trips.
              </p>
            </div>
            <TravelStoryboard
              title=""
              subtitle=""
              maxItems={50}
              showSaveButtons={true}
            />
          </div>
        </div>
      </main>
    </>
  );
}
