import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  MapPin, Eye, BookmarkPlus, Share2, Copy, Check,
  ArrowRight, Sparkles, GitFork
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getStoryboardBySlug,
  incrementStoryboardViewCount,
  forkStoryboard,
  getPublicStoryboards,
  type Storyboard,
} from "@/services/storyboardsService";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import { SaveToStoryboardModal } from "@/components/discovery/SaveToStoryboardModal";
import { toast } from "sonner";

export default function PublicStoryboardPage() {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();

  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [relatedBoards, setRelatedBoards] = useState<Storyboard[]>([]);
  const [forking, setForking] = useState(false);

  const [saveModal, setSaveModal] = useState<{
    open: boolean;
    imageUrl: string;
    title?: string;
    sourceType?: string;
    sourceId?: string;
  }>({ open: false, imageUrl: "" });

  useEffect(() => {
    if (!slugOrId) return;
    loadData();
  }, [slugOrId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Check if user is logged in (optional)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const data = await getStoryboardBySlug(slugOrId!);
      if (!data) {
        toast.error("Storyboard not found");
        navigate("/", { replace: true });
        return;
      }
      setStoryboard(data);

      // Increment view count (fire-and-forget)
      incrementStoryboardViewCount(data.id).catch(() => {});

      // Load creator profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, account_type")
        .eq("id", data.owner_id)
        .single();
      setCreator(profile);

      // Load related boards
      const boards = await getPublicStoryboards();
      setRelatedBoards(boards.filter(b => b.id !== data.id).slice(0, 4));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load storyboard");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/s/${storyboard?.slug || slugOrId}`;
    const shareData = {
      title: storyboard?.title || "Goldsainte Storyboard",
      text: storyboard?.description || "Check out this travel storyboard on Goldsainte!",
      url,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error(err);
      }
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const handleFork = async () => {
    if (!user) {
      toast.error("Please sign in to fork this storyboard");
      navigate("/auth");
      return;
    }
    if (!storyboard) return;
    setForking(true);
    try {
      const newBoard = await forkStoryboard({
        originalStoryboardId: storyboard.id,
        userId: user.id,
        title: `${storyboard.title} (My Version)`,
      });
      toast.success("Storyboard forked! It's now in your boards.");
      navigate(`/storyboards/${newBoard.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fork storyboard");
    } finally {
      setForking(false);
    }
  };

  const coverImage =
    storyboard?.cover_image_url ||
    storyboard?.items?.[0]?.image_url ||
    "";

  const siteUrl = "https://goldsainteai.lovable.app";
  const pageUrl = `${siteUrl}/s/${storyboard?.slug || slugOrId}`;
  const pinCount = storyboard?.items?.length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-6xl px-4 py-10">
          <div className="h-72 rounded-2xl bg-muted animate-pulse mb-6" />
          <div className="h-8 w-1/3 bg-muted animate-pulse rounded mb-4" />
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="mb-4 rounded-2xl bg-muted animate-pulse" style={{ height: `${180 + (i % 3) * 60}px` }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!storyboard) return null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{storyboard.title} — Goldsainte Storyboard</title>
        <meta name="description" content={storyboard.description || `A curated travel storyboard with ${pinCount} pins on Goldsainte.`} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={storyboard.title} />
        <meta property="og:description" content={storyboard.description || "Explore this curated travel storyboard on Goldsainte."} />
        {coverImage && <meta property="og:image" content={coverImage} />}
        <meta property="og:site_name" content="Goldsainte" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={storyboard.title} />
        <meta name="twitter:description" content={storyboard.description || "Explore this curated travel storyboard on Goldsainte."} />
        {coverImage && <meta name="twitter:image" content={coverImage} />}
      </Helmet>

      <Header />

      <main>
        {/* Hero */}
        {coverImage && (
          <div className="relative h-72 md:h-80 overflow-hidden">
            <img src={coverImage} alt={storyboard.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 text-white/70 text-[10px] uppercase tracking-[0.2em] font-medium mb-2">
                <span>Storyboard</span>
                <span>·</span>
                <span>{pinCount} pins</span>
                {storyboard.destination && (
                  <>
                    <span>·</span>
                    <MapPin className="h-3 w-3" />
                    <span>{storyboard.destination}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">{storyboard.title}</h1>
              {creator && (
                <Link
                  to={`/creators/${creator.id}`}
                  className="inline-flex items-center gap-2 mt-3 text-white/80 hover:text-white transition text-sm"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={creator.avatar_url || ""} />
                    <AvatarFallback className="text-[10px] bg-white/20 text-white">
                      {(creator.display_name || "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>by {creator.display_name || "Creator"}</span>
                  {storyboard.view_count > 0 && (
                    <span className="flex items-center gap-1 ml-2">
                      <Eye className="h-3 w-3" />
                      {storyboard.view_count.toLocaleString()} views
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="container mx-auto max-w-6xl px-4">
          {/* Description + CTAs */}
          <div className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border">
            {storyboard.description && (
              <p className="text-sm text-muted-foreground max-w-2xl">{storyboard.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#C7A962] to-[#b89a55] text-white rounded-full px-5"
                onClick={() => navigate(`/post-trip?destination=${encodeURIComponent(storyboard.destination || "")}&title=${encodeURIComponent(storyboard.title)}`)}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Design My Trip
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={handleFork} disabled={forking}>
                <GitFork className="mr-1.5 h-3.5 w-3.5" />
                {forking ? "Forking..." : "Fork This Board"}
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={handleShare}>
                {copied ? <><Check className="mr-1.5 h-3.5 w-3.5" /> Copied!</> : <><Share2 className="mr-1.5 h-3.5 w-3.5" /> Share</>}
              </Button>
            </div>
          </div>

          {/* Masonry grid */}
          <div className="py-8">
            {pinCount === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                <p className="text-sm text-muted-foreground">This storyboard is empty.</p>
              </div>
            ) : (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
                {storyboard.items!.map((item) => (
                  <div key={item.id} className="break-inside-avoid mb-4 group relative">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title || ""}
                        className="w-full rounded-2xl object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex flex-col justify-between p-4">
                      <div className="flex justify-between items-start">
                        <span className="text-white/70 text-[10px] uppercase tracking-wider font-medium">
                          {item.item_type}
                        </span>
                        {user && (
                          <button
                            onClick={() =>
                              setSaveModal({
                                open: true,
                                imageUrl: item.image_url || "",
                                title: item.title || undefined,
                                sourceType: "storyboard_pin",
                                sourceId: item.id,
                              })
                            }
                            className="h-8 w-8 rounded-full bg-[#C7A962] flex items-center justify-center hover:bg-[#b89a55] transition-colors shadow-lg"
                          >
                            <BookmarkPlus className="h-3.5 w-3.5 text-white" />
                          </button>
                        )}
                      </div>
                      <div>
                        {item.title && <p className="font-secondary text-white text-sm leading-snug mb-1">{item.title}</p>}
                        {item.subtitle && <p className="text-white/70 text-xs line-clamp-2">{item.subtitle}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Creator attribution card */}
          {creator && (
            <div className="rounded-2xl border border-border bg-card p-6 mb-8 flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={creator.avatar_url || ""} />
                <AvatarFallback className="text-lg bg-muted">
                  {(creator.display_name || "?")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Curated by</p>
                <p className="text-lg font-semibold">{creator.display_name || "Creator"}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-full" asChild>
                  <Link to={`/creators/${creator.id}`}>View Profile</Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#C7A962] to-[#b89a55] text-white rounded-full"
                  onClick={() => navigate(`/post-trip?destination=${encodeURIComponent(storyboard.destination || "")}&title=${encodeURIComponent(storyboard.title)}`)}
                >
                  <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                  Design My Trip
                </Button>
              </div>
            </div>
          )}

          {/* Related storyboards */}
          {relatedBoards.length > 0 && (
            <div className="pb-12">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-4 w-4 text-[#C7A962]" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#C7A962]">More Storyboards</span>
                <div className="h-px flex-1 bg-gradient-to-r from-[#C7A962]/30 to-transparent" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedBoards.map((board) => (
                  <Link
                    key={board.id}
                    to={`/s/${board.slug || board.id}`}
                    className="group rounded-2xl overflow-hidden border border-border hover:border-[#C7A962]/40 transition"
                  >
                    {board.cover_image_url ? (
                      <img src={board.cover_image_url} alt={board.title} className="w-full h-32 object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-32 bg-muted" />
                    )}
                    <div className="p-3">
                      <p className="text-xs font-medium truncate">{board.title}</p>
                      <p className="text-[10px] text-muted-foreground">{board.items_count || 0} pins</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Save to storyboard modal */}
      {saveModal.open && (
        <SaveToStoryboardModal
          open={saveModal.open}
          onOpenChange={(open) => { if (!open) setSaveModal({ open: false, imageUrl: "" }); }}
          imageUrl={saveModal.imageUrl}
          title={saveModal.title}
          sourceType={saveModal.sourceType}
          sourceId={saveModal.sourceId}
        />
      )}
    </div>
  );
}
