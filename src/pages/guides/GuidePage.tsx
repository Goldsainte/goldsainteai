import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PenLine } from "lucide-react";

// ============================================================================
// GuidePage — public editorial guide, 1:1 with Fora's guide pages (verified
// from the founder's Ligurian Love Story screenshots): serif hero title +
// bordered uppercase tags + hero image; "Curated by" byline; CURATOR'S
// STATEMENT between hairlines; markdown-lite body (## sections, → bullets,
// bare image URLs become full-width photos); "The Goldsainte Difference"
// band; sticky right rail with the author's card + contact CTA all the way
// down. Route: /guides/:slug
// ============================================================================

interface GuideHotel {
  name: string;
  description: string;
  perks: string[];
}

interface Guide {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  hero_image_url: string | null;
  tags: string[];
  statement: string | null;
  body: string | null;
  hotels: GuideHotel[];
}

const IMG_RE = /^https?:\/\/\S+$/i;

// Line-aware renderer — immune to the whitespace quirks of AI-written or
// hand-pasted bodies: headings, arrow bullets, bare-URL photos, and
// paragraphs are recognized PER LINE, never merged by missing blank lines.
function Body({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let k = 0;
  const flushPara = () => {
    if (para.length) {
      nodes.push(
        <p key={k++} className="leading-relaxed text-[#0a2225]">{para.join(" ")}</p>
      );
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      nodes.push(
        <ul key={k++} className="space-y-4">
          {list.map((item, j) => (
            <li key={j} className="flex gap-3 leading-relaxed text-[#0a2225]">
              <span className="shrink-0 text-[#0a2225]">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      list = [];
    }
  };
  const flushAll = () => { flushList(); flushPara(); };

  for (const raw of text.split("\n")) {
    const l = raw.trim();
    if (!l) { flushAll(); continue; }
    if (l.startsWith("## ") || l.startsWith("### ")) {
      const text = l.replace(/^#{2,3}\s+/, "");
      // Guard: a "heading" longer than ~90 chars is body text wearing a
      // heading marker (AI run-ons) — render it as a paragraph instead of
      // supersizing a whole section.
      if (text.length > 90) {
        flushList();
        para.push(text);
        continue;
      }
      flushAll();
      if (l.startsWith("## ")) {
        nodes.push(<h2 key={k++} className="pt-6 font-secondary text-3xl md:text-4xl text-[#0a2225]">{text}</h2>);
      } else {
        nodes.push(<h3 key={k++} className="pt-2 font-secondary text-2xl text-[#0a2225]">{text}</h3>);
      }
      continue;
    }
    if (IMG_RE.test(l)) {
      flushAll();
      nodes.push(
        <img key={k++} src={l} alt="" loading="lazy" className="max-h-[560px] w-full rounded-2xl object-cover" />
      );
      continue;
    }
    if (l.startsWith("- ") || l.startsWith("→ ")) {
      flushPara();
      list.push(l.replace(/^(-|→)\s+/, ""));
      continue;
    }
    flushList();
    para.push(l);
  }
  flushAll();
  return <div className="space-y-6">{nodes}</div>;
}

function WhereToStay({ hotels, place }: { hotels: GuideHotel[]; place?: string | null }) {
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) =>
    rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.85, behavior: "smooth" });
  if (!hotels || hotels.length === 0) return null;
  return (
    <section className="py-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-secondary text-3xl md:text-4xl text-[#0a2225]">
          Where to stay{place ? ` in ${place}` : ""}
        </h2>
        {hotels.length > 2 && (
          <div className="flex gap-3">
            <button type="button" aria-label="Previous hotels" onClick={() => scroll(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0a2225]/30 text-[#0a2225] hover:bg-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="More hotels" onClick={() => scroll(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0a2225]/30 text-[#0a2225] hover:bg-white">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      <div ref={rail} className="mt-8 flex snap-x gap-10 overflow-x-auto pb-4">
        {hotels.map((h, i) => (
          <article key={i} className="min-w-[85%] snap-start sm:min-w-[46%] lg:min-w-[30%]">
            <h3 className="font-secondary text-2xl leading-snug text-[#0a2225]">{h.name}</h3>
            {h.description && (
              <p className="mt-3 leading-relaxed text-[#0a2225]/85">{h.description}</p>
            )}
            {h.perks && h.perks.length > 0 && (
              <>
                <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0a2225]">
                  Goldsainte perks
                </p>
                <ul className="mt-3 space-y-2.5">
                  {h.perks.map((perk, j) => (
                    <li key={j} className="flex gap-2.5 leading-relaxed text-[#0a2225]">
                      <Star className="mt-1 h-4 w-4 shrink-0 fill-[#0a2225] text-[#0a2225]" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function GuidePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [author, setAuthor] = useState<{ name: string; businessName: string | null; avatarUrl: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: g } = await supabase
          .from("partner_guides")
          .select("id, author_id, title, slug, hero_image_url, tags, statement, body, hotels")
          .eq("slug", slug)
          .maybeSingle();
        if (cancelled) return;
        setGuide((g as Guide) ?? null);
        if (g) {
          // Retention metric: count the view (fire-and-forget; RPC only
          // increments published guides, viewers can't touch the table).
          supabase.rpc("increment_guide_view" as never, { guide_slug: slug } as never).then(() => {});
          const [{ data: p }, { data: a }] = await Promise.all([
            supabase.from("public_profiles" as unknown as "profiles").select("display_name, full_name, avatar_url").eq("id", g.author_id).maybeSingle(),
            supabase.from("public_travel_agents" as unknown as "travel_agents").select("agency_name").eq("user_id", g.author_id).maybeSingle(),
          ]);
          if (cancelled) return;
          setAuthor({
            name: p?.display_name || p?.full_name || "Goldsainte Specialist",
            businessName: a?.agency_name ?? null,
            avatarUrl: p?.avatar_url ?? null,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#FDF9F0]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C7A962]" />
      </div>
    );

  if (!guide)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FDF9F0] px-4 text-center">
        <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225]">Guide not found</h1>
        <button type="button" onClick={() => navigate("/agents")}
          className="mt-8 rounded-full bg-[#0c4d47] px-8 py-3.5 text-[14px] text-[#f7f3ea] hover:bg-[#0a2225]">
          Browse specialists
        </button>
      </div>
    );

  const displayAs = author?.businessName || author?.name || "your specialist";
  const contact = () => navigate(`/post-trip?agentId=${guide.author_id}&agentName=${encodeURIComponent(displayAs)}`);

  const AuthorRail = (
    <div className="rounded-2xl bg-[#F0EADA]/80 p-7">
      <div className="flex items-center gap-4">
        {author?.avatarUrl ? (
          <img src={author.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0c4d47] font-secondary text-lg text-[#E5DFC6]">
            {displayAs.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-[#0a2225]/70">Travel specialist</p>
          <p className="font-secondary text-2xl text-[#0a2225]">{displayAs}</p>
        </div>
      </div>
      <p className="mt-5 leading-relaxed text-[#0a2225]/85">
        Let's talk about customizing this itinerary for you. Or, about other destinations.
      </p>
      <button type="button" onClick={contact}
        className="mt-6 w-full rounded-lg bg-[#0a2225] px-6 py-4 text-[13px] font-medium uppercase tracking-[0.14em] text-[#f7f3ea] hover:bg-[#0c4d47]">
        Contact {displayAs}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-24">
      <Helmet><title>{guide.title + " · Goldsainte"}</title></Helmet>

      {/* Hero */}
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 lg:grid-cols-2">
        <div>
          <h1 className="font-secondary text-5xl leading-tight text-[#0a2225] md:text-6xl">{guide.title}</h1>
          {guide.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {guide.tags.map((t) => (
                <span key={t} className="border border-[#0a2225]/40 px-4 py-2 text-[12px] uppercase tracking-[0.12em] text-[#0a2225]">
                  {t}
                </span>
              ))}
            </div>
          )}
          {user?.id === guide.author_id && (
            <button
              type="button"
              onClick={() => navigate("/agent-guides")}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#0a2225]/30 px-5 py-2.5 text-[13px] font-medium text-[#0a2225] transition-colors hover:bg-white"
            >
              <PenLine className="h-4 w-4" /> Edit this guide
            </button>
          )}
          <div className="mt-10 flex items-center gap-4">
            {author?.avatarUrl ? (
              <img src={author.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0c4d47] font-secondary text-xl text-[#E5DFC6]">
                {displayAs.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <p className="font-secondary italic text-[15px] text-[#0a2225]/70">Curated By</p>
              <p className="font-secondary text-2xl text-[#0a2225]">{displayAs}</p>
            </div>
          </div>
        </div>
        {guide.hero_image_url && (
          <img src={guide.hero_image_url} alt="" className="max-h-[520px] w-full rounded-2xl object-cover" />
        )}
      </div>

      {/* Body + sticky rail */}
      <div className="mx-auto mt-16 grid max-w-6xl gap-10 px-4 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {guide.statement && (
            <section className="border-y border-[#0a2225]/15 py-10">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0a2225]">Curator's statement</h2>
              <p className="mt-6 text-[19px] leading-relaxed text-[#0a2225]/85">{guide.statement}</p>
            </section>
          )}

          {/* The Goldsainte Difference */}
          <section className="py-14 text-center">
            <h2 className="font-secondary text-4xl md:text-5xl text-[#0a2225]">The Goldsainte Difference</h2>
            <p className="mx-auto mt-5 max-w-xl text-[17px] text-[#0a2225]/75">
              Book with {displayAs} for a trip that's verified, personal, and secure.
            </p>
            <div className="mt-12 grid gap-10 sm:grid-cols-3">
              {[
                ["Verified specialists", "Every specialist is vetted by Goldsainte"],
                ["Personalized plans", "Travel designed around your style"],
                ["Secure booking", "Funds held in escrow until you confirm"],
              ].map(([t, d]) => (
                <div key={t}>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0a2225]">{t}</p>
                  <p className="mt-3 font-secondary italic text-[16px] leading-relaxed text-[#0a2225]/75">{d}</p>
                </div>
              ))}
            </div>
          </section>

          <WhereToStay hotels={guide.hotels ?? []} place={guide.tags?.[0]} />

          {guide.body && <Body text={guide.body} />}

          {/* Bottom contact band */}
          <section className="mt-16 rounded-2xl bg-[#F0EADA]/80 px-6 py-14 text-center">
            <p className="mx-auto max-w-xl font-secondary text-3xl leading-snug text-[#0a2225]">
              Unlock a seamless trip by contacting {displayAs} to book.
            </p>
            <button type="button" onClick={contact}
              className="mt-8 rounded-lg bg-[#0a2225] px-8 py-4 text-[13px] font-medium uppercase tracking-[0.14em] text-[#f7f3ea] hover:bg-[#0c4d47]">
              Contact {displayAs}
            </button>
          </section>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">{AuthorRail}</div>
      </div>
    </div>
  );
}
