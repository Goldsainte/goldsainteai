import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Link as LinkIcon, Image, X, Upload, Paintbrush } from "lucide-react";
import { StoryboardPhotoUploader } from "./StoryboardPhotoUploader";
import { LazyDesignEditorModal } from "./LazyDesignEditorModal";

type TripFieldsForInsert = {
  destination?: string;
  departure_city?: string;
  start_date?: string;
  end_date?: string;
  budget_min?: string;
  budget_max?: string;
  budget_level?: string;
  travelers_adults?: string;
  travelers_children?: string;
  occasion?: string;
  accommodation_style?: string;
  pace?: string;
  interests?: string[];
  flexibility?: string;
  special_notes?: string;
  trip_length_days?: string;
  budget_per_person?: boolean;
  must_haves?: string[];
  dealbreakers?: string[];
};

type StoryboardBuilderProps = {
  storyboardId?: string;
  initialTitle?: string;
  mode: "traveler" | "creator" | "agent";
  destination?: string | null;
  tripFields?: TripFieldsForInsert;
  onSaved?: (storyboardId: string) => void;
  saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  addItemRef?: React.MutableRefObject<((item: Item) => void) | null>;
};

type Item = {
  id?: string;
  kind: "photo" | "video" | "note";
  source: "unsplash" | "youtube" | "tiktok" | "instagram" | "manual";
  data: any;
};

type UnsplashPhoto = {
  id: string;
  urls: { small: string; full?: string };
  alt_description: string | null;
  location?: { name?: string | null };
};

export function StoryboardBuilder({
  storyboardId,
  initialTitle,
  mode,
  destination,
  tripFields: tripFieldsProp,
  onSaved,
  saveRef,
  addItemRef,
}: StoryboardBuilderProps) {
  const [title, setTitle] = useState(initialTitle || "");
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<"photos" | "links" | "upload" | "design">("photos");
  const [designEditorOpen, setDesignEditorOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [photoResults, setPhotoResults] = useState<UnsplashPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => { if (saveRef) saveRef.current = saveStoryboard; });
  useEffect(() => { if (addItemRef) addItemRef.current = (item: Item) => setItems(prev => [...prev, item]); });

  useEffect(() => {
    if (!storyboardId) return;
    let cancelled = false;

    async function loadItems() {
      const [itemsResult, sbResult] = await Promise.all([
        supabase.from("storyboard_items").select("*").eq("storyboard_id", storyboardId!).order("position", { ascending: true }),
        supabase.from("storyboards").select("title").eq("id", storyboardId!).single(),
      ]);
      if (cancelled) return;
      if (sbResult.data?.title && !title) setTitle(sbResult.data.title);
      if (itemsResult.error) return;

      const mapped: Item[] = (itemsResult.data || []).map((item: any) => ({
        id: item.id,
        kind: (item.item_type === "image" ? "photo" : item.item_type) as Item["kind"],
        source: (item.source_type || "manual") as Item["source"],
        data: {
          thumb_url: item.image_url,
          full_url: item.image_url,
          alt: item.title || "Storyboard item",
          title: item.title,
          ...((item.metadata as Record<string, any>) || {}),
        },
      }));
      setItems(mapped);
    }

    loadItems();
    return () => { cancelled = true; };
  }, [storyboardId]);

  async function runSearch() {
    if (!search.trim()) return;
    setLoadingSearch(true);
    setSearchError(null);
    try {
      if (activeTab === "photos") {
        const { data, error } = await supabase.functions.invoke("unsplash-search", { body: { q: search } });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setPhotoResults(data?.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(error instanceof Error ? error.message : "Search failed. Please try again.");
    } finally {
      setLoadingSearch(false);
    }
  }

  function addPhoto(p: UnsplashPhoto) {
    setItems(prev => [...prev, {
      kind: "photo", source: "unsplash",
      data: { unsplash_id: p.id, thumb_url: p.urls.small, full_url: p.urls.full || p.urls.small, alt: p.alt_description, location: p.location?.name || null },
    }]);
  }

  function addLink() {
    if (!linkInput.trim()) return;
    const url = linkInput.trim();
    let source: Item["source"] = "manual";
    if (url.includes("tiktok.com")) source = "tiktok";
    else if (url.includes("youtube.com") || url.includes("youtu.be")) source = "youtube";
    else if (url.includes("instagram.com")) source = "instagram";
    setItems(prev => [...prev, { kind: "video", source, data: { url } }]);
    setLinkInput("");
  }

  async function removeItem(index: number) {
    const item = items[index];
    // Delete from DB if saved
    if (item.id) {
      await supabase.from("storyboard_items").delete().eq("id", item.id);
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  async function saveStoryboard() {
    if (!title.trim() || items.length === 0) return;
    setSaving(true);
    try {
      let sbId = storyboardId;
      if (!sbId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          sessionStorage.setItem('goldsainte:pendingStoryboard', JSON.stringify({ title, mode, items: items.map((item, index) => ({ ...item, position: index })) }));
          if (onSaved) onSaved("pending-auth");
          setSaving(false);
          return;
        }
        // Build insert payload, including trip fields if provided
        const insertPayload: Record<string, any> = { owner_id: user.id, role: mode, title };
        if (tripFieldsProp) {
          if (tripFieldsProp.destination) insertPayload.destination = tripFieldsProp.destination;
          if (tripFieldsProp.departure_city) insertPayload.departure_city = tripFieldsProp.departure_city;
          if (tripFieldsProp.start_date) insertPayload.start_date = tripFieldsProp.start_date;
          if (tripFieldsProp.end_date) insertPayload.end_date = tripFieldsProp.end_date;
          if (tripFieldsProp.budget_min) insertPayload.budget_min = parseFloat(tripFieldsProp.budget_min);
          if (tripFieldsProp.budget_max) insertPayload.budget_max = parseFloat(tripFieldsProp.budget_max);
          if (tripFieldsProp.budget_level) insertPayload.budget_level = tripFieldsProp.budget_level;
          if (tripFieldsProp.travelers_adults) insertPayload.travelers_adults = parseInt(tripFieldsProp.travelers_adults);
          if (tripFieldsProp.travelers_children) insertPayload.travelers_children = parseInt(tripFieldsProp.travelers_children);
          if (tripFieldsProp.occasion) insertPayload.occasion = tripFieldsProp.occasion;
          if (tripFieldsProp.accommodation_style) insertPayload.accommodation_style = tripFieldsProp.accommodation_style;
          if (tripFieldsProp.pace) insertPayload.pace = tripFieldsProp.pace;
          if (tripFieldsProp.interests?.length) insertPayload.interests = tripFieldsProp.interests;
          if (tripFieldsProp.flexibility) insertPayload.flexibility = tripFieldsProp.flexibility;
          if (tripFieldsProp.special_notes) insertPayload.special_notes = tripFieldsProp.special_notes;
          if (tripFieldsProp.trip_length_days) insertPayload.trip_length_days = parseInt(tripFieldsProp.trip_length_days);
          if (tripFieldsProp.budget_per_person !== undefined) insertPayload.budget_per_person = tripFieldsProp.budget_per_person;
          if (tripFieldsProp.must_haves?.length) insertPayload.must_haves = tripFieldsProp.must_haves;
          if (tripFieldsProp.dealbreakers?.length) insertPayload.dealbreakers = tripFieldsProp.dealbreakers;
        }
        const { data, error } = await supabase.from("storyboards").insert(insertPayload as any).select("id").single();
        if (error) throw error;
        sbId = data.id;
      }

      const rows = items.map((item, index) => ({
        storyboard_id: sbId,
        item_type: item.kind === "photo" ? "image" : item.kind,
        source_type: item.source,
        position: index,
        image_url: item.kind === "photo" ? item.data.full_url : null,
        title: item.data.title || item.data.alt || null,
        metadata: item.data,
      }));

      const { error: itemsError } = await supabase.from("storyboard_items").insert(rows);
      if (itemsError) throw itemsError;
      if (onSaved && sbId) onSaved(sbId);
    } catch (err) {
      console.error("Error saving storyboard", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[32px] border border-[#E5DFC6] bg-white/95 p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8D8D8D]">Build your storyboard</p>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder={mode === "traveler" ? "Summer in Italy with my best friends" : mode === "creator" ? "Santorini content trip package" : "Safari + wine country honeymoon"}
            className="mt-1 w-full border-b border-[#E5DFC6] bg-transparent text-sm font-display text-[#0a2225] outline-none placeholder:text-[#8D8D8D]" />
        </div>
        <button onClick={saveStoryboard} disabled={saving || !title.trim() || items.length === 0}
          className="inline-flex items-center gap-2 self-start rounded-full bg-[#0c4d47] px-4 py-2 text-xs font-semibold text-[#E5DFC6] hover:bg-[#073331] disabled:opacity-60">
          {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</> : <><Plus className="h-3 w-3" /> Save storyboard</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-2 text-xs flex-wrap">
        <TabButton active={activeTab === "photos"} onClick={() => setActiveTab("photos")}><Image className="h-3 w-3" /> Photos</TabButton>
        <TabButton active={activeTab === "links"} onClick={() => setActiveTab("links")}><LinkIcon className="h-3 w-3" /> TikTok / Reels / YouTube</TabButton>
        <TabButton active={activeTab === "upload"} onClick={() => setActiveTab("upload")}><Upload className="h-3 w-3" /> Upload</TabButton>
        <TabButton active={activeTab === "design"} onClick={() => setActiveTab("design")}><Paintbrush className="h-3 w-3" /> Design</TabButton>
      </div>

      {/* Search bar */}
      {activeTab === "photos" && (
        <div className="mb-4 flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && runSearch()}
            placeholder="Search destinations, hotels, moods…" className="flex-1 rounded-full border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-xs outline-none placeholder:text-[#8D8D8D]" />
          <button onClick={runSearch} disabled={loadingSearch || !search.trim()} className="inline-flex items-center gap-1 rounded-full bg-[#0c4d47] px-4 py-2 text-xs text-[#E5DFC6] disabled:opacity-60">
            {loadingSearch ? <><Loader2 className="h-3 w-3 animate-spin" /> Searching…</> : "Search"}
          </button>
        </div>
      )}

      {searchError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchError}</div>}

      {activeTab === "photos" && (
        <>
          {photoResults.length === 0 && !loadingSearch && search && !searchError && (
            <p className="mb-4 py-8 text-center text-sm text-muted-foreground">No photos found. Try a different search term.</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {photoResults.map(p => (
              <button key={p.id} type="button" onClick={() => addPhoto(p)} className="relative overflow-hidden rounded-2xl group">
                <img src={p.urls.small} alt={p.alt_description || "Photo"} className="h-32 w-full object-cover group-hover:opacity-80" loading="lazy"/>
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                  <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px]">Add to storyboard</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {activeTab === "links" && (
        <div className="mb-4 space-y-2">
          <p className="text-xs text-[#4a4a4a]">Paste any TikTok, Reel or YouTube link that inspired this trip.</p>
          <div className="flex gap-2">
            <input value={linkInput} onChange={e => setLinkInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addLink()}
              placeholder="https://www.tiktok.com/…" className="flex-1 rounded-full border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-xs outline-none placeholder:text-[#8D8D8D]" />
            <button onClick={addLink} disabled={!linkInput.trim()} className="inline-flex items-center gap-1 rounded-full bg-[#0c4d47] px-4 py-2 text-xs text-[#E5DFC6] disabled:opacity-60">Add</button>
          </div>
        </div>
      )}

      {/* Upload tab */}
      {activeTab === "upload" && (
        <div className="mb-4">
          <StoryboardPhotoUploader
            onPhotosUploaded={(urls) => {
              const newItems: Item[] = urls.map((url) => ({
                kind: "photo",
                source: "manual",
                data: { thumb_url: url, full_url: url, alt: "Uploaded photo" },
              }));
              setItems((prev) => [...prev, ...newItems]);
            }}
          />
        </div>
      )}

      {/* Design tab */}
      {activeTab === "design" && (
        <div className="mb-4">
          <button
            onClick={() => setDesignEditorOpen(true)}
            className="w-full border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          >
            <Paintbrush className="h-8 w-8" />
            <span className="text-sm font-medium">Open Design Editor</span>
            <span className="text-xs">Create custom covers, caption cards & visual blocks</span>
          </button>
          <LazyDesignEditorModal
            open={designEditorOpen}
            onOpenChange={setDesignEditorOpen}
            onExport={(url) => {
              setItems((prev) => [
                ...prev,
                {
                  kind: "photo",
                  source: "manual",
                  data: { thumb_url: url, full_url: url, alt: "Designed block" },
                },
              ]);
            }}
          />
        </div>
      )}

      {/* Current items preview */}
      <div className="mt-4 border-t border-[#E5DFC6] pt-3">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#8D8D8D]">Storyboard preview</p>
        {items.length === 0 ? (
          <p className="text-xs text-[#8D8D8D]">Start dropping in photos and links — this becomes the visual brief your travel specialist works from.</p>
        ) : (
          <div className="columns-2 md:columns-3 gap-3 space-y-3">
            {items.map((item, idx) => {
              if (item.kind === "photo") {
                return (
                  <div key={idx} className="relative group break-inside-avoid">
                    <img src={item.data.thumb_url} alt={item.data.alt || "Photo"} className="w-full rounded-2xl object-cover" loading="lazy"/>
                    <button type="button" onClick={() => removeItem(idx)}
                      className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/80">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              }
              if (item.kind === "video") {
                return (
                  <div key={idx} className="relative group break-inside-avoid rounded-2xl bg-[#0a2225] p-2 text-xs text-[#E5DFC6]">
                    <p className="text-[10px] uppercase tracking-[0.14em] mb-1">{item.source.toUpperCase()}</p>
                    <p className="line-clamp-2 break-words">{item.data.url}</p>
                    <button type="button" onClick={() => removeItem(idx)}
                      className="absolute top-1.5 right-1.5 rounded-full bg-white/20 p-1 text-white opacity-0 group-hover:opacity-100 transition hover:bg-white/40">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${active ? "border-[#0c4d47] bg-[#0c4d47] text-[#E5DFC6]" : "border-[#E5DFC6] bg-white text-[#4a4a4a]"} text-xs`}>
      {children}
    </button>
  );
}
