import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

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
  }, [url]);
  return <div ref={ref} className="shrink-0" />;
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