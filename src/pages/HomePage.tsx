import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  PlayCircle,
  ChevronRight,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExpediaModal } from "@/contexts/ExpediaModalContext";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";

import heroAmalfi from "@/assets/home/hero-amalfi-coast.jpg";
import heroJungleVilla from "@/assets/home/hero-jungle-villa.jpg";
import heroCreatorPortrait from "@/assets/home/hero-creator-portrait.jpg";
import heroOverwater from "@/assets/home/hero-overwater-villa.jpg";

import storyboardPositano from "@/assets/home/storyboard-positano.jpg";
import storyboardBali from "@/assets/home/storyboard-bali.jpg";
import storyboardMaldives from "@/assets/home/storyboard-maldives.jpg";
import storyboardSeoul from "@/assets/home/storyboard-seoul.jpg";

/**
 * HomePage
 * - Light, airy luxury aesthetic
 * - Hero: Farfetch / Mr & Mrs Smith–style editorial copy
 * - "How it works" mirrors onboarding (Traveler, Creator, Agent)
 * - Storyboard strip: Pinterest/TikTok-style journeys
 * - Marketplace preview
 */

const BG = "bg-[#f7f3ea]";

export default function HomePage() {
  const navigate = useNavigate();
  const { openModal: openExpediaModal } = useExpediaModal();

  return (
    <main className={`${BG} text-[#0a2225] min-h-screen`}>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-16 md:pb-16">
        <div className="grid gap-10 md:grid-cols-[3fr,2fr] items-center">
          {/* Left: copy + CTAs */}
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] border border-[#BFAD72]/40">
              <Sparkles className="h-3 w-3 text-[#BFAD72]" />
              <span className="tracking-[0.16em] uppercase text-[#8D8D8D]">
                Goldsainte · Travel marketplace
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-[26px] md:text-[32px] leading-snug text-[#0a2225]">
                Luxury trips,{" "}
                <span className="italic">designed like content</span>, booked
                like a five–star hotel.
              </h1>
              <p className="text-sm md:text-[15px] text-[#4a4a4a] max-w-xl">
                Goldsainte is where travelers, TikTok creators and curated
                agents design journeys together. Storyboard the trip like a
                Pinterest board, price it with real contracts, then book
                everything in one protected space.
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap gap-3 text-[11px]">
              <Button
                type="button"
                onClick={() => navigate("/post-trip")}
                className="rounded-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] px-4 py-2 h-auto text-[11px] font-semibold"
              >
                Post a trip brief
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/marketplace")}
                className="rounded-full border border-[#BFAD72] text-[#0a2225] bg-white/80 hover:bg-[#f1e8d7] px-4 py-2 h-auto text-[11px]"
              >
                Browse live journeys
              </Button>
            </div>

            {/* Secondary CTA: Expedia + AI mention */}
            <div className="space-y-2 text-[11px]">
              <button
                type="button"
                onClick={() => openExpediaModal()}
                className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6]/80 bg-white/90 px-3 py-1.5 text-[11px] text-[#0a2225] hover:bg-[#f3e9da]"
              >
                <PlayCircle className="h-3 w-3 text-[#BFAD72]" />
                <span>Prefer a classic search? Open Expedia inside Goldsainte</span>
              </button>
              <p className="text-[10px] text-[#8D8D8D] max-w-sm">
                Start with a familiar hotel search. When you're ready, turn it
                into a storyboarded journey with creators, agents and our AI
                concierge.
              </p>
            </div>
          </div>

          {/* Right: Pinterest-style collage */}
          <div className="grid grid-cols-2 gap-3 h-80 md:h-96">
            <HeroImageCard
              label="Amalfi light, slow afternoons"
              size="normal"
              image={heroAmalfi}
            />
            <HeroImageCard
              label="Jungle villas & plunge pools"
              size="tall"
              image={heroJungleVilla}
            />
            <HeroImageCard
              label="Creators on location"
              size="tall"
              image={heroCreatorPortrait}
            />
            <HeroImageCard
              label="Over-water suites at sunrise"
              size="normal"
              image={heroOverwater}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <HowItWorksSection />

      {/* STORYBOARDS STRIP */}
      <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#8D8D8D] mb-1">
              Storyboards in motion
            </p>
            <h2 className="font-display text-xl text-[#0a2225]">
              See trips the way creators and agents build them.
            </h2>
            <p className="text-[11px] text-[#4a4a4a] max-w-xl mt-1.5">
              Every Goldsainte journey lives as a visual storyboard first —
              moments, scenes, and experiences laid out like a TikTok sequence.
              These are examples of how a brief becomes a board, then a booking.
            </p>
          </div>
          <Link
            to="/tiktok-lab"
            className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c4d47] hover:text-[#073331]"
          >
            Open TikTok Lab
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-full">
            <StoryboardCard
              tag="Traveler brief → Creator storyboard"
              title="48 hours in Positano, filmed like a mini–series"
              scenes={[
                "Boat arrival & first Aperol on the terrace",
                "Balcony breakfast overlooking the cliffside village",
                "Golden-hour shoot on the steps before dinner at the beach club",
              ]}
              image={storyboardPositano}
            />
            <StoryboardCard
              tag="Creator + Agent collab"
              title="Bali slow-luxury: jungle suites & ocean detours"
              scenes={[
                "Morning plunge pool, pour-over coffee, first shot of the day",
                "Rice terrace picnic with drone footage and quiet time",
                "Private dinner under lanterns with live acoustic set",
              ]}
              image={storyboardBali}
            />
            <StoryboardCard
              tag="TikTok-first honeymoon"
              title="Maldives in three acts: arrival, reveal, unwind"
              scenes={[
                "Hydroplane arrival & barefoot walk down the over-water jetty",
                "Suite reveal with champagne and floating breakfast plan",
                "No-phones sunset sandbank finale and last swim under the stars",
              ]}
              image={storyboardMaldives}
            />
            <StoryboardCard
              tag="Creator POV · City series"
              title="Seoul after dark: street food & skyline shots"
              scenes={[
                "Market intro: skewers, steam, neon signage in the background",
                "Hidden speakeasy with skyline view and moody b-roll",
                "Rooftop sign-off with time-lapse of the city at night",
              ]}
              image={storyboardSeoul}
            />
          </div>
        </div>

        <Link
          to="/tiktok-lab"
          className="mt-3 inline-flex md:hidden items-center gap-1 text-[11px] font-semibold text-[#0c4d47] hover:text-[#073331]"
        >
          Open TikTok Lab
          <ChevronRight className="h-3 w-3" />
        </Link>
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="mx-auto max-w-6xl px-4 pb-14 md:pb-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-xl text-[#0a2225]">
              Browse the Goldsainte marketplace
            </h2>
            <p className="text-[11px] text-[#4a4a4a] max-w-xl mt-1.5">
              Scroll through creator-led journeys, agent-led escapes and
              co-designed TikTok Lab collaborations. Think Farfetch meets
              Pinterest — but for trips.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c4d47] hover:text-[#073331]"
          >
            View full marketplace
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-3 text-xs">
          <MarketplaceCard
            title="Creator-led journeys"
            body="Trips storyboarded by TikTok creators, with agents behind the scenes to make every scene actually bookable."
            link="/marketplace?tab=creators"
            cta="Browse creator trips"
          />
          <MarketplaceCard
            title="Agent-crafted escapes"
            body="Itineraries built by certified agents, from city weekends to once-in-a-lifetime safaris — all vetted and ready."
            link="/marketplace?tab=agents"
            cta="Browse agent trips"
          />
          <MarketplaceCard
            title="TikTok Lab collabs"
            body="Special journeys where creators and agents build together in TikTok Lab — designed to be filmed and remembered."
            link="/tiktok-lab"
            cta="Explore TikTok Lab"
          />
        </div>
      </section>
    </main>
  );
}

/* ========== SUBCOMPONENTS ========== */

type HeroImageCardProps = {
  label: string;
  image: string;
  size?: "normal" | "tall";
};

function HeroImageCard({ label, image, size = "normal" }: HeroImageCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-[#E5DFC6]/80 bg-[#fdfaf4] shadow-sm ${
        size === "tall" ? "row-span-2" : ""
      }`}
    >
      <img src={image} alt={label} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      <p className="absolute bottom-3 left-3 text-[11px] font-medium text-white drop-shadow">
        {label}
      </p>
    </div>
  );
}

type HowItWorksCardProps = {
  eyebrow: string;
  title: string;
  steps: string[];
  link: string;
  cta: string;
};

function HowItWorksCard({
  eyebrow,
  title,
  steps,
  link,
  cta,
}: HowItWorksCardProps) {
  return (
    <div className="rounded-3xl bg-white/95 text-[#0a2225] p-5 flex flex-col justify-between border border-[#E5DFC6]">
      <div className="space-y-2">
        <p className="text-[10px] tracking-[0.18em] uppercase text-[#8D8D8D]">
          {eyebrow}
        </p>
        <h3 className="text-sm font-semibold">{title}</h3>
        <ul className="mt-1.5 space-y-1.5">
          {steps.map((step) => (
            <li key={step} className="flex gap-2 text-[11px] text-[#4a4a4a]">
              <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#BFAD72]" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
      <Link
        to={link}
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c4d47] hover:text-[#073331]"
      >
        {cta}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function StoryboardCard({
  tag,
  title,
  scenes,
  image,
}: {
  tag: string;
  title: string;
  scenes: string[];
  image: string;
}) {
  return (
    <div className="min-w-[240px] max-w-[260px] rounded-3xl bg-white text-[#0a2225] border border-[#E5DFC6] overflow-hidden flex flex-col">
      <div className="relative h-32">
        <img src={image} alt={title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
          <Film className="h-3 w-3" />
          <span>{tag}</span>
        </div>
      </div>
      <div className="p-3 space-y-1.5 text-[11px] flex-1 flex flex-col">
        <p className="font-semibold">{title}</p>
        <ul className="space-y-1 flex-1">
          {scenes.map((scene) => (
            <li key={scene} className="flex gap-2 text-[#4a4a4a]">
              <span className="mt-[5px] h-1 w-1 rounded-full bg-[#BFAD72]" />
              <span>{scene}</span>
            </li>
          ))}
        </ul>
      </div>
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
    <div className="rounded-3xl bg-[#f6f3ea]/95 text-[#0a2225] p-5 flex flex-col justify-between border border-[#E5DFC6]">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-[#4a4a4a]">{body}</p>
      </div>
      <Link
        to={link}
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c4d47] hover:text-[#073331]"
      >
        {cta}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
