import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TravelerOverviewTabProps {
  profile: {
    id: string;
    display_name?: string | null;
    first_name?: string | null;
    avatar_url?: string | null;
    created_at?: string | null;
  } | null;
  stats: {
    tripRequests: number;
    bookings: number;
  };
  onAvatarUpdate: (url: string) => void;
}

export function TravelerOverviewTab({ profile, stats, onAvatarUpdate }: TravelerOverviewTabProps) {
  const firstName = profile?.display_name?.split(" ")[0] || profile?.first_name || "there";
  const isFirstTimeUser = stats.tripRequests === 0 && stats.bookings === 0;

  const steps = [
    {
      n: "01",
      title: "Tell us your trip",
      body: "Share where, when, who's travelling and the kind of experience you're after.",
    },
    {
      n: "02",
      title: "We curate proposals",
      body: "Trusted creators and agents respond with bespoke itineraries — privately, on-platform.",
    },
    {
      n: "03",
      title: "Confirm with confidence",
      body: "Compare, message, and book through Goldsainte. Payments are protected end-to-end.",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Editorial hero */}
      <section className="border-t border-[#0a2225]/10 pt-8 md:pt-10">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
          Start here
        </p>
        <h2 className="mt-3 md:mt-4 font-secondary text-[28px] md:text-5xl leading-[1.15] text-[#0a2225] max-w-2xl">
          A quieter way to design the journeys that matter.
        </h2>
        <p className="mt-4 md:mt-5 max-w-xl text-[15px] leading-relaxed text-[#0a2225]/65">
          Tell us about a trip you're dreaming of — we'll bring the right
          creators and agents to design it with you.
        </p>

        <div className="mt-7 md:mt-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-x-8">
          <Button
            asChild
            className="rounded-full bg-[#0c4d47] hover:bg-[#0a2225] text-[#f7f3ea] px-7 h-12 text-sm tracking-wide w-full sm:w-auto"
          >
            <Link to="/post-trip">Request a Trip</Link>
          </Button>
          <Link
            to="/marketplace"
            className="group inline-flex items-center justify-center sm:justify-start text-sm text-[#0a2225]/70 hover:text-[#0a2225] transition-colors h-11 sm:h-auto"
          >
            Browse the marketplace
            <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* How it works — editorial three-step */}
      <section className="border-t border-[#0a2225]/10 pt-8 md:pt-10">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-[#0c4d47]/70 mb-6 md:mb-8">
          How Goldsainte works for you
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
          {steps.map((s) => (
            <div key={s.n} className="space-y-3">
              <p className="font-secondary text-2xl text-[#c7a962]">{s.n}</p>
              <h3 className="font-secondary text-xl text-[#0a2225]">{s.title}</h3>
              <p className="text-sm leading-relaxed text-[#0a2225]/65">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* First-time user guidance tiles */}
      {isFirstTimeUser && (
        <section className="border-t border-[#0a2225]/10 pt-8 md:pt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9A9384] mb-2">
            Welcome to Goldsainte
          </p>
          <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">
            Let's plan your first trip
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            Three ways to get started — pick whichever feels right.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              to="/marketplace"
              className="block rounded-xl border border-[#E5DFC6] hover:border-[#C7A962]/50 p-4 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF9F0] mb-3">
                <MapPin className="h-4 w-4 text-[#0c4d47]" />
              </div>
              <p className="font-secondary text-base text-[#0a2225] mb-1">Browse Trips</p>
              <p className="text-xs text-[#6B7280]">Explore curated journeys ready to book.</p>
            </Link>

            <Link
              to="/post-trip"
              className="block rounded-xl border border-[#E5DFC6] hover:border-[#C7A962]/50 p-4 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF9F0] mb-3">
                <Calendar className="h-4 w-4 text-[#0c4d47]" />
              </div>
              <p className="font-secondary text-base text-[#0a2225] mb-1">Tell Us Your Dream</p>
              <p className="text-xs text-[#6B7280]">
                Post a trip request and receive personalized proposals.
              </p>
            </Link>

            <Link
              to="/marketplace"
              className="block rounded-xl border border-[#E5DFC6] hover:border-[#C7A962]/50 p-4 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF9F0] mb-3">
                <MessageCircle className="h-4 w-4 text-[#0c4d47]" />
              </div>
              <p className="font-secondary text-base text-[#0a2225] mb-1">Explore the Marketplace</p>
              <p className="text-xs text-[#6B7280]">Discover curated trips, guides, and bundles.</p>
            </Link>
          </div>
        </section>
      )}

      {/* Quiet stats footer */}
      {(stats.tripRequests > 0 || stats.bookings > 0) && (
        <section className="border-t border-[#0a2225]/10 pt-8 flex flex-wrap gap-x-12 gap-y-4">
          <div>
            <p className="font-secondary text-3xl text-[#0a2225]">{stats.tripRequests}</p>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#0a2225]/55 mt-1">
              Open requests
            </p>
          </div>
          <div>
            <p className="font-secondary text-3xl text-[#0a2225]">{stats.bookings}</p>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#0a2225]/55 mt-1">
              Confirmed journeys
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
