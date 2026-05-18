import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { fetchAuthors, BASE_URL } from "./lib";

const FOUNDER_BACKGROUND = [
  {
    label: "Luxury Transportation",
    body: "Built Goldsainte's original luxury transportation platform and expanded the model into 350+ cities across 50+ countries.",
  },
  {
    label: "Marketplace Evolution",
    body: "Identified the gap between travel inspiration, planning, and booking — leading to Goldsainte's evolution into a global AI travel marketplace.",
  },
  {
    label: "Operational Leadership",
    body: "Brings experience across hospitality, franchise operations, consumer service platforms, and technology-enabled growth.",
  },
];

export default function Leadership() {
  const { data: authors = [] } = useQuery({
    queryKey: ["newsroom", "authors"],
    queryFn: fetchAuthors,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <>
      <Helmet>
        <title>Leadership | Goldsainte Newsroom</title>
        <meta name="description" content="Meet the founders and leadership team behind Goldsainte." />
        <link rel="canonical" href={`${BASE_URL}/newsroom/leadership`} />
      </Helmet>
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 space-y-20 md:space-y-24">
        {/* Intro */}
        <header className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-4">Leadership</p>
          <h1 className="font-secondary text-2xl md:text-3xl leading-tight mb-5">
            Goldsainte is led by founder and CEO Andre C. Powell, Jr.
          </h1>
          <p className="text-base text-[#0a2225]/75 leading-relaxed">
            His background spans luxury transportation, consumer marketplaces, franchise operations,
            and AI-enabled travel technology.
          </p>
        </header>

        {/* Founder profile */}
        {authors.map((a) => (
          <article
            key={a.id}
            id={a.slug}
            className="grid md:grid-cols-[280px_1fr] gap-10 md:gap-14 pt-12 border-t border-[#E5DFC6]"
          >
            <div className="md:sticky md:top-32 self-start">
              {a.avatar_url ? (
                <img
                  src={a.avatar_url}
                  alt={a.full_name}
                  className="w-full aspect-[4/5] object-cover rounded-sm border border-[#E5DFC6] shadow-[0_20px_50px_-20px_rgba(10,34,37,0.25)]"
                />
              ) : (
                <div className="w-full aspect-[4/5] bg-[#F6F0E4] rounded-sm border border-[#E5DFC6]" />
              )}
              {a.linkedin_url && (
                <a
                  href={a.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-[0.25em] text-[#0c4d47] hover:underline mt-5 inline-block"
                >
                  LinkedIn →
                </a>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-3">{a.title}</p>
              <h2 className="font-secondary text-2xl md:text-3xl leading-tight">{a.full_name}</h2>
              {a.quote && (
                <blockquote className="font-secondary text-lg md:text-xl italic text-[#0a2225]/85 border-l-2 border-[#C7A962] pl-5 my-7 leading-snug">
                  "{a.quote}"
                </blockquote>
              )}
              <div className="space-y-5 text-base text-[#0a2225]/80 leading-relaxed">
                {a.bio?.split(/\n+/).filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              {a.expertise && a.expertise.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {a.expertise.map((e) => (
                    <span
                      key={e}
                      className="text-[10px] uppercase tracking-[0.18em] px-3 py-1.5 border border-[#E5DFC6] text-[#0a2225]/75"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}

        {/* Founder Background */}
        <section className="pt-12 border-t border-[#E5DFC6]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-3">Founder Background</p>
          <h2 className="font-secondary text-2xl md:text-3xl leading-tight mb-10 max-w-2xl">
            A through-line from luxury transportation to AI-powered travel.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {FOUNDER_BACKGROUND.map((card) => (
              <div
                key={card.label}
                className="border border-[#E5DFC6] bg-[#FBF6E9]/40 p-6 md:p-7"
              >
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#0c4d47] mb-3">
                  {card.label}
                </p>
                <p className="text-sm text-[#0a2225]/80 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Media Notes */}
        <section className="pt-12 border-t border-[#E5DFC6] grid md:grid-cols-[260px_1fr] gap-8 md:gap-14">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-3">Media Notes</p>
            <h2 className="font-secondary text-2xl md:text-3xl leading-tight">For the press.</h2>
          </div>
          <p className="text-base text-[#0a2225]/80 leading-relaxed self-center">
            For interviews, speaking requests, media inquiries, or founder commentary, contact{" "}
            <a
              href="mailto:press@goldsainte.ai"
              className="text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225]"
            >
              press@goldsainte.ai
            </a>
            .
          </p>
        </section>

        {authors.length === 0 && (
          <p className="text-sm text-[#0a2225]/50 italic">Leadership bios coming soon.</p>
        )}
      </div>
    </>
  );
}