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

export function extractTikTokVideoId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

export function TikTokEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = extractTikTokVideoId(url);
    if (!id || !ref.current) return;
    ref.current.innerHTML = `
      <blockquote class="tiktok-embed" cite="${url}" data-video-id="${id}" style="max-width:325px;min-width:325px;">
        <section></section>
      </blockquote>
    `;
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