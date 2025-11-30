import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Globe, Lock, Edit2, 
  Copy, Check 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getStoryboardById,
  addStoryboardItem,
  removeStoryboardItem,
  updateStoryboard,
  type Storyboard,
} from "@/services/storyboardsService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { toast } from "sonner";

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

  useEffect(() => {
    if (!id) return;
    loadStoryboard();
  }, [id]);

  useEffect(() => {
    if (!id || !user || !storyboard) return;
    handleUrlParams();
  }, [id, user, storyboard]);

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

  const handleConvertToTrip = () => {
    if (!id) return;
    navigate(`/post-trip?fromStoryboard=${id}`);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Remove this item from your storyboard?")) return;
    try {
      await removeStoryboardItem(itemId);
      setStoryboard(prev =>
        prev
          ? {
              ...prev,
              items: (prev.items || []).filter((item) => item.id !== itemId),
            }
          : prev
      );
      toast.success("Item removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    }
  };

  const handleShareLink = async () => {
    const url = window.location.href;
    const shareData = {
      title: storyboard?.title || "My Goldsainte Storyboard",
      text: storyboard?.description || "Check out my travel storyboard on Goldsainte!",
      url,
    };

    // Try native share first (works on mobile and modern browsers)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or error - fall back to clipboard
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    // Fallback to clipboard copy
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
          <p className="text-sm text-muted-foreground">
            Please sign in to view this storyboard.
          </p>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-card border border-border p-6">
              {editing ? (
                <div className="space-y-4">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Storyboard title"
                    className="text-xl font-semibold"
                  />
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description (optional)"
                    rows={2}
                    className="resize-none text-sm"
                  />
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="public"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="public" className="text-sm">
                      Make this storyboard public
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveChanges}
                      disabled={!title.trim()}
                    >
                      Save Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setTitle(storyboard.title);
                        setDescription(storyboard.description || "");
                        setIsPublic(storyboard.is_public);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium">
                        {storyboard.is_public ? (
                          <><Globe className="h-3 w-3" /> Public</>
                        ) : (
                          <><Lock className="h-3 w-3" /> Private</>
                        )}
                      </span>
                      {storyboard.trip_request_id && (
                        <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-[10px] font-medium">
                          Converted to Trip Request
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight mb-2">
                      {storyboard.title}
                    </h1>
                    {storyboard.description && (
                      <p className="text-sm text-muted-foreground max-w-2xl">
                        {storyboard.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {user.id === storyboard.owner_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(true)}
                      >
                        <Edit2 className="mr-1 h-3.5 w-3.5" />
                        Edit Details
                      </Button>
                    )}
                    {storyboard.is_public && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleShareLink}
                      >
                        {copied ? (
                          <><Check className="mr-1 h-3.5 w-3.5" /> Copied!</>
                        ) : (
                          <><Copy className="mr-1 h-3.5 w-3.5" /> Share Link</>
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/tiktok-lab")}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add from Lab
                    </Button>
                    {!storyboard.trip_request_id && (
                      <Button
                        size="sm"
                        onClick={handleConvertToTrip}
                      >
                        Convert to Trip Request
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(storyboard.items || []).length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Your storyboard is empty
                  </p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
                    Start building your dream trip! Add content from the Creator Lab, 
                    browse creator profiles, or save recommendations from agents.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/tiktok-lab")}
                    >
                      Open Creator Lab
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/creators")}
                    >
                      Browse Creators
                    </Button>
                  </div>
                </div>
              ) : (
                storyboard.items!.map((item) => (
                  <Card
                    key={item.id}
                    className="relative group overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all"
                  >
                    {item.image_url && (
                      <div className="relative h-40 w-full overflow-hidden bg-muted">
                        <img
                          src={item.image_url}
                          alt={item.title || ""}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {item.title && (
                            <p className="text-xs font-medium text-foreground line-clamp-1">
                              {item.title}
                            </p>
                          )}
                          {item.subtitle && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                          {item.item_type}
                        </span>
                      </div>
                      {item.source_type && (
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                          <span>From {item.source_type.replace("_", " ")}</span>
                        </div>
                      )}
                    </div>
                    {user.id === storyboard.owner_id && (
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
