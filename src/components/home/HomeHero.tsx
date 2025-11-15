import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar, Users, ArrowRight, Mic, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useExpediaModal } from "@/contexts/ExpediaModalContext";
import logomark from "@/assets/logomark-seal-gold.png";
import luxuryAiHero from "@/assets/luxury-ai-hero.jpg";

export function HomeHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openModal: openExpediaModal } = useExpediaModal();

  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const handleExpediaSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    const adults = parseInt(guests || "2", 10);

    openExpediaModal({
      destination: destination.trim(),
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      adults: Number.isNaN(adults) ? 2 : adults,
      children: 0,
    });
  };

  return (
    <section className="relative overflow-hidden rounded-b-[32px] border-b border-border bg-gradient-to-b from-background to-muted/40">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black/40" />
        <img
          src={luxuryAiHero}
          alt="Goldsainte luxury travel"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-12 pt-16 md:px-8 md:pt-20 lg:flex-row lg:items-center lg:gap-10 lg:pb-20">
        {/* Left: brand + copy */}
        <div className="flex-1 space-y-4 md:space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white shadow-sm ring-1 ring-white/20 backdrop-blur">
            <img src={logomark} alt="Goldsainte logo" className="h-5 w-5" />
            <span>Goldsainte · TikTok Travel & Concierge</span>
          </div>

          <div className="space-y-3 md:space-y-4">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-white md:text-3xl lg:text-4xl">
              Where TikTok travel dreams become bookable trips.
            </h1>
            <p className="max-w-xl text-sm text-white/80 md:text-base">
              TikTok creators inspire the story. Certified agents design and
              book the experience. You search, dream, or just talk to our AI
              concierge—and Goldsainte makes it happen.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 text-[11px] text-white/80">
            <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">
              Curated by travel creators
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">
              Planned & booked by certified agents
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
              <Sparkles className="h-3 w-3" />
              AI voice concierge included
            </span>
          </div>
        </div>

        {/* Right: traditional Expedia search bar */}
        <div className="flex-1">
          <form
            onSubmit={handleExpediaSearch}
            className="space-y-3 rounded-3xl bg-black/55 p-4 text-xs text-white shadow-xl ring-1 ring-white/15 backdrop-blur-md md:p-5"
          >
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-white/80">
                {t("home.search.destination") || "Where do you want to go?"}
              </label>
              <div className="relative flex items-center">
                <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-white/40" />
                <Input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="City, region, or experience"
                  className="w-full rounded-2xl border-0 bg-white/10 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:bg-white/15 focus-visible:ring-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-white/80">
                  Check-in
                </label>
                <div className="relative flex items-center">
                  <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-white/40" />
                  <Input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full rounded-2xl border-0 bg-white/10 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:bg-white/15 focus-visible:ring-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-white/80">
                  Check-out
                </label>
                <div className="relative flex items-center">
                  <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-white/40" />
                  <Input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full rounded-2xl border-0 bg-white/10 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:bg-white/15 focus-visible:ring-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[1.2fr_.8fr] gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-white/80">
                  Guests
                </label>
                <div className="relative flex items-center">
                  <Users className="pointer-events-none absolute left-3 h-4 w-4 text-white/40" />
                  <Input
                    type="number"
                    min={1}
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full rounded-2xl border-0 bg-white/10 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:bg-white/15 focus-visible:ring-white"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-100"
                >
                  <span>Search with Expedia</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Secondary actions: marketplace + voice concierge */}
            <div className="mt-2 flex flex-col gap-2 text-[11px] md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={() => navigate("/marketplace")}
                className="inline-flex items-center gap-1 text-left text-white/80 hover:text-white"
              >
                <Sparkles className="h-3 w-3" />
                <span>Or browse trips curated by TikTok creators</span>
              </button>

              <div className="inline-flex items-center gap-1 text-white/70">
                <Mic className="h-3 w-3" />
                <span>
                  Prefer to talk? Tap the AI Voice Concierge button in the
                  corner to speak your trip ideas.
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
