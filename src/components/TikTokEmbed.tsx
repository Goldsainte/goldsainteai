import { useEffect, useRef } from "react";

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
  return (
    <section className="space-y-4">
      <h2 className="font-secondary text-2xl text-[#0a2225]">Recent Videos</h2>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide">
        {valid.map((url) => (
          <div key={url} className="snap-start">
            <TikTokEmbed url={url} />
          </div>
        ))}
      </div>
    </section>
  );
}