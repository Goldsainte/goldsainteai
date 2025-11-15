import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useExpediaModal } from "@/contexts/ExpediaModalContext";

const HERO_IMAGES = [
  "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/261169/pexels-photo-261169.jpeg?auto=compress&cs=tinysrgb&w=1920",
];

export function HomeHero() {
  const navigate = useNavigate();
  const { openModal: openExpediaModal } = useExpediaModal();

  const [bgIndex, setBgIndex] = useState(0);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  // Rotate background images every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

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
    <section className="relative min-h-[85vh] overflow-hidden">
      {/* Slideshow backgrounds with fade transitions */}
      <div className="absolute inset-0 -z-10">
        {HERO_IMAGES.map((url, i) => (
          <div
            key={url}
            className="absolute inset-0 transition-opacity duration-[1800ms]"
            style={{
              opacity: i === bgIndex ? 1 : 0,
            }}
          >
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(12,77,71,0.82),_rgba(10,34,37,0.98))]" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-20 md:px-8 md:pt-24 lg:flex-row lg:items-center lg:gap-12 lg:pb-20">
        {/* Left: brand + copy */}
        <div className="flex-1 space-y-5 md:space-y-6">
          {/* Brand badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-[#E5DFC6] shadow-sm ring-1 ring-[#BFAD72]/40 backdrop-blur">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#BFAD72] text-[10px] font-semibold text-[#0a2225]">
              G
            </span>
            <span>Goldsainte · TikTok Travel & Concierge</span>
          </div>

          <div className="space-y-4 md:space-y-5">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-white drop-shadow-lg md:text-4xl lg:text-5xl">
              Luxury stays & story-worthy trips, curated by creators, booked by
              experts.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[#E5DFC6]/90 md:text-base">
              Goldsainte connects TikTok travel creators, certified travel
              agents, and discerning travelers in one luxury marketplace. Search
              hotels on Expedia, browse creator-curated trips, or chat with our
              AI voice concierge to design your dream journey.
            </p>
          </div>

          {/* Color palette display */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-black/40 px-3 py-1 font-medium text-[#E5DFC6] backdrop-blur">
              Primary: <span className="text-[#0c4d47]">#0c4d47</span>
            </span>
            <span className="rounded-full bg-black/40 px-3 py-1 font-medium text-[#E5DFC6] backdrop-blur">
              Secondary: <span className="text-[#BFAD72]">#BFAD72</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 font-medium text-[#E5DFC6] backdrop-blur">
              <Sparkles className="h-3 w-3 text-[#BFAD72]" />
              AI Voice Concierge
            </span>
          </div>
        </div>

        {/* Right: Expedia search form */}
        <div className="flex-1">
          <form
            onSubmit={handleExpediaSearch}
            className="space-y-4 rounded-3xl border border-[#BFAD72]/40 bg-[#0a2225]/95 p-5 shadow-2xl backdrop-blur-md md:p-6"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="destination"
                className="text-xs font-medium text-[#E5DFC6]/90"
              >
                Where do you want to go?
              </label>
              <div className="relative flex items-center">
                <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-[#E5DFC6]/70" />
                <Input
                  id="destination"
                  type="text"
                  placeholder="City, region, or landmark"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="h-11 border-[#BFAD72]/30 bg-[#0c4d47]/70 pl-10 text-sm text-white placeholder:text-[#E5DFC6]/55 focus:bg-[#0c4d47] focus-visible:ring-[#BFAD72]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="checkIn"
                  className="text-xs font-medium text-[#E5DFC6]/90"
                >
                  Check-in
                </label>
                <div className="relative flex items-center">
                  <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-[#E5DFC6]/70" />
                  <Input
                    id="checkIn"
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="h-11 border-[#BFAD72]/30 bg-[#0c4d47]/70 pl-10 text-sm text-white focus:bg-[#0c4d47] focus-visible:ring-[#BFAD72]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="checkOut"
                  className="text-xs font-medium text-[#E5DFC6]/90"
                >
                  Check-out
                </label>
                <div className="relative flex items-center">
                  <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-[#E5DFC6]/70" />
                  <Input
                    id="checkOut"
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="h-11 border-[#BFAD72]/30 bg-[#0c4d47]/70 pl-10 text-sm text-white focus:bg-[#0c4d47] focus-visible:ring-[#BFAD72]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="guests"
                className="text-xs font-medium text-[#E5DFC6]/90"
              >
                Guests
              </label>
              <div className="relative flex items-center">
                <Users className="pointer-events-none absolute left-3 h-4 w-4 text-[#E5DFC6]/70" />
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="2"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="h-11 border-[#BFAD72]/30 bg-[#0c4d47]/70 pl-10 text-sm text-white placeholder:text-[#E5DFC6]/55 focus:bg-[#0c4d47] focus-visible:ring-[#BFAD72]"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full bg-[#BFAD72] text-sm font-semibold text-[#0a2225] shadow-lg transition-all hover:bg-[#d4c58d] hover:shadow-xl"
            >
              Search on Expedia
            </Button>

            <div className="space-y-2 pt-2 text-center text-[11px] text-[#E5DFC6]/70">
              <p>
                Or{" "}
                <button
                  type="button"
                  onClick={() => navigate("/marketplace")}
                  className="inline-flex items-center gap-1 font-medium text-[#E5DFC6]/85 underline decoration-[#BFAD72]/50 underline-offset-2 transition-colors hover:text-white hover:decoration-[#BFAD72]"
                >
                  <Sparkles className="h-3 w-3" />
                  browse the marketplace
                </button>
              </p>
              <p className="text-[10px]">
                Need help? Try our AI Voice Concierge (coming soon)
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
