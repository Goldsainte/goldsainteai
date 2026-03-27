import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

interface ContentBlock {
  id: string;
  imageUrl: string;
  caption: string;
}

interface UnsplashPhoto {
  id: string;
  urls: { small: string; regular: string; full: string };
  alt_description: string | null;
  user: { name: string };
}

type AddMode = null | "upload" | "design" | "unsplash";

export default function StoryboardNewPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [showDesignEditor, setShowDesignEditor] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [coverAddMode, setCoverAddMode] = useState<AddMode>(null);

  // Unsplash search state
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);
  const [unsplashTarget, setUnsplashTarget] = useState<"cover" | "block">("block");

  const searchUnsplash = useCallback(async () => {
    if (!unsplashQuery.trim()) return;
    setSearchingUnsplash(true);
    try {
      const { data, error } = await supabase.functions.invoke("unsplash-search", {
        body: { q: unsplashQuery },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUnsplashResults(data?.results || []);
    } catch (err: any) {
      console.error("Unsplash search error:", err);
      toast.error("Search failed: " + (err.message || "Unknown error"));
      setUnsplashResults([]);
    } finally {
      setSearchingUnsplash(false);
    }
  }, [unsplashQuery]);

  const selectUnsplashPhoto = useCallback(
    (photo: UnsplashPhoto) => {
      const url = photo.urls.regular || photo.urls.full;
      if (unsplashTarget === "cover") {
        setCoverImage(url);
        setCoverAddMode(null);
      } else {
        setBlocks((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            imageUrl: url,
            caption: photo.alt_description || "",
          },
        ]);
      }
      // Reset search
      setUnsplashResults([]);
      setUnsplashQuery("");
      setAddMode(null);
    },
    [unsplashTarget]
  );

  const handleCoverUpload = useCallback((urls: string[]) => {
    if (urls.length > 0) {
      setCoverImage(urls[0]);
      setCoverAddMode(null);
    }
  }, []);

  const handleDesignExport = useCallback(
    (url: string) => {
      if (!coverImage) {
        setCoverImage(url);
      } else {
        setBlocks((prev) => [
          ...prev,
          { id: crypto.randomUUID(), imageUrl: url, caption: "" },
        ]);
      }
    },
    [coverImage]
  );

  const handleBlockPhotosUploaded = useCallback((urls: string[]) => {
    const newBlocks: ContentBlock[] = urls.map((url) => ({
      id: crypto.randomUUID(),
      imageUrl: url,
      caption: "",
    }));
    setBlocks((prev) => [...prev, ...newBlocks]);
    setAddMode(null);
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

  // Shared Unsplash search UI
  const renderUnsplashSearch = () => (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          searchUnsplash();
        }}
        className="flex gap-2"
      >
        <Input
          value={unsplashQuery}
          onChange={(e) => setUnsplashQuery(e.target.value)}
          placeholder="Search Unsplash photos..."
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={searchingUnsplash || !unsplashQuery.trim()}
          className="gap-1.5"
        >
          {searchingUnsplash ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          Search
        </Button>
      </form>

      {searchingUnsplash && unsplashResults.length === 0 && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      )}

      {unsplashResults.length > 0 && (
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto rounded-lg">
          {unsplashResults.map((photo) => (
            <button
              key={photo.id}
              onClick={() => selectUnsplashPhoto(photo)}
              className="relative group rounded-lg overflow-hidden aspect-square"
            >
              <img
                src={photo.urls.small}
                alt={photo.alt_description || "Unsplash photo"}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <span className="absolute bottom-1 left-1 right-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity truncate drop-shadow">
                {photo.user.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {!searchingUnsplash &&
        unsplashResults.length === 0 &&
        unsplashQuery.trim() && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No results. Try a different search term.
          </p>
        )}
    </div>
  );

  // Shared add-content panel
  const renderAddOptions = (
    mode: AddMode,
    setMode: (m: AddMode) => void,
    target: "cover" | "block"
  ) => {
    if (!mode) return null;

    return (
      <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {mode === "upload"
              ? "Upload Photos"
              : mode === "design"
              ? "Design Editor"
              : "Search Unsplash"}
          </span>
          <button
            onClick={() => {
              setMode(null);
              setUnsplashResults([]);
              setUnsplashQuery("");
            }}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {mode === "upload" && (
          <StoryboardPhotoUploader
            onPhotosUploaded={
              target === "cover" ? handleCoverUpload : handleBlockPhotosUploaded
            }
          />
        )}
        {mode === "unsplash" && renderUnsplashSearch()}
        {mode === "design" && (
          <div className="text-center py-4">
            <Button
              onClick={() => {
                setMode(null);
                setShowDesignEditor(true);
              }}
              className="gap-1.5"
            >
              <Paintbrush className="h-3.5 w-3.5" /> Open Design Editor
            </Button>
          </div>
        )}
      </div>
    );
  };

  const addSourceButtons = (
    setMode: (m: AddMode) => void,
    target: "cover" | "block"
  ) => (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={() => setMode("upload")}
        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">Upload</span>
      </button>
      <button
        onClick={() => {
          setUnsplashTarget(target);
          setMode("unsplash");
        }}
        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
      >
        <Search className="h-5 w-5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">Unsplash</span>
      </button>
      <button
        onClick={() => {
          setMode("design");
        }}
        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
      >
        <Paintbrush className="h-5 w-5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">Design</span>
      </button>
    </div>
  );

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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {blocks.length} block{blocks.length !== 1 ? "s" : ""}
            </span>
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
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Step 1: Title + Destination */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Step 1 — Name your storyboard
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 10 Days in Amalfi Coast"
            className="w-full text-2xl sm:text-3xl font-display font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 text-foreground"
          />
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where to? (optional)"
              className="w-full text-base bg-transparent border-none outline-none placeholder:text-muted-foreground/40 text-foreground"
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Step 2: Cover Image */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Step 2 — Cover image
          </label>

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
          ) : coverAddMode ? (
            renderAddOptions(coverAddMode, setCoverAddMode, "cover")
          ) : (
            <div className="border-2 border-dashed border-border rounded-2xl aspect-[16/9] flex flex-col items-center justify-center gap-4 bg-muted/20">
              <ImagePlus className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Choose how to add your cover
              </p>
              {addSourceButtons(setCoverAddMode, "cover")}
            </div>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Step 3: Content Blocks */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Step 3 — Add content
          </label>

          {blocks.length > 0 && (
            <div className="space-y-4">
              {blocks.map((block, idx) => (
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
                  <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] font-medium rounded-full h-5 w-5 flex items-center justify-center">
                    {idx + 1}
                  </div>
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

          {/* Add content area */}
          {addMode ? (
            renderAddOptions(addMode, setAddMode, "block")
          ) : (
            <button
              onClick={() => setAddMode("upload")}
              className="w-full border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Add content block</span>
              <span className="text-xs text-muted-foreground/60">
                Upload photos, search Unsplash, or open the design editor
              </span>
            </button>
          )}

          {/* Quick add source switcher when addMode is null and there are blocks */}
          {!addMode && blocks.length > 0 && (
            <div className="flex justify-center gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAddMode("upload")}
                className="gap-1.5 text-xs"
              >
                <Upload className="h-3 w-3" /> Upload
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUnsplashTarget("block");
                  setAddMode("unsplash");
                }}
                className="gap-1.5 text-xs"
              >
                <Search className="h-3 w-3" /> Unsplash
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDesignEditor(true)}
                className="gap-1.5 text-xs"
              >
                <Paintbrush className="h-3 w-3" /> Design
              </Button>
            </div>
          )}
        </div>

        {/* Bottom publish */}
        {(title.trim() || blocks.length > 0) && (
          <>
            <div className="border-t border-border" />
            <div className="flex justify-end">
              <Button
                onClick={handlePublish}
                disabled={publishing || !title.trim()}
                size="lg"
                className="gap-2"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>Publish Storyboard</>
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Design Editor Modal */}
      <DesignEditorModal
        open={showDesignEditor}
        onOpenChange={setShowDesignEditor}
        onExport={handleDesignExport}
      />
    </div>
  );
}
