import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Globe, Lock, Edit2, 
  Copy, Check, Bookmark, ArrowRight, Sparkles, Loader2, MoreVertical,
  Upload, Paintbrush
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getStoryboardById,
  addStoryboardItem,
  removeStoryboardItem,
  updateStoryboard,
  getPublicStoryboards,
  type Storyboard,
} from "@/services/storyboardsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { Header } from "@/components/Header";
import { SaveToStoryboardModal } from "@/components/discovery/SaveToStoryboardModal";
import { useDiscoveryFeed, type UnsplashImage } from "@/hooks/useDiscoveryFeed";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteStoryboard } from "@/services/storyboardsService";
import { toast } from "sonner";
import { StoryboardPhotoUploader } from "@/components/storyboards/StoryboardPhotoUploader";
import { DesignEditorModal } from "@/components/storyboards/DesignEditorModal";

export default function StoryboardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [relatedBoards, setRelatedBoards] = useState<Storyboard[]>([]);
  const [sellingExperience, setSellingExperience] = useState(false);

  const [saveModal, setSaveModal] = useState<{
    open: boolean;
    imageUrl: string;
    title?: string;
    sourceType?: string;
    sourceId?: string;
    repinnedFromItemId?: string;
    repinnedFromUserId?: string;
  }>({ open: false, imageUrl: "" });

  const isOwner = user?.id === storyboard?.owner_id;
  const [deleting, setDeleting] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [designEditorOpen, setDesignEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // "More like this" query based on storyboard title
  const moreLikeQuery = storyboard?.title
    ? `${storyboard.title} ${storyboard.destination || ""} travel inspiration`
    : "";
  const moreLikePath = moreLikeQuery ? moreLikeQuery.split(" ").filter(Boolean) : [];
  const { data: moreLikeData } = useDiscoveryFeed(
    moreLikePath,
    moreLikePath.length > 0 && !loading
  );

  useEffect(() => {
    if (!id) return;
    loadStoryboard();
  }, [id]);

  useEffect(() => {
    if (!id || !user || !storyboard) return;
    handleUrlParams();
  }, [id, user, storyboard]);

  useEffect(() => {
    loadRelatedBoards();
  }, [storyboard]);

  const loadStoryboard = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        navigate("/auth?returnTo=/storyboards", { replace: true });
        return;
      }
      setUser(authUser);
      
      const data = await getStoryboardById(id);
      if (!data) {
        toast.error("Storyboard not found");
        navigate("/storyboards");
        return;
      }
      setStoryboard(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setIsPublic(data.is_public);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load storyboard");
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedBoards = async () => {
    if (!storyboard) return;
    try {
      const boards = await getPublicStoryboards();
      setRelatedBoards(boards.filter((b) => b.id !== storyboard.id).slice(0, 4));
    } catch {
      // silent
    }
  };

  const handleUrlParams = async () => {
    const fromCreatorId = searchParams.get("addCreatorId");
    const fromAgentId = searchParams.get("addAgentId");
    const fromLabImage = searchParams.get("addLabImage");

    if (!fromCreatorId && !fromAgentId && !fromLabImage) return;

    try {
      let added = false;

      if (fromCreatorId) {
        await addStoryboardItem({
          storyboardId: id!,
          itemType: "creator",
          title: searchParams.get("creatorName") || "Creator",
          imageUrl: searchParams.get("creatorImage") || undefined,
          sourceType: "creator_profile",
          sourceId: fromCreatorId,
        });
        added = true;
      } else if (fromAgentId) {
        await addStoryboardItem({
          storyboardId: id!,
          itemType: "agent",
          title: searchParams.get("agentName") || "Agent",
          imageUrl: searchParams.get("agentImage") || undefined,
          sourceType: "agent_profile",
          sourceId: fromAgentId,
        });
        added = true;
      } else if (fromLabImage) {
        await addStoryboardItem({
          storyboardId: id!,
          itemType: "image",
          title: searchParams.get("imageTitle") || "Creator Lab Image",
          imageUrl: fromLabImage,
          sourceType: "creator_lab",
          sourceId: "lab",
        });
        added = true;
      }

      if (added) {
        toast.success("Added to storyboard!");
        setSearchParams({});
        await loadStoryboard();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item");
    }
  };

  const handleSaveChanges = async () => {
    if (!id || !title.trim()) return;
    try {
      await updateStoryboard(id, {
        title: title.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      });
      setStoryboard(prev => prev ? {
        ...prev,
        title: title.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      } : prev);
      setEditing(false);
      toast.success("Storyboard updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update storyboard");
    }
  };

  const handleDeleteStoryboard = async () => {
    if (!id || !window.confirm("Delete this entire storyboard? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteStoryboard(id);
      toast.success("Storyboard deleted");
      navigate("/storyboards", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete storyboard");
      setDeleting(false);
    }
  };

  const handleConvertToTrip = () => {
    if (!id) return;
    navigate(`/post-trip?fromStoryboard=${id}${
      storyboard?.destination ? `&destination=${encodeURIComponent(storyboard.destination)}` : ""
    }${storyboard?.title ? `&title=${encodeURIComponent(storyboard.title)}` : ""}`);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Remove this item from your storyboard?")) return;
    try {
      await removeStoryboardItem(itemId);
      setStoryboard(prev =>
        prev ? { ...prev, items: (prev.items || []).filter((item) => item.id !== itemId) } : prev
      );
      toast.success("Item removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    }
  };

  const handleShareLink = async () => {
    const url = storyboard?.slug ? `${window.location.origin}/s/${storyboard.slug}` : window.location.href;
    const shareData = {
      title: storyboard?.title || "My Goldsainte Storyboard",
      text: storyboard?.description || "Check out my travel storyboard on Goldsainte!",
      url,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error("Share failed:", err);
      }
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-muted-foreground">Please sign in to view this storyboard.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
        <button
          onClick={() => navigate("/storyboards")}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to storyboards
        </button>

        {loading || !storyboard ? (
          <div className="space-y-4">
            <div className="h-32 rounded-2xl bg-muted animate-pulse" />
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="mb-4 rounded-2xl bg-muted animate-pulse" style={{ height: `${180 + (i % 3) * 60}px` }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Header card */}
            <div className="rounded-2xl bg-card border border-border p-6">
              {editing ? (
                <div className="space-y-4">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Storyboard title" className="text-xl font-semibold" />
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a description (optional)" rows={2} className="resize-none text-sm" />
                  <div className="flex items-center space-x-2">
                    <Checkbox id="public" checked={isPublic} onCheckedChange={(checked) => { const v = checked === true; (setIsPublic)(v); }} />
                    <Label htmlFor="public" className="text-sm">Make this storyboard public</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveChanges} disabled={!title.trim()}>Save Changes</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(false); setTitle(storyboard.title); setDescription(storyboard.description || ""); setIsPublic(storyboard.is_public); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium">
                        {storyboard.is_public ? <><Globe className="h-3 w-3" /> Public</> : <><Lock className="h-3 w-3" /> Private</>}
                      </span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight mb-2">{storyboard.title}</h1>
                    {storyboard.description && <p className="text-sm text-muted-foreground max-w-2xl">{storyboard.description}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{(storyboard.items || []).length} pins</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(true)}>
                            <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleDeleteStoryboard}
                            disabled={deleting}
                            className="text-red-400 focus:text-red-300"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> {deleting ? "Deleting…" : "Delete Storyboard"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {storyboard.is_public && (
                      <Button size="sm" variant="outline" onClick={handleShareLink}>
                        {copied ? <><Check className="mr-1 h-3.5 w-3.5" /> Copied!</> : <><Copy className="mr-1 h-3.5 w-3.5" /> Share Link</>}
                      </Button>
                    )}
                    {isOwner && (
                      <Button
                        size="sm"
                        disabled={sellingExperience}
                        className="bg-gradient-to-r from-[#C7A962] to-[#b89a55] text-white rounded-full px-5 hover:opacity-90"
                        onClick={async () => {
                          setSellingExperience(true);
                          try {
                            const { data, error } = await invokeWithAuth<{ tripId: string; slug: string }>(
                              "storyboard-to-trip",
                              { body: { storyboardId: id } }
                            );
                            if (error || !data) {
                              toast.error(error || "Failed to generate trip listing");
                              return;
                            }
                            toast.success("Trip listing drafted! Review and publish.");
                            navigate(`/trip-builder?edit=${data.tripId}`);
                          } catch {
                            toast.error("Something went wrong");
                          } finally {
                            setSellingExperience(false);
                          }
                        }}
                      >
                        {sellingExperience ? (
                          <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> AI is designing your trip...</>
                        ) : (
                          <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Sell This Experience</>
                        )}
                      </Button>
                    )}
                    <Button size="sm" className="bg-[#C7A962] hover:bg-[#b89a55] text-white" onClick={handleConvertToTrip}>
                      <ArrowRight className="mr-1 h-3.5 w-3.5" />
                      Start a trip from this
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Masonry pin grid */}
            {(storyboard.items || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                <p className="text-sm font-medium text-foreground mb-2">Your storyboard is empty</p>
                <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
                  Start building your dream trip! Upload photos, design visuals, or browse creators for inspiration.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {isOwner && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setShowUploader(true)} className="gap-1.5">
                        <Upload className="h-3.5 w-3.5" /> Upload Photos
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDesignEditorOpen(true)} className="gap-1.5">
                        <Paintbrush className="h-3.5 w-3.5" /> Design
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => navigate("/creators")}>Browse Creators</Button>
                </div>
                {isOwner && showUploader && (
                  <div className="mt-4 max-w-md mx-auto">
                    <StoryboardPhotoUploader
                      onPhotosUploaded={async (urls) => {
                        for (const url of urls) {
                          await addStoryboardItem({
                            storyboardId: id!,
                            itemType: "image",
                            title: "Uploaded photo",
                            imageUrl: url,
                            sourceType: "manual",
                          });
                        }
                        await loadStoryboard();
                      }}
                    />
                  </div>
                )}
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
                        <div className="flex gap-1.5">
                          {!isOwner && (
                            <button
                              onClick={() =>
                                setSaveModal({
                                  open: true,
                                  imageUrl: item.image_url || "",
                                  title: item.title || undefined,
                                  sourceType: "storyboard_pin",
                                  sourceId: item.id,
                                  repinnedFromItemId: item.id,
                                  repinnedFromUserId: storyboard.owner_id,
                                })
                              }
                              className="h-8 w-8 rounded-full bg-[#C7A962] flex items-center justify-center hover:bg-[#b89a55] transition-colors shadow-lg"
                            >
                              <Bookmark className="h-3.5 w-3.5 text-white" />
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          )}
                        </div>
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

            {/* Owner floating actions */}
            {isOwner && (storyboard.items || []).length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setShowUploader(!showUploader)} className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Upload Photos
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDesignEditorOpen(true)} className="gap-1.5">
                  <Paintbrush className="h-3.5 w-3.5" /> Design
                </Button>
              </div>
            )}

            {/* Inline uploader for owner */}
            {isOwner && showUploader && (
              <div className="max-w-lg">
                <StoryboardPhotoUploader
                  onPhotosUploaded={async (urls) => {
                    for (const url of urls) {
                      await addStoryboardItem({
                        storyboardId: id!,
                        itemType: "image",
                        title: "Uploaded photo",
                        imageUrl: url,
                        sourceType: "manual",
                      });
                    }
                    await loadStoryboard();
                    setShowUploader(false);
                  }}
                />
              </div>
            )}

            {/* Related storyboards */}
            {relatedBoards.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="h-4 w-4 text-[#C7A962]" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#C7A962]">Related Storyboards</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-[#C7A962]/30 to-transparent" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedBoards.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => navigate(`/storyboards/${board.id}`)}
                      className="text-left rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-medium text-foreground line-clamp-1">{board.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{board.items_count || 0} pins</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <SaveToStoryboardModal
        open={saveModal.open}
        onOpenChange={(o) => setSaveModal((s) => ({ ...s, open: o }))}
        imageUrl={saveModal.imageUrl}
        title={saveModal.title}
        sourceType={saveModal.sourceType}
        sourceId={saveModal.sourceId}
        repinnedFromItemId={saveModal.repinnedFromItemId}
        repinnedFromUserId={saveModal.repinnedFromUserId}
      />

      <DesignEditorModal
        open={designEditorOpen}
        onOpenChange={setDesignEditorOpen}
        onExport={async (url) => {
          await addStoryboardItem({
            storyboardId: id!,
            itemType: "image",
            title: "Designed block",
            imageUrl: url,
            sourceType: "design_editor",
          });
          await loadStoryboard();
        }}
      />
    </div>
  );
}
