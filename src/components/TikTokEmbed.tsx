import { useEffect, useRef, useState } from "react";
import { Play, ExternalLink } from "lucide-react";

const SCRIPT_SRC = "https://www.tiktok.com/embed.js";

function ensureTikTokScript() {
  if (typeof document === "undefined") return;
  // If already loaded, ask the global to reload embeds
  // @ts-expect-error tiktok global
  if (window.tiktokEmbedLoad) {
    // @ts-expect-error
    window.tiktokEmbedLoad();
    return;
  }
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
  const s = document.createElement("script");
  s.src = SCRIPT_SRC;
  s.async = true;
  document.body.appendChild(s);
}

const TIKTOK_URL_RE = /^https:\/\/(www\.)?tiktok\.com\/@[\w.-]{1,50}\/video\/\d+$/;

export function isSafeTikTokUrl(url: string): boolean {
  return TIKTOK_URL_RE.test(url);
}

export function extractTikTokVideoId(url: string): string | null {
  if (!isSafeTikTokUrl(url)) return null;
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

export function TikTokEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = extractTikTokVideoId(url);
    if (!id || !ref.current) return;

    const blockquote = document.createElement("blockquote");
    blockquote.className = "tiktok-embed";
    blockquote.setAttribute("cite", url);
    blockquote.setAttribute("data-video-id", id);
    blockquote.style.cssText = "max-width:325px;min-width:325px;";
    blockquote.appendChild(document.createElement("section"));
    ref.current.replaceChildren(blockquote);

    ensureTikTokScript();

    // If TikTok hasn't replaced the blockquote with an iframe within 6s,
    // assume the embed was blocked (geo-restricted, rate-limited, offline)
    // and surface a graceful fallback link instead of an empty slot.
    const timer = window.setTimeout(() => {
      if (!ref.current) return;
      const iframe = ref.current.querySelector("iframe");
      if (!iframe) setFailed(true);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [url]);

  if (failed) return <TikTokFallback url={url} />;
  return <div ref={ref} className="shrink-0" />;
}

function TikTokFallback({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="snap-start shrink-0 flex flex-col items-center justify-center gap-3 bg-[#0a2225] text-white/90 rounded-md p-6 text-center"
      style={{ width: 325, height: 575 }}
    >
      <Play className="h-10 w-10 opacity-70" />
      <p className="font-secondary text-lg">Watch on TikTok</p>
      <p className="text-xs text-white/60 max-w-[240px]">
        This video can't be embedded right now — open it on TikTok to watch.
      </p>
      <span className="inline-flex items-center gap-1 text-xs text-[#C7A962]">
        Open <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

export function TikTokCarousel({ urls }: { urls: string[] }) {
  const valid = urls.filter((u) => extractTikTokVideoId(u));
  if (valid.length === 0) return null;
  return <LazyTikTokCarousel urls={valid} />;
}

function LazyTikTokCarousel({ urls }: { urls: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = containerRef.current;
    if (!el) return;

    // Bail out if IntersectionObserver isn't available (very old browsers)
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <section ref={containerRef} className="space-y-4">
      <h2 className="font-secondary text-2xl text-[#0a2225]">Recent Videos</h2>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide">
        {urls.map((url) =>
          visible ? (
            <div key={url} className="snap-start">
              <TikTokEmbed url={url} />
            </div>
          ) : (
            <TikTokPlaceholder key={url} url={url} />
          )
        )}
      </div>
    </section>
  );
}

function TikTokPlaceholder({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="snap-start shrink-0 flex items-center justify-center bg-[#0a2225] text-white/90 rounded-md"
      style={{ width: 325, height: 575 }}
      aria-label="Loading TikTok video"
    >
      <Play className="h-12 w-12 opacity-70" />
    </a>
  );
}