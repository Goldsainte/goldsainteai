import { useEffect, useState } from "react";
import { Plus, Trash2, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { extractTikTokVideoId } from "@/components/TikTokEmbed";

const MAX_VIDEOS = 6;

export function FeaturedTikTokManager({ userId }: { userId: string }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("featured_tiktok_videos")
        .eq("id", userId)
        .maybeSingle();
      const arr = Array.isArray(data?.featured_tiktok_videos)
        ? (data!.featured_tiktok_videos as any[]).filter((u): u is string => typeof u === "string")
        : [];
      setUrls(arr);
      setLoading(false);
    })();
  }, [userId]);

  const persist = async (next: string[]) => {
    const { error } = await supabase
      .from("profiles")
      .update({ featured_tiktok_videos: next as any })
      .eq("id", userId);
    if (error) {
      toast.error("Could not save videos");
      return false;
    }
    return true;
  };

  const addUrl = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (!extractTikTokVideoId(trimmed)) {
      toast.error("Paste a TikTok video URL like https://www.tiktok.com/@user/video/1234567890");
      return;
    }
    if (urls.length >= MAX_VIDEOS) {
      toast.error(`Maximum ${MAX_VIDEOS} videos`);
      return;
    }
    if (urls.includes(trimmed)) {
      toast.error("Already added");
      return;
    }
    const next = [...urls, trimmed];
    if (await persist(next)) {
      setUrls(next);
      setDraft("");
      toast.success("Video added");
    }
  };

  const removeUrl = async (url: string) => {
    const next = urls.filter((u) => u !== url);
    if (await persist(next)) {
      setUrls(next);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-[#0a2225]">Featured TikTok Videos ({urls.length}/{MAX_VIDEOS})</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://www.tiktok.com/@user/video/123..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={urls.length >= MAX_VIDEOS}
          className="inline-flex items-center gap-1 rounded-full bg-[#0c4d47] px-4 py-2 text-sm text-white disabled:opacity-40 hover:bg-[#0a3d39]"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      {urls.length === 0 ? (
        <p className="text-xs text-[#6B7280]">Add up to 6 TikTok videos to feature on your profile.</p>
      ) : (
        <ul className="space-y-2">
          {urls.map((url) => (
            <li
              key={url}
              className="flex items-center justify-between gap-2 rounded-lg border border-[#E5DFC6] bg-white px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 text-[#0a2225]">
                <Video className="h-4 w-4 shrink-0 text-[#0c4d47]" />
                <span className="truncate">{url}</span>
              </span>
              <button
                type="button"
                onClick={() => removeUrl(url)}
                aria-label="Remove"
                className="rounded-full p-1 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}