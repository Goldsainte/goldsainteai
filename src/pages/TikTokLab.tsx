import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type TripStory = {
  id: string;
  title: string;
  hook: string;
  caption: string;
  hero_image_url: string;
  platforms: string[];
  created_at: string;
  status: string;
};

export default function TikTokLab() {
  const { toast } = useToast();
  const [stories, setStories] = useState<TripStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Composer state
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [caption, setCaption] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [itinerary, setItinerary] = useState("");
  const [isConnectingTikTok, setIsConnectingTikTok] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    try {
      const { data, error } = await supabase
        .from('trip_stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnectTikTok() {
    setIsConnectingTikTok(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "tiktok-oauth-start",
        { body: {} }
      );

      if (error) {
        console.error(error);
        toast({
          title: "Connection Failed",
          description: error.message || "Could not start TikTok connection. Try again.",
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.authorizeUrl) {
        toast({
          title: "Error",
          description: "Unexpected response from TikTok connection. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      window.location.href = data.authorizeUrl;
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: "Unexpected error while connecting TikTok.",
        variant: "destructive",
      });
    } finally {
      setIsConnectingTikTok(false);
    }
  }

  async function handlePublishStory() {
    if (!title || !caption) {
      toast({
        title: "Missing Information",
        description: "Please add at least a title and caption.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);

    try {
      const payload = {
        title,
        hook,
        caption,
        heroImageUrl,
        itineraryLines: itinerary
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        postToTikTok: true,
      };

      const { data, error } = await supabase.functions.invoke(
        "publish-trip-story",
        { body: payload }
      );

      if (error) {
        console.error(error);
        toast({
          title: "Publishing Failed",
          description: error.message || "Something went wrong while publishing your TikTok story.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Story Queued!",
          description: data.message || "Your story has been queued to publish to TikTok.",
        });

        // Reset form
        setTitle("");
        setHook("");
        setCaption("");
        setHeroImageUrl("");
        setItinerary("");

        // Reload stories
        loadStories();
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: "Unexpected error while publishing story.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
        {/* HEADER */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              TikTok Travel Lab
            </h1>
            <p className="mt-1 max-w-xl text-sm text-neutral-600">
              Build TikTok-ready travel stories, connect your TikTok, and link
              every video to a bookable Goldsainte trip.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConnectTikTok}
            disabled={isConnectingTikTok}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isConnectingTikTok ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect TikTok"
            )}
          </button>
        </header>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* LEFT: Story Composer */}
          <section className="w-full md:w-2/3">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/80">
              <h2 className="text-sm font-semibold text-neutral-900">
                Create a TikTok Trip Story
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Think of this as your TikTok script + caption builder for a
                specific trip or offer.
              </p>

              <div className="mt-3 space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-neutral-700">
                    Trip title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Santorini Honeymoon Escape"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-neutral-700">
                    Hook (first line / on-screen text)
                  </label>
                  <input
                    type="text"
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    placeholder="POV: You wake up in a cave suite in Santorini 🌅"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-neutral-700">
                    Caption
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    placeholder="Tell the story, what's included, who this is for, and how to book. Add a CTA like: 'Link in bio to book this exact trip.'"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-neutral-700">
                    Optional: Thumbnail / hero image URL
                  </label>
                  <input
                    type="text"
                    value={heroImageUrl}
                    onChange={(e) => setHeroImageUrl(e.target.value)}
                    placeholder="https://images.pexels.com/photos/..."
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-neutral-500">
                    This doesn't upload media yet; it's for previews & linking a
                    trip cover image.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-neutral-700">
                    Optional: Itinerary bullets (one per line)
                  </label>
                  <textarea
                    value={itinerary}
                    onChange={(e) => setItinerary(e.target.value)}
                    rows={3}
                    placeholder={`Day 1 – Arrival & sunset dinner\nDay 3 – Private catamaran cruise\nDay 5 – Wine tasting & village tour`}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handlePublishStory}
                    disabled={isPublishing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      "Publish TikTok Story"
                    )}
                  </button>
                  <p className="mt-2 text-[11px] text-neutral-500">
                    We'll send this story payload to your connected TikTok
                    account via our backend (or save it for posting).
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Recent Stories */}
          <aside className="w-full space-y-4 md:w-1/3">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/80">
              <h2 className="text-sm font-semibold text-neutral-900">
                Recent TikTok Trip Stories
              </h2>
              <p className="mt-1 text-[11px] text-neutral-500">
                A quick view of what you've pushed to TikTok from Goldsainte.
              </p>

              <div className="mt-3 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                  </div>
                ) : stories.length === 0 ? (
                  <div className="rounded-xl bg-neutral-50 px-3 py-2 text-[11px] text-neutral-500">
                    You haven't published any trip stories yet.
                  </div>
                ) : (
                  stories.map((story) => (
                    <TripStoryCard key={story.id} story={story} />
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TripStoryCard({ story }: { story: TripStory }) {
  return (
    <article className="flex gap-3 rounded-xl bg-neutral-50 p-2">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-200">
        {story.hero_image_url ? (
          <img
            src={story.hero_image_url}
            alt={story.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <h3 className="line-clamp-1 text-xs font-semibold text-neutral-900">
          {story.title}
        </h3>
        {story.hook && (
          <p className="line-clamp-1 text-[11px] text-neutral-600">
            {story.hook}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {story.platforms.map((p) => (
            <span
              key={p}
              className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-700"
            >
              {p}
            </span>
          ))}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            story.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
            story.status === 'queued' ? 'bg-amber-100 text-amber-700' :
            story.status === 'failed' ? 'bg-red-100 text-red-700' :
            'bg-neutral-100 text-neutral-600'
          }`}>
            {story.status}
          </span>
        </div>
        <span className="mt-1 text-[10px] text-neutral-400">
          {new Date(story.created_at).toLocaleDateString()}
        </span>
      </div>
    </article>
  );
}
