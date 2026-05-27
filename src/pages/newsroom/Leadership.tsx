import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { fetchAuthors, BASE_URL } from "./lib";
import signatureImage from "@/assets/newsroom/signature-andre-powell.webp";
import {
  NewsroomPageHeader,
  newsroomPageSectionClass,
  newsroomPageShellClass,
  newsroomSectionTitleClass,
} from "./ui";

const FOUNDER_BACKGROUND = [
  {
    label: "Luxury Transportation",
    body: "Built Goldsainte's original luxury transportation platform and expanded the model into 350+ cities across 50+ countries.",
  },
  {
    label: "Marketplace Evolution",
    body: "Identified the gap between travel inspiration, planning, and booking â€” leading to Goldsainte's evolution into a global AI travel marketplace.",
  },
  {
    label: "Operational Leadership",
    body: "Brings experience across hospitality, franchise operations, consumer service platforms, and technology-enabled growth.",
  },
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Leadership() {
  const { data: authors = [], isLoading } = useQuery({
    queryKey: ["newsroom", "authors"],
    queryFn: fetchAuthors,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <>
      <Helmet>
        <title>Founder | Goldsainte Newsroom</title>
        <meta
          name="description"
          content="Meet Andre C. Powell, Jr., founder and CEO of Goldsainte."
        />
        <link rel="canonical" href={`${BASE_URL}/newsroom/leadership`} />
      </Helmet>

      <div className={`${newsroomPageShellClass} px-5 sm:px-6 space-y-14 md:space-y-24`}>
        {/* Page header */}
        <NewsroomPageHeader
          eyebrow="Goldsainte Newsroom · Founder"
          title="The founder building the future of travel."
          intro={
            <p>
              Goldsainte is led by founder and CEO Andre C. Powell, Jr. His background
              spans luxury transportation, consumer marketplaces, franchise operations,
              and AI-enabled travel technology.
            </p>
          }
        />

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid md:grid-cols-[280px_1fr] gap-10 md:gap-14 pt-12 border-t border-[#E5DFC6] animate-pulse">
            <div className="w-full aspect-[4/5] bg-[#E5DFC6]/50 rounded-sm" />
            <div className="space-y-5">
              <div className="h-3 w-24 bg-[#E5DFC6]/60 rounded" />
              <div className="h-8 w-2/3 bg-[#E5DFC6]/60 rounded" />
              <div className="space-y-3 pt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-3 w-full bg-[#E5DFC6]/40 rounded" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && authors.length === 0 && (
          <p className="text-sm text-[#0a2225]/50 italic pt-12 border-t border-[#E5DFC6]">
            Leadership bios coming soon.
          </p>
        )}

        {/* All authors */}
        {!isLoading &&
          authors.map((a) => (
            <article
              key={a.id}
              id={a.slug}
              className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-14 pt-10 md:pt-12 border-t border-[#E5DFC6]"
            >
              {/* Portrait */}
              <div className="md:sticky md:top-32 self-start">
                {a.avatar_url ? (
                  <img
                    src={a.avatar_url}
                    alt={a.full_name}
                    className="w-full aspect-[4/5] object-cover rounded-sm border border-[#E5DFC6] shadow-[0_20px_50px_-20px_rgba(10,34,37,0.25)]"
                  />
                ) : (
                  <div className="w-full aspect-[4/5] rounded-sm border border-[#E5DFC6] bg-gradient-to-br from-[#0c4d47] to-[#0a3d39] flex items-center justify-center shadow-[0_20px_50px_-20px_rgba(10,34,37,0.25)]">
                    <span className="font-secondary text-6xl text-[#C7A962] tracking-wider">
                      {initialsOf(a.full_name)}
                    </span>
                  </div>
                )}
                {a.linkedin_url && (
                  <a
                    href={a.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] uppercase tracking-[0.25em] text-[#0c4d47] hover:underline mt-5 inline-block"
                  >
                    LinkedIn â†’
                  </a>
                )}
              </div>

              {/* Bio */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#C7A962] mb-3">
                  {a.title}
                </p>
                <h2 className="font-secondary text-[24px] sm:text-[30px] md:text-4xl leading-[1.08] text-[#0a2225]">
                  {a.full_name}
                </h2>

                {a.quote && (
                  <blockquote className="font-secondary text-lg md:text-xl italic text-[#0a2225]/85 border-l-2 border-[#C7A962] pl-5 my-7 leading-snug">
                    "{a.quote}"
                  </blockquote>
                )}

                <div className="space-y-5 text-base text-[#0a2225]/80 leading-relaxed">
                  {a.bio
                    ?.split(/\n+/)
                    .filter(Boolean)
                    .map((para, i) => <p key={i}>{para}</p>)}
                </div>

                {/* Signature */}
                <div className="mt-10 pt-6 border-t border-[#E5DFC6]">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#C7A962] mb-3">
                    Signed
                  </p>
                  <div style={{ mixBlendMode: "multiply" }}>
                    <img
                      src={a.signature_image_url || signatureImage}
                      alt={`Signature of ${a.full_name}`}
                      className="h-28 md:h-32 w-auto -ml-3 select-none"
                      draggable={false}
                    />
                  </div>
                </div>

                {a.expertise && a.expertise.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {a.expertise.map((e) => (
                      <span
                        key={e}
                        className="text-[10px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-full border border-[#E5DFC6] text-[#0a2225]/75"
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
        <section className={newsroomPageSectionClass}>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C7A962] mb-3">
            Founder Background
          </p>
          <h2 className={`${newsroomSectionTitleClass} mb-8 md:mb-10 max-w-2xl`}>
            A through-line from luxury transportation to AI-powered travel.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {FOUNDER_BACKGROUND.map((card) => (
              <div
                key={card.label}
                className="rounded-sm border border-[#E5DFC6] bg-[#F6F0E4] p-6 md:p-7"
              >
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#C7A962] mb-3">
                  {card.label}
                </p>
                <p className="text-sm text-[#0a2225]/80 leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Media Notes */}
        <section className={`grid md:grid-cols-[260px_1fr] gap-8 md:gap-14 ${newsroomPageSectionClass}`}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C7A962] mb-3">
              Media Notes
            </p>
            <h2 className={newsroomSectionTitleClass}>
              For the press.
            </h2>
          </div>
          <p className="text-base text-[#0a2225]/80 leading-relaxed self-center">
            For interviews, speaking requests, media inquiries, or founder commentary,
            contact{" "}
            <a
              href="mailto:info@goldsainte.com"
              className="text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225] transition"
            >
              info@goldsainte.com
            </a>
            .
          </p>
        </section>
      </div>
    </>
  );
}
