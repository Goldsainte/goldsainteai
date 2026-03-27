import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StoryboardPhotoUploader } from "@/components/storyboards/StoryboardPhotoUploader";
import { DesignEditorModal } from "@/components/storyboards/DesignEditorModal";
import {
  ArrowLeft,
  ImagePlus,
  Paintbrush,
  Plus,
  Loader2,
  MapPin,
  X,
  Upload,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface ContentBlock {
  id: string;
  imageUrl: string;
  caption: string;
}

export default function StoryboardNewPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [showDesignEditor, setShowDesignEditor] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [coverMode, setCoverMode] = useState<"upload" | "design" | null>(null);

  const handleCoverUpload = useCallback((urls: string[]) => {
    if (urls.length > 0) {
      setCoverImage(urls[0]);
      setCoverMode(null);
    }
  }, []);

  const handleCoverDesignExport = useCallback((url: string) => {
    setCoverImage(url);
  }, []);

  const handleBlockPhotosUploaded = useCallback((urls: string[]) => {
    const newBlocks: ContentBlock[] = urls.map((url) => ({
      id: crypto.randomUUID(),
      imageUrl: url,
      caption: "",
    }));
    setBlocks((prev) => [...prev, ...newBlocks]);
    setShowUploader(false);
    setShowAddMenu(false);
  }, []);

  const handleBlockDesignExport = useCallback((url: string) => {
    setBlocks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), imageUrl: url, caption: "" },
    ]);
  }, []);

  const updateCaption = useCallback((blockId: string, caption: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, caption } : b))
    );
  }, []);

  const removeBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }, []);

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error("Give your storyboard a name");
      return;
    }

    setPublishing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: storyboard, error: sbError } = await supabase
        .from("storyboards")
        .insert({
          title: title.trim(),
          destination: destination.trim() || null,
          owner_id: user.id,
          role: "creator" as const,
          cover_image_url: coverImage,
          is_public: true,
        })
        .select()
        .single();

      if (sbError) throw sbError;

      if (blocks.length > 0) {
        const items = blocks.map((block, idx) => ({
          storyboard_id: storyboard.id,
          item_type: "image" as const,
          image_url: block.imageUrl,
          title: block.caption || null,
          position: idx,
        }));

        const { error: itemsError } = await supabase
          .from("storyboard_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }

      toast.success("Storyboard published!");
      navigate(`/storyboards/${storyboard.id}`);
    } catch (err: any) {
      console.error("Publish error:", err);
      toast.error(err.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>
          <Button
            onClick={handlePublish}
            disabled={publishing || !title.trim()}
            size="sm"
            className="gap-1.5"
          >
            {publishing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing...
              </>
            ) : (
              "Publish"
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Cover image */}
        <div className="relative">
          {coverImage ? (
            <div className="relative rounded-2xl overflow-hidden group">
              <img
                src={coverImage}
                alt="Cover"
                className="w-full aspect-[16/9] object-cover"
              />
              <button
                onClick={() => setCoverImage(null)}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-2xl aspect-[16/9] flex flex-col items-center justify-center gap-3 bg-muted/20">
              {coverMode === "upload" ? (
                <div className="w-full px-6">
                  <StoryboardPhotoUploader onPhotosUploaded={handleCoverUpload} />
                </div>
              ) : (
                <>
                  <ImagePlus className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Add a cover image</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCoverMode("upload")}
                      className="gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDesignEditor(true)}
                      className="gap-1.5"
                    >
                      <Paintbrush className="h-3.5 w-3.5" /> Design
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Title + Destination */}
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your trip..."
            className="w-full text-2xl sm:text-3xl font-display font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 text-foreground"
          />
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where to?"
              className="w-full text-base bg-transparent border-none outline-none placeholder:text-muted-foreground/50 text-foreground"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Content Blocks */}
        {blocks.length > 0 && (
          <div className="space-y-4">
            {blocks.map((block) => (
              <div key={block.id} className="group relative">
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={block.imageUrl}
                    alt=""
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
                <button
                  onClick={() => removeBlock(block.id)}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
                <input
                  type="text"
                  value={block.caption}
                  onChange={(e) => updateCaption(block.id, e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full mt-2 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/40 text-foreground"
                />
              </div>
            ))}
          </div>
        )}

        {/* Add block */}
        <div className="relative">
          {showAddMenu ? (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Add content</span>
                <button onClick={() => { setShowAddMenu(false); setShowUploader(false); }}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {showUploader ? (
                <StoryboardPhotoUploader onPhotosUploaded={handleBlockPhotosUploaded} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowUploader(true)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Upload Photos</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      setShowDesignEditor(true);
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
                  >
                    <Paintbrush className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Design</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAddMenu(true)}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">Add content block</span>
            </button>
          )}
        </div>
      </div>

      {/* Design Editor Modal */}
      <DesignEditorModal
        open={showDesignEditor}
        onOpenChange={setShowDesignEditor}
        onExport={coverImage ? handleBlockDesignExport : handleCoverDesignExport}
      />
    </div>
  );
}
