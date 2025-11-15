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

import baliSerenity from "@/assets/bali-serenity.jpg";
import luxuryBeach from "@/assets/luxury-beach.jpg";
import creatorBeachSelfie from "@/assets/creator-beach-selfie.jpg";
import pinkBeach from "@/assets/pink-beach-aerial.jpg";

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
              label="Sunrise over-water suites"
              size="normal"
              image={baliSerenity}
            />
            <HeroImageCard
              label="Private coves & long lunches"
              size="tall"
              image={luxuryBeach}
            />
            <HeroImageCard
              label="Creators on location"
              size="tall"
              image={creatorBeachSelfie}
            />
            <HeroImageCard
              label="Helicopter views & pink sands"
              size="normal"
              image={pinkBeach}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 pb-10 md:pb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#8D8D8D] mb-1">
              How it works
            </p>
            <h2 className="font-display text-xl text-[#0a2225]">
              One marketplace. Three roles. One clean journey.
            </h2>
            <p className="text-[11px] text-[#4a4a4a] max-w-xl mt-1.5">
              The same roles you choose during sign-up — Traveler, Creator,
              Travel Agent — shape how Goldsainte works for you. Everyone plays
              their part; the trip stays in one beautifully managed thread.
            </p>
          </div>
          <p className="text-[10px] text-[#8D8D8D] max-w-xs">
            No phone numbers. No "just DM me." All messaging, payments and
            disputes stay on-platform, so your trip — and everyone's earnings —
            are protected.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <HowItWorksCard
            eyebrow="For travelers"
            title="Post the trip. We build the team."
            steps={[
              "Share your dates, budget and the TikToks, Pins or moods that inspired the trip.",
              "Goldsainte surfaces creators + agents whose style and markets actually fit you.",
              "Review proposals and storyboards, then book the one that feels right — all inside Goldsainte.",
            ]}
            link="/post-trip"
            cta="Post your first trip"
          />
          <HowItWorksCard
            eyebrow="For creators"
            title="Storyboard the journey, not just the post."
            steps={[
              "Set up your creator profile with TikTok handle, niche and destinations you love.",
              "Respond to briefs where your audience and aesthetic make sense.",
              "Co-design trips with agents and earn a creator share on every booked journey.",
            ]}
            link="/partner"
            cta="Open creator console"
          />
          <HowItWorksCard
            eyebrow="For travel agents"
            title="Curate, contract, and quietly run the show."
            steps={[
              "Share your agency details, contract markets and sweet-spot budgets.",
              "Receive traveler and creator-led concepts that match your strengths.",
              "Build bookable itineraries, manage bookings and track payouts in one console.",
            ]}
            link="/partner"
            cta="Open agent console"
          />
        </div>
      </section>

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
                "Boat arrival & first Aperol",
                "Balcony breakfast overlooking the cliffside",
                "Golden-hour shoot on the steps",
              ]}
              image={luxuryBeach}
            />
            <StoryboardCard
              tag="Creator + Agent collab"
              title="Bali slow-luxury: jungle suites & ocean detours"
              scenes={[
                "Morning plunge pool & coffee",
                "Rice terrace picnic with drone shots",
                "Private dinner under lanterns",
              ]}
              image={baliSerenity}
            />
            <StoryboardCard
              tag="TikTok–first honeymoon"
              title="Maldives in three acts: arrival, reveal, unwind"
              scenes={[
                "Hydroplane arrival & over-water walkway",
                "Room reveal & champagne on the deck",
                "No-phones sunset sandbank finale",
              ]}
              image={pinkBeach}
            />
            <StoryboardCard
              tag="Creator POV"
              title="Seoul food tour with night–market energy"
              scenes={[
                "Street food crawl intro shot",
                "Hidden cocktail bar in an alley",
                "Rooftop skyline sign-off",
              ]}
              image={creatorBeachSelfie}
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
