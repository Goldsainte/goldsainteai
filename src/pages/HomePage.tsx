import { Link } from "react-router-dom";
import { Sparkles, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceConciergeButton } from "@/components/VoiceConciergeButton";

const BG = "bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6]";

export default function HomePage() {
  return (
    <main className={`${BG} text-[#E5DFC6] min-h-screen`}>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-16 md:pb-16">
        <div className="grid gap-10 md:grid-cols-[3fr,2fr] items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] border border-[#BFAD72]/40">
              <Sparkles className="h-3 w-3 text-[#BFAD72]" />
              Goldsainte AI · TikTok travel, curated like a private club
            </div>
            <h1 className="text-3xl md:text-[2.5rem] font-semibold tracking-tight leading-tight">
              A members-only feel
              <br />
              for the{" "}
              <span className="text-[#BFAD72]">TikTok travel generation.</span>
            </h1>
            <p className="text-sm md:text-base text-[#E5DFC6]/80 max-w-xl">
              Discover trips designed by TikTok creators and locked in by certified
              travel agents. Goldsainte keeps the storytelling, logistics, and
              bookings in one luxury-grade marketplace.
            </p>

            {/* Search + Voice concierge */}
            <div className="space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex-1 flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 border border-[#E5DFC6]/30">
                  <Search className="h-4 w-4 text-[#BFAD72]" />
                  <input
                    className="flex-1 bg-transparent text-xs md:text-sm placeholder:text-[#E5DFC6]/60 focus:outline-none"
                    placeholder="Search destinations, vibes, or TikTok creators…"
                  />
                </div>
                <VoiceConciergeButton />
              </div>
              <p className="text-[11px] text-[#E5DFC6]/70">
                Connected to Expedia for classic search — elevated by Goldsainte AI
                for curated matches.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <Button
                asChild
                className="rounded-full bg-[#BFAD72] text-[#0a2225] text-xs font-semibold hover:bg-[#d4c58d]"
              >
                <Link to="/post-trip">Post a trip to the marketplace</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-[#BFAD72]/60 bg-black/40 text-xs text-[#E5DFC6] hover:bg-black/70"
              >
                <Link to="/tiktok-lab">Open TikTok Lab</Link>
              </Button>
            </div>
          </div>

          {/* Right column: Pinterest-like photo collage */}
          <div className="grid grid-cols-2 gap-3 h-80 md:h-96">
            <HeroImageCard label="Clifftop suites" />
            <HeroImageCard label="Riad courtyards" tall />
            <HeroImageCard label="Hidden wine bars" tall />
            <HeroImageCard label="Overwater sunsets" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
        <h2 className="text-lg md:text-xl font-semibold mb-4">
          How Goldsainte works
        </h2>
        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <StepCard
            index="01"
            title="Post your dream trip"
            body="Share the TikToks, mood, budget, and timing. Think Pinterest board meets travel brief."
          />
          <StepCard
            index="02"
            title="Match with creators & agents"
            body="Goldsainte AI pairs you with TikTok travel creators and certified agents who live and breathe that style."
          />
          <StepCard
            index="03"
            title="Book the whole story"
            body="Approve the vision, lock the itinerary, and pay securely. Every message and commission stays on-platform."
          />
        </div>
      </section>

      {/* Marketplace CTA row */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <MarketplaceCard
            title="For travelers"
            body="Post a trip, choose a creator–agent duo, and watch your feed-worthy itinerary come to life."
            link="/post-trip"
            cta="Post a trip"
          />
          <MarketplaceCard
            title="For TikTok creators"
            body="Turn your travel content into bookable storyboards with agents who can deliver the logistics."
            link="/creator/trips"
            cta="Browse trip briefs"
          />
          <MarketplaceCard
            title="For travel agents"
            body="Partner with creators, plug in your contracts, and earn on trips born on TikTok."
            link="/agent/trips"
            cta="See creator collabs"
          />
        </div>
      </section>
    </main>
  );
}

function HeroImageCard({
  label,
  tall,
}: {
  label: string;
  tall?: boolean;
}) {
  const base =
    "relative overflow-hidden rounded-3xl border border-[#E5DFC6]/20 bg-gradient-to-br from-[#0c4d47] via-[#0a2225] to-[#BFAD72] flex items-end p-3";
  return (
    <div className={`${base} ${tall ? "row-span-2" : ""}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#E5DFC6,_transparent_55%)] opacity-30" />
      <p className="relative text-[11px] font-medium text-[#E5DFC6]">
        {label}
      </p>
    </div>
  );
}

function StepCard({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl bg-black/30 border border-[#BFAD72]/30 p-4 space-y-2">
      <p className="text-[11px] text-[#BFAD72] font-semibold">{index}</p>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-[11px] text-[#E5DFC6]/80">{body}</p>
    </div>
  );
}

function MarketplaceCard({
  title,
  body,
  link,
  cta,
}: {
  title: string;
  body: string;
  link: string;
  cta: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f6f3ea]/95 text-[#0a2225] p-5 flex flex-col justify-between gap-4 shadow-sm">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-[#4a4a4a]">{body}</p>
      </div>
      <Link
        to={link}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c4d47] hover:text-[#073331]"
      >
        {cta}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
