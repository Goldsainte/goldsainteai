import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoryboardPhotoUploader } from "@/components/storyboards/StoryboardPhotoUploader";
import { LazyDesignEditorModal } from "@/components/storyboards/LazyDesignEditorModal";
import { TemplatePicker } from "@/components/storyboards/TemplatePicker";
import { StoryboardLivePreview } from "@/components/storyboards/StoryboardLivePreview";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { STORYBOARD_TEMPLATES } from "@/lib/storyboard-templates";
import type { StoryboardTemplate } from "@/lib/storyboard-templates";
import {
  ArrowLeft,
  ImagePlus,
  Paintbrush,
  Loader2,
  MapPin,
  X,
  Upload,
  Search,
  Eye,
  EyeOff,
  Palette,
  Check,
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
  const [showPreview, setShowPreview] = useState(true);

  // Font & color overrides
  const [fontOverrideId, setFontOverrideId] = useState<string | null>(null);
  const [colorOverride, setColorOverride] = useState<{
    bg?: string;
    text?: string;
    accent?: string;
    muted?: string;
  } | null>(null);

  // Unsplash
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);
  const [unsplashTarget, setUnsplashTarget] = useState<"cover" | "block">("block");

  // Effective template with overrides
  const t = useMemo(() => {
    if (!template) return null;
    const fontSource = fontOverrideId
      ? STORYBOARD_TEMPLATES.find((tmpl) => tmpl.id === fontOverrideId)
      : null;
    return {
      ...template,
      fonts: fontSource ? fontSource.fonts : template.fonts,
      fontImport: fontSource ? fontSource.fontImport : template.fontImport,
      colors: colorOverride
        ? { ...template.colors, ...colorOverride }
        : template.colors,
    };
  }, [template, fontOverrideId, colorOverride]);

  // Load template fonts
  useEffect(() => {
    if (!t) return;
    const id = "sb-font-" + t.id + (fontOverrideId || "");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = t.fontImport;
    document.head.appendChild(link);
  }, [t, fontOverrideId]);

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
      if (!user) {
        toast.error("Please sign in to publish");
        navigate("/auth");
        return;
      }

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
  if (!template || !t) {
    return <TemplatePicker onSelect={setTemplate} />;
  }

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

  // ── Inline add panel ──
  const renderAddOptions = (mode: AddMode, setMode: (m: AddMode) => void, target: "cover" | "block") => {
    if (!mode) return null;
    return (
      <div className="border rounded-xl p-4 space-y-3" style={{ borderColor: t.colors.muted + "30", backgroundColor: t.colors.bg }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: t.colors.text, fontFamily: t.fonts.body }}>
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

  // ── 3-source buttons (always visible) ──
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
          className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:opacity-80"
          style={{ borderColor: t.colors.muted + "30", color: t.colors.text, fontFamily: t.fonts.body }}
        >
          <Icon className="h-5 w-5" style={{ color: t.colors.accent }} />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );

  // Cover class based on coverStyle
  const coverWrapClass =
    t.coverStyle === "framed"
      ? "p-3 rounded-2xl"
      : t.coverStyle === "split"
      ? "relative"
      : "";
  const coverImgClass =
    t.coverStyle === "framed"
      ? "rounded-xl"
      : t.coverStyle === "split"
      ? ""
      : "";

  // Card class based on cardStyle
  const cardWrapClass = (idx: number) =>
    t.cardStyle === "polaroid"
      ? `bg-white p-2 pb-10 shadow-md ${idx % 2 === 0 ? "rotate-[0.5deg]" : "-rotate-[0.5deg]"}`
      : t.cardStyle === "rounded"
      ? "rounded-xl overflow-hidden"
      : "";

  // Color presets for customization
  const colorPresets = [
    { label: "Warm Gold", bg: "#FDF9F0", text: "#0a2225", accent: "#C7A962", muted: "#8D8D8D" },
    { label: "Cool Blue", bg: "#FAFAFA", text: "#1a1a1a", accent: "#4A90A4", muted: "#999999" },
    { label: "Earth Tone", bg: "#F5F1EB", text: "#1C1C1C", accent: "#9B6B3D", muted: "#7A7A7A" },
    { label: "Dark Mode", bg: "#0F0F0F", text: "#F5F5F5", accent: "#E8C547", muted: "#666666" },
    { label: "Forest", bg: "#F0F7F2", text: "#1B3A2D", accent: "#2D8B5E", muted: "#7BA68C" },
    { label: "Monochrome", bg: "#F2F0ED", text: "#2C2C2C", accent: "#5C5C5C", muted: "#A0A0A0" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.colors.bg }}>
      {/* ── Top bar ── */}
      <div
        className="sticky top-0 z-30 backdrop-blur border-b"
        style={{ backgroundColor: t.colors.bg + "E6", borderColor: t.colors.muted + "25" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTemplate(null)}
              className="flex items-center gap-1.5 transition-colors hover:opacity-70"
              style={{ color: t.colors.muted }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Templates</span>
            </button>
            <span
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{ borderColor: t.colors.accent, color: t.colors.accent, fontFamily: t.fonts.body }}
            >
              {t.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Font & Color customization */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  style={{ color: t.colors.text }}
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Customize</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-4" align="end">
                {/* Font Pairing */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Font Pairing</p>
                  <div className="grid gap-1.5">
                    {STORYBOARD_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        onClick={() => setFontOverrideId(tmpl.id === (fontOverrideId || template.id) ? null : tmpl.id)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors hover:bg-accent/10"
                        style={{
                          backgroundColor: tmpl.id === (fontOverrideId || template.id) ? t.colors.accent + "15" : undefined,
                        }}
                      >
                        <div>
                          <span className="text-sm font-medium" style={{ fontFamily: tmpl.fonts.heading }}>
                            {tmpl.name}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2" style={{ fontFamily: tmpl.fonts.body }}>
                            Aa Bb Cc
                          </span>
                        </div>
                        {tmpl.id === (fontOverrideId || template.id) && (
                          <Check className="h-3.5 w-3.5" style={{ color: t.colors.accent }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Palette */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color Palette</p>
                  <div className="grid grid-cols-3 gap-2">
                    {colorPresets.map((preset) => {
                      const isActive =
                        (colorOverride?.accent === preset.accent) ||
                        (!colorOverride && template.colors.accent === preset.accent);
                      return (
                        <button
                          key={preset.label}
                          onClick={() =>
                            setColorOverride(
                              template.colors.accent === preset.accent ? null : preset
                            )
                          }
                          className="flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors hover:bg-accent/10"
                          style={{ backgroundColor: isActive ? t.colors.accent + "15" : undefined }}
                        >
                          <div className="flex gap-0.5">
                            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: preset.bg, borderColor: preset.muted + "40" }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.text }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Preview toggle (visible everywhere) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-1.5 text-xs"
              style={{ color: t.colors.text }}
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{showPreview ? "Hide Preview" : "Preview"}</span>
            </Button>

            {/* Publish */}
            <div className="flex items-center gap-2">
              {!title.trim() && (
                <span className="text-[10px] text-muted-foreground">Add a title first</span>
              )}
              <Button
                type="button"
                onClick={handlePublish}
                disabled={publishing || !title.trim()}
                size="sm"
                className="gap-1.5"
                style={{ backgroundColor: t.colors.accent, color: t.colors.bg }}
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
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Editor column */}
          <div className={`space-y-6 ${showPreview ? "flex-1 min-w-0" : "max-w-2xl mx-auto w-full"}`}>
            {/* Title + Destination */}
            <div className="space-y-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name your storyboard…"
                className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none placeholder:opacity-30"
                style={{ fontFamily: t.fonts.heading, color: t.colors.text }}
              />
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: t.colors.muted }} />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to?"
                  className="w-full text-base bg-transparent border-none outline-none placeholder:opacity-30"
                  style={{ fontFamily: t.fonts.body, color: t.colors.text }}
                />
              </div>
            </div>

            {/* Accent divider */}
            <div className="h-px w-16" style={{ backgroundColor: t.colors.accent }} />

            {/* Cover Image */}
            <div className="space-y-3">
              <span
                className="text-[11px] font-medium uppercase tracking-widest"
                style={{ color: t.colors.muted, fontFamily: t.fonts.body }}
              >
                Cover image
              </span>

              {coverImage ? (
                <div className={`relative group overflow-hidden ${coverWrapClass}`} style={t.coverStyle === "framed" ? { backgroundColor: t.colors.muted + "10" } : undefined}>
                  <img
                    src={coverImage}
                    alt="Cover"
                    className={`w-full aspect-[16/9] object-cover ${coverImgClass}`}
                  loading="lazy"/>
                  {t.coverStyle === "split" && title && (
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
                      <h2 className="text-white text-xl font-bold" style={{ fontFamily: t.fonts.heading }}>
                        {title}
                      </h2>
                    </div>
                  )}
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
                  <ImagePlus className="h-10 w-10" style={{ color: t.colors.muted + "60" }} />
                  <p className="text-sm" style={{ color: t.colors.muted, fontFamily: t.fonts.body }}>
                    Add a cover image
                  </p>
                  {addSourceButtons(setCoverAddMode, "cover")}
                </div>
              )}
            </div>

            {/* Accent divider */}
            <div className="h-px w-16" style={{ backgroundColor: t.colors.accent }} />

            {/* Content Blocks */}
            <div className="space-y-4">
              <span
                className="text-[11px] font-medium uppercase tracking-widest"
                style={{ color: t.colors.muted, fontFamily: t.fonts.body }}
              >
                Photos & Content
              </span>

              {blocks.length > 0 && (
                <div className="space-y-5">
                  {blocks.map((block, idx) => (
                    <div key={block.id} className="group relative">
                      <div className={cardWrapClass(idx)}>
                        <img
                          src={block.imageUrl}
                          alt=""
                          className={`w-full aspect-[4/3] object-cover ${t.cardStyle === "rounded" ? "rounded-xl" : ""}`}
                        loading="lazy"/>
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
                        className="w-full mt-2 text-sm bg-transparent border-none outline-none placeholder:opacity-30"
                        style={{ fontFamily: t.fonts.body, color: t.colors.text }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Always show 3 source buttons when no add panel is open */}
              {addMode ? (
                renderAddOptions(addMode, setAddMode, "block")
              ) : (
                addSourceButtons(setAddMode, "block")
              )}
            </div>

            {/* ── Bottom publish section ── */}
            <div className="h-px w-full" style={{ backgroundColor: t.colors.muted + "20" }} />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: t.colors.muted, fontFamily: t.fonts.body }}>
                {blocks.length} photo{blocks.length !== 1 ? "s" : ""} · {t.name} template
              </span>
              <Button
                type="button"
                onClick={handlePublish}
                disabled={publishing || !title.trim()}
                size="lg"
                className="gap-2"
                style={{ backgroundColor: t.colors.accent, color: t.colors.bg }}
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  "Publish Storyboard"
                )}
              </Button>
            </div>
          </div>

          {/* ── Live preview column (desktop side, mobile below) ── */}
          {showPreview && (
            <div className="w-full md:w-[360px] md:flex-shrink-0 md:sticky md:top-20 md:self-start">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-medium uppercase tracking-widest"
                    style={{ color: t.colors.muted, fontFamily: t.fonts.body }}
                  >
                    Live Preview
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: t.colors.accent + "15", color: t.colors.accent, fontFamily: t.fonts.body }}
                  >
                    {t.layout}
                  </span>
                </div>
                <StoryboardLivePreview
                  template={t}
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
      <LazyDesignEditorModal open={showDesignEditor} onOpenChange={setShowDesignEditor} onExport={handleDesignExport} />
    </div>
  );
}
