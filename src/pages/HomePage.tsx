import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, PlayCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExpediaModal } from "@/contexts/ExpediaModalContext";

import baliSerenity from "@/assets/bali-serenity.jpg";
import luxuryBeach from "@/assets/luxury-beach.jpg";
import creatorBeachSelfie from "@/assets/creator-beach-selfie.jpg";
import pinkBeach from "@/assets/pink-beach-aerial.jpg";

const BG = "bg-[#f7f3ea]";

export default function HomePage() {
  const navigate = useNavigate();
  const { openModal: openExpediaModal } = useExpediaModal();

  return (
    <main className={`${BG} text-[#0a2225] min-h-screen`}>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-16 md:pb-16">
        <div className="grid gap-10 md:grid-cols-[3fr,2fr] items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] border border-[#BFAD72]/40">
              <Sparkles className="h-3 w-3 text-[#BFAD72]" />
              <span className="tracking-[0.16em] uppercase text-[#8D8D8D]">Travel · Creators · Agents</span>
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-2xl md:text-3xl leading-tight text-[#0a2225]">
                A luxury marketplace where <span className="text-[#0c4d47]">travelers, TikTok creators</span> and <span className="text-[#BFAD72]">curated agents</span> design trips together.
              </h1>
              <p className="text-sm md:text-base text-[#4a4a4a] max-w-xl">
                Goldsainte is where your dream trips are storyboarded like content, priced by real agents, and booked in one protected space. No DMs. No guesswork. Just beautifully designed journeys.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px]">
              <Button type="button" onClick={() => navigate("/post-trip")} className="rounded-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] px-4 py-2 h-auto text-[11px] font-semibold">
                Post a trip brief<ArrowRight className="ml-1 h-3 w-3" />
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/marketplace")} className="rounded-full border border-[#BFAD72] text-[#0a2225] bg-white/80 hover:bg-[#f1e8d7] px-4 py-2 h-auto text-[11px]">
                Browse TikTok-ready trips
              </Button>
            </div>
            <div className="space-y-2 text-[11px]">
              <button type="button" onClick={() => openExpediaModal()} className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6]/80 bg-white/90 px-3 py-1.5 text-[11px] text-[#0a2225] hover:bg-[#f3e9da]">
                <PlayCircle className="h-3 w-3 text-[#BFAD72]" />
                <span>Use classic hotel search · Powered by Expedia</span>
              </button>
              <p className="text-[10px] text-[#8D8D8D] max-w-sm">
                Prefer to browse the usual way first? Start with Expedia search, then come back to Goldsainte to turn it into a fully designed journey with creators and agents.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 h-80 md:h-96">
            <HeroImageCard label="Amalfi-style coastlines at golden hour" size="normal" image={baliSerenity} />
            <HeroImageCard label="Pool suites in the jungle" size="tall" image={luxuryBeach} />
            <HeroImageCard label="Creators on the move" size="tall" image={creatorBeachSelfie} />
            <HeroImageCard label="Overwater breakfasts & slow mornings" size="normal" image={pinkBeach} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#8D8D8D] mb-1">How it works</p>
            <h2 className="font-display text-xl text-[#0a2225]">One marketplace · three roles · one clear path.</h2>
            <p className="text-[11px] text-[#4a4a4a] max-w-xl mt-1.5">
              Goldsainte is built for travelers, TikTok creators, and certified agents to work together without chaos. The same three roles you choose during onboarding show up here in how the marketplace behaves.
            </p>
          </div>
          <p className="text-[10px] text-[#8D8D8D] max-w-xs">
            Every booking stays on-platform. No phone numbers, no side deals — so travelers stay protected and partners get paid properly.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <HowItWorksCard eyebrow="For travelers" title="Post a trip, get a creative team" steps={["Share your dates, budget, and the TikToks or vibes that inspired the trip.", "Goldsainte matches you with creators + agents who actually fit your style.", "Review proposals and storyboards in one place, then book securely through Goldsainte."]} link="/post-trip" cta="Post your first trip" />
          <HowItWorksCard eyebrow="For creators" title="Design storyboards, earn on bookings" steps={["Create your profile with your TikTok handle and travel niche.", "Respond to briefs where your audience and aesthetic are the right fit.", "Co-design trips with agents, then earn a creator share when travelers book."]} link="/partner" cta="Open creator console" />
          <HowItWorksCard eyebrow="For travel agents" title="Turn demand into bookable journeys" steps={["Share your agency details and what you specialize in.", "Receive briefs and creator-led concepts that match your contracts and markets.", "Build bookable itineraries and manage payouts inside Goldsainte."]} link="/partner" cta="Open agent console" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 md:pb-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-xl text-[#0a2225]">Browse the Goldsainte marketplace</h2>
            <p className="text-[11px] text-[#4a4a4a] max-w-xl mt-1.5">
              Scroll through live trip collections, creator portfolios, and agent-led journeys. Think Farfetch meets Pinterest — but for travel.
            </p>
          </div>
          <Link to="/marketplace" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c4d47] hover:text-[#073331]">
            View full marketplace<ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3 text-xs">
          <MarketplaceCard title="Creator-led journeys" body="Trips storyboarded by TikTok creators, with agents behind the scenes to make every scene actually bookable." link="/marketplace?tab=creators" cta="Browse creator trips" />
          <MarketplaceCard title="Agent-crafted escapes" body="Itineraries built by certified agents, from city weekends to once-in-a-lifetime safaris — all vetted and ready." link="/marketplace?tab=agents" cta="Browse agent trips" />
          <MarketplaceCard title="TikTok Lab collabs" body="Special journeys where creators and agents build together in TikTok Lab — designed to be filmed and remembered." link="/tiktok-lab" cta="Explore TikTok Lab" />
        </div>
      </section>
    </main>
  );
}

function HeroImageCard({ label, image, size = "normal" }: { label: string; image: string; size?: "normal" | "tall" }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-[#E5DFC6]/80 bg-[#fdfaf4] shadow-sm ${size === "tall" ? "row-span-2" : ""}`}>
      <img src={image} alt={label} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      <p className="absolute bottom-3 left-3 text-[11px] font-medium text-white drop-shadow">{label}</p>
    </div>
  );
}

function HowItWorksCard({ eyebrow, title, steps, link, cta }: { eyebrow: string; title: string; steps: string[]; link: string; cta: string }) {
  return (
    <div className="rounded-3xl bg-white/95 text-[#0a2225] p-5 flex flex-col justify-between border border-[#E5DFC6]">
      <div className="space-y-2">
        <p className="text-[10px] tracking-[0.18em] uppercase text-[#8D8D8D]">{eyebrow}</p>
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
      <Link to={link} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c4d47] hover:text-[#073331]">
        {cta}<ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function MarketplaceCard({ title, body, link, cta }: { title: string; body: string; link: string; cta: string }) {
  return (
    <div className="rounded-3xl bg-[#f6f3ea]/95 text-[#0a2225] p-5 flex flex-col justify-between border border-[#E5DFC6]">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-[#4a4a4a]">{body}</p>
      </div>
      <Link to={link} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c4d47] hover:text-[#073331]">
        {cta}<ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
