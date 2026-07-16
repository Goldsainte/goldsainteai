import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// NewsroomPage — /newsroom: the press-release index (Jul 16).
// ============================================================================

interface Release {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string;
}

export default function NewsroomPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("press_releases" as never)
        .select("id, title, slug, excerpt, published_at")
        .eq("published", true)
        .order("published_at", { ascending: false });
      setReleases((data as unknown as Release[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-24">
      <Helmet><title>Newsroom · Goldsainte</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 pt-16">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8D6B2F]">Newsroom</p>
        <h1 className="mt-3 font-secondary text-5xl leading-tight text-[#0a2225]">News from Goldsainte</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#0a2225]/75">
          Announcements, launches, and press. For media inquiries:{" "}
          <a href="mailto:press@goldsainte.com" className="text-[#0c4d47] underline underline-offset-4">press@goldsainte.com</a>
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C7A962]" />
          </div>
        ) : releases.length === 0 ? (
          <p className="mt-16 text-center text-[#0a2225]/60">Announcements coming soon.</p>
        ) : (
          <div className="mt-12 space-y-6">
            {releases.map((r) => (
              <Link key={r.id} to={`/newsroom/${r.slug}`}
                className="block rounded-3xl border border-[#E5DFC6] bg-white/60 p-7 transition-shadow hover:shadow-[0_8px_28px_rgba(10,34,37,0.08)]">
                <p className="text-[12px] uppercase tracking-[0.14em] text-[#0a2225]/50">
                  {new Date(r.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
                <h2 className="mt-2 font-secondary text-2xl leading-snug text-[#0a2225]">{r.title}</h2>
                {r.excerpt && <p className="mt-2 leading-relaxed text-[#0a2225]/70">{r.excerpt}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
