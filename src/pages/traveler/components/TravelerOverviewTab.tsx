import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
            to="/storyboards"
            className="group inline-flex items-center justify-center sm:justify-start text-sm text-[#0a2225]/70 hover:text-[#0a2225] transition-colors h-11 sm:h-auto"
          >
            Browse storyboards for inspiration
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
