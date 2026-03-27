import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoryboardPhotoUploader } from "@/components/storyboards/StoryboardPhotoUploader";
import { DesignEditorModal } from "@/components/storyboards/DesignEditorModal";
import { TemplatePicker } from "@/components/storyboards/TemplatePicker";
import { StoryboardLivePreview } from "@/components/storyboards/StoryboardLivePreview";
import type { StoryboardTemplate } from "@/lib/storyboard-templates";
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
  Eye,
  EyeOff,
  Palette,
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

  const [template, setTemplate] = useState<StoryboardTemplate | null>(null);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [showDesignEditor, setShowDesignEditor] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [coverAddMode, setCoverAddMode] = useState<AddMode>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Unsplash
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);
  const [unsplashTarget, setUnsplashTarget] = useState<"cover" | "block">("block");

  // Load template fonts
  useEffect(() => {
    if (!template) return;
    const id = "sb-font-" + template.id;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = template.fontImport;
    document.head.appendChild(link);
  }, [template]);

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
          { id: crypto.randomUUID(), imageUrl: url, caption: photo.alt_description || "" },
        ]);
      }
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
        setBlocks((prev) => [...prev, { id: crypto.randomUUID(), imageUrl: url, caption: "" }]);
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
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, caption } : b)));
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
      const { data: { user } } = await supabase.auth.getUser();
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
        const { error: itemsError } = await supabase.from("storyboard_items").insert(items);
        if (itemsError) throw itemsError;
      }

      toast.success("Storyboard published!");
      navigate(`/storyboards/${storyboard.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  // ── Template Picker Phase ──
  if (!template) {
    return <TemplatePicker onSelect={setTemplate} />;
  }

  const t = template;

  // ── Unsplash search panel ──
  const renderUnsplashSearch = () => (
    <div className="space-y-3">
      <form onSubmit={(e) => { e.preventDefault(); searchUnsplash(); }} className="flex gap-2">
        <Input
          value={unsplashQuery}
          onChange={(e) => setUnsplashQuery(e.target.value)}
          placeholder="Search Unsplash photos..."
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={searchingUnsplash || !unsplashQuery.trim()} className="gap-1.5">
          {searchingUnsplash ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Search
        </Button>
      </form>

      {searchingUnsplash && unsplashResults.length === 0 && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {unsplashResults.length > 0 && (
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto rounded-lg">
          {unsplashResults.map((photo) => (
            <button key={photo.id} onClick={() => selectUnsplashPhoto(photo)} className="relative group rounded-lg overflow-hidden aspect-square">
              <img src={photo.urls.small} alt={photo.alt_description || ""} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <span className="absolute bottom-1 left-1 right-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity truncate drop-shadow">
                {photo.user.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Add content panel ──
  const renderAddOptions = (mode: AddMode, setMode: (m: AddMode) => void, target: "cover" | "block") => {
    if (!mode) return null;
    return (
      <div className="border rounded-xl p-4 space-y-3" style={{ borderColor: t.colors.muted + "30", backgroundColor: "#fff" }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: t.colors.text }}>
            {mode === "upload" ? "Upload Photos" : mode === "design" ? "Design Editor" : "Search Unsplash"}
          </span>
          <button onClick={() => { setMode(null); setUnsplashResults([]); setUnsplashQuery(""); }}>
            <X className="h-4 w-4" style={{ color: t.colors.muted }} />
          </button>
        </div>
        {mode === "upload" && <StoryboardPhotoUploader onPhotosUploaded={target === "cover" ? handleCoverUpload : handleBlockPhotosUploaded} />}
        {mode === "unsplash" && renderUnsplashSearch()}
        {mode === "design" && (
          <div className="text-center py-4">
            <Button onClick={() => { setMode(null); setShowDesignEditor(true); }} className="gap-1.5">
              <Paintbrush className="h-3.5 w-3.5" /> Open Design Editor
            </Button>
          </div>
        )}
      </div>
    );
  };

  const addSourceButtons = (setMode: (m: AddMode) => void, target: "cover" | "block") => (
    <div className="grid grid-cols-3 gap-2">
      {[
        { key: "upload" as const, icon: Upload, label: "Upload" },
        { key: "unsplash" as const, icon: Search, label: "Unsplash" },
        { key: "design" as const, icon: Paintbrush, label: "Design" },
      ].map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => {
            if (key === "unsplash") setUnsplashTarget(target);
            setMode(key);
          }}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors hover:opacity-80"
          style={{ borderColor: t.colors.muted + "30", color: t.colors.text }}
        >
          <Icon className="h-5 w-5" style={{ color: t.colors.muted }} />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.colors.bg }}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 backdrop-blur border-b" style={{ backgroundColor: t.colors.bg + "E6", borderColor: t.colors.muted + "25" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTemplate(null)}
              className="flex items-center gap-1.5 transition-colors hover:opacity-70"
              style={{ color: t.colors.muted }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Templates</span>
            </button>
            <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: t.colors.accent, color: t.colors.accent }}>
              {t.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-1.5 text-xs md:flex hidden"
              style={{ color: t.colors.text }}
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPreview ? "Hide Preview" : "Preview"}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing || !title.trim()}
              size="sm"
              className="gap-1.5"
              style={{ backgroundColor: t.colors.accent, color: t.colors.bg }}
            >
              {publishing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing...</> : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className={`flex gap-8 ${showPreview ? "" : ""}`}>
          {/* Editor column */}
          <div className={`space-y-6 ${showPreview ? "flex-1 min-w-0" : "max-w-2xl mx-auto w-full"}`}>
            {/* Title + Destination */}
            <div className="space-y-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name your storyboard…"
                className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none"
                style={{ fontFamily: t.fonts.heading, color: t.colors.text }}
              />
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: t.colors.muted }} />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to?"
                  className="w-full text-base bg-transparent border-none outline-none"
                  style={{ fontFamily: t.fonts.body, color: t.colors.text }}
                />
              </div>
            </div>

            <div style={{ borderTopWidth: 1, borderColor: t.colors.muted + "20" }} />

            {/* Cover Image */}
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: t.colors.muted }}>
                Cover image
              </span>

              {coverImage ? (
                <div className={`relative group overflow-hidden ${t.cardStyle === "rounded" ? "rounded-2xl" : t.cardStyle === "polaroid" ? "bg-white p-2 pb-8 rounded-sm shadow-md" : ""}`}>
                  <img src={coverImage} alt="Cover" className={`w-full aspect-[16/9] object-cover ${t.coverStyle === "framed" ? "rounded-xl" : ""}`} />
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
                <div
                  className="border-2 border-dashed rounded-2xl aspect-[16/9] flex flex-col items-center justify-center gap-4"
                  style={{ borderColor: t.colors.muted + "40" }}
                >
                  <ImagePlus className="h-10 w-10" style={{ color: t.colors.muted }} />
                  <p className="text-sm" style={{ color: t.colors.muted }}>Add a cover image</p>
                  {addSourceButtons(setCoverAddMode, "cover")}
                </div>
              )}
            </div>

            <div style={{ borderTopWidth: 1, borderColor: t.colors.muted + "20" }} />

            {/* Content Blocks */}
            <div className="space-y-3">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: t.colors.muted }}>
                Photos &amp; Content
              </span>

              {blocks.length > 0 && (
                <div className="space-y-4">
                  {blocks.map((block, idx) => (
                    <div key={block.id} className="group relative">
                      <div className={`overflow-hidden ${t.cardStyle === "rounded" ? "rounded-xl" : t.cardStyle === "polaroid" ? "bg-white p-1.5 pb-8 shadow-sm" : ""}`}>
                        <img src={block.imageUrl} alt="" className={`w-full aspect-[4/3] object-cover ${t.cardStyle === "rounded" ? "rounded-xl" : ""}`} />
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
                        placeholder="Add a caption…"
                        className="w-full mt-2 text-sm bg-transparent border-none outline-none"
                        style={{ fontFamily: t.fonts.body, color: t.colors.text }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {addMode ? (
                renderAddOptions(addMode, setAddMode, "block")
              ) : (
                <button
                  onClick={() => setAddMode("upload")}
                  className="w-full border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-3 transition-all hover:opacity-80"
                  style={{ borderColor: t.colors.muted + "40", color: t.colors.muted }}
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-sm font-medium">Add photos</span>
                </button>
              )}

              {!addMode && blocks.length > 0 && (
                <div className="flex justify-center gap-2 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => setAddMode("upload")} className="gap-1.5 text-xs">
                    <Upload className="h-3 w-3" /> Upload
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setUnsplashTarget("block"); setAddMode("unsplash"); }} className="gap-1.5 text-xs">
                    <Search className="h-3 w-3" /> Unsplash
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowDesignEditor(true)} className="gap-1.5 text-xs">
                    <Paintbrush className="h-3 w-3" /> Design
                  </Button>
                </div>
              )}
            </div>

            {/* Bottom publish */}
            {(title.trim() || blocks.length > 0) && (
              <>
                <div style={{ borderTopWidth: 1, borderColor: t.colors.muted + "20" }} />
                <div className="flex justify-end">
                  <Button
                    onClick={handlePublish}
                    disabled={publishing || !title.trim()}
                    size="lg"
                    className="gap-2"
                    style={{ backgroundColor: t.colors.accent, color: t.colors.bg }}
                  >
                    {publishing ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing...</> : "Publish Storyboard"}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Live preview column (desktop) */}
          {showPreview && (
            <div className="hidden md:block w-[340px] flex-shrink-0 sticky top-20 self-start">
              <div className="space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: t.colors.muted }}>
                  Live Preview
                </span>
                <StoryboardLivePreview
                  template={template}
                  title={title}
                  destination={destination}
                  coverImage={coverImage}
                  blocks={blocks}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Design Editor Modal */}
      <DesignEditorModal open={showDesignEditor} onOpenChange={setShowDesignEditor} onExport={handleDesignExport} />
    </div>
  );
}
