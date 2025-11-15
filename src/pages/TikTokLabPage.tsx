import { Sparkles, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BRAND_BG = "bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6]";

export default function TikTokLabPage() {
  return (
    <main className={`min-h-screen ${BRAND_BG} text-[#E5DFC6]`}>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-16 md:pb-12">
        <div className="grid gap-8 md:grid-cols-[3fr,2fr] items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-[#E5DFC6]/80 border border-[#BFAD72]/40">
              <Sparkles className="h-3 w-3 text-[#BFAD72]" />
              TikTok Lab · by Goldsainte
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Turn TikTok travel into{" "}
              <span className="text-[#BFAD72]">bookable journeys.</span>
            </h1>
            <p className="text-sm md:text-base text-[#E5DFC6]/80 max-w-xl">
              Creators design cinematic storyboards. Certified agents wire up flights,
              hotels, and experiences. Travelers book the whole thing in one tap.
            </p>

            <div className="flex flex-wrap gap-3 text-xs">
              <Button
                asChild
                className="rounded-full bg-[#BFAD72] text-[#0a2225] text-xs font-semibold hover:bg-[#d4c58d]"
              >
                <Link to="/post-trip">
                  I'm a traveler · Post a trip
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-[#BFAD72]/60 bg-black/40 text-xs text-[#E5DFC6] hover:bg-black/70"
              >
                <Link to="/creator/trips">
                  I'm a creator · Find trips
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-[#BFAD72]/60 bg-black/40 text-xs text-[#E5DFC6] hover:bg-black/70"
              >
                <Link to="/agent/trips">
                  I'm an agent · Browse creators
                </Link>
              </Button>
            </div>

            <p className="text-[11px] text-[#E5DFC6]/70">
              No DMs, no messy spreadsheets. Goldsainte keeps commissions, chat,
              and bookings all in one place.
            </p>
          </div>

          {/* Right: Pinterest-like storyboard preview */}
          <div className="grid grid-cols-3 grid-rows-4 gap-2 h-72 md:h-80">
            <StoryboardTile label="Overwater villas" accent />
            <StoryboardTile label="Sunset boat" />
            <StoryboardTile label="Rooftop cocktails" />
            <StoryboardTile label="Hidden streets" accent />
            <StoryboardTile label="Private tasting" />
            <StoryboardTile label="Infinity pool" accent />
            <StoryboardTile label="Slow mornings" />
            <StoryboardTile label="Local markets" accent />
            <StoryboardTile label="Night lights" />
            <StoryboardTile label="Seaplane arrival" />
            <StoryboardTile label="Ocean swing" accent />
            <StoryboardTile label="Spa rituals" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <h2 className="text-lg md:text-xl font-semibold mb-4">
          How TikTok Lab works
        </h2>
        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <HowItWorksCard
            step="01"
            title="Travelers drop a dream brief"
            body="Share the TikToks, mood, budget, and dates. Goldsainte AI turns your inspo into a clear creative + itinerary brief."
          />
          <HowItWorksCard
            step="02"
            title="Creators storyboard the experience"
            body="Creators use the Goldsainte storyboard to sketch shots, transitions, and hooks that match your trip."
          />
          <HowItWorksCard
            step="03"
            title="Agents make it bookable"
            body="Certified agents plug in flights, stays, and on-the-ground experiences — then you book the entire journey in one place."
          />
        </div>
      </section>

      {/* TikTok collab CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-3xl bg-[#f6f3ea]/95 text-[#0a2225] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm">
          <div className="space-y-2 max-w-xl">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8D8D8D]">
              <PlayCircle className="h-3 w-3" />
              TikTok travel, but grown up
            </p>
            <h3 className="text-lg md:text-xl font-semibold">
              Build your next viral trip with a creator–agent duo.
            </h3>
            <p className="text-xs text-[#4a4a4a]">
              Pair your favorite TikTok storytellers with the agents who can
              actually route the flights and secure the rooms. Goldsainte keeps
              the collab, commissions, and chat on-platform.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-xs min-w-[190px]">
            <Button
              asChild
              className="rounded-full bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#0c4d47]/90"
            >
              <Link to="/post-trip">
                Start a creator + agent brief
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-[#0c4d47]/40 text-[#0c4d47] hover:bg-[#0c4d47]/5"
            >
              <Link to="/tiktok-lab/creators">
                Browse TikTok travel creators
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function StoryboardTile({
  label,
  accent,
}: {
  label: string;
  accent?: boolean;
}) {
  const base =
    "relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-end p-2";
  const accentBg = accent
    ? "bg-gradient-to-br from-[#0c4d47] via-[#0a2225] to-[#BFAD72]"
    : "bg-gradient-to-br from-black/40 via-black/10 to-[#0a2225]";

  return (
    <div className={`${base} ${accentBg}`}>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#BFAD72,_transparent_60%)]" />
      <span className="relative text-[10px] font-medium text-[#E5DFC6]">
        {label}
      </span>
    </div>
  );
}

function HowItWorksCard({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl bg-black/30 border border-[#BFAD72]/30 p-4 space-y-2">
      <p className="text-[11px] text-[#BFAD72] font-semibold">{step}</p>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-[11px] text-[#E5DFC6]/80">{body}</p>
    </div>
  );
}
