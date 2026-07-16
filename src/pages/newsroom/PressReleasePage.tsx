import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// PressReleasePage — /newsroom/:slug (Jul 16). Same line-aware body format
// as guides: '## ' headings, '- ' bullets, bare image URLs render full-width.
// ============================================================================

const IMG_RE = /^https?:\/\/\S+$/i;

function Body({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let k = 0;
  const flushPara = () => {
    if (para.length) {
      nodes.push(<p key={k++} className="leading-relaxed text-[#0a2225]/90">{para.join(" ")}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      nodes.push(
        <ul key={k++} className="space-y-3">
          {list.map((item, j) => (
            <li key={j} className="flex gap-3 leading-relaxed text-[#0a2225]/90">
              <span className="shrink-0 text-[#8D6B2F]">—</span>
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
      const t = l.replace(/^#{2,3}\s+/, "");
      if (t.length > 90) { flushList(); para.push(t); continue; }
      flushAll();
      nodes.push(
        l.startsWith("## ")
          ? <h2 key={k++} className="pt-4 font-secondary text-3xl text-[#0a2225]">{t}</h2>
          : <h3 key={k++} className="pt-1 font-secondary text-xl text-[#0a2225]">{t}</h3>
      );
      continue;
    }
    if (IMG_RE.test(l)) {
      flushAll();
      nodes.push(<img key={k++} src={l} alt="" loading="lazy" className="max-h-[520px] w-full rounded-2xl object-cover" />);
      continue;
    }
    if (l.startsWith("- ") || l.startsWith("→ ")) { flushPara(); list.push(l.replace(/^(-|→)\s+/, "")); continue; }
    flushList();
    para.push(l);
  }
  flushAll();
  return <div className="space-y-5">{nodes}</div>;
}

interface Release {
  title: string;
  excerpt: string | null;
  hero_image_url: string | null;
  body: string;
  published_at: string;
}

export default function PressReleasePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [r, setR] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("press_releases" as never)
        .select("title, excerpt, hero_image_url, body, published_at")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      setR((data as unknown as Release) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#FDF9F0]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C7A962]" />
      </div>
    );
  }
  if (!r) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FDF9F0] px-4 text-center">
        <h1 className="font-secondary text-4xl text-[#0a2225]">Not found</h1>
        <Link to="/newsroom" className="mt-6 rounded-full bg-[#0c4d47] px-8 py-3.5 text-[14px] text-[#f7f3ea] hover:bg-[#0a2225]">
          Back to Newsroom
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-24">
      <Helmet>
        <title>{r.title + " · Goldsainte Newsroom"}</title>
        {r.excerpt && <meta name="description" content={r.excerpt} />}
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/newsroom"))}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-[#0a2225]/70 hover:text-[#0a2225]">
          <ArrowLeft className="h-4 w-4" /> Newsroom
        </button>
        <p className="mt-8 text-[12px] uppercase tracking-[0.16em] text-[#8D6B2F]">
          {new Date(r.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Newsroom
        </p>
        <h1 className="mt-3 font-secondary text-5xl leading-tight text-[#0a2225]">{r.title}</h1>
        {r.hero_image_url && (
          <img src={r.hero_image_url} alt="" className="mt-8 max-h-[520px] w-full rounded-3xl object-cover" />
        )}
        <div className="mt-10">
          <Body text={r.body} />
        </div>
        <div className="mt-14 rounded-3xl bg-[#0c4d47]/[0.06] p-6 text-center text-[14px] text-[#0a2225]/75">
          Media inquiries:{" "}
          <a href="mailto:press@goldsainte.ai" className="text-[#0c4d47] underline underline-offset-4">press@goldsainte.ai</a>
        </div>
      </div>
    </div>
  );
}
