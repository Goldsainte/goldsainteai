import { useSearchParams } from "react-router-dom";
import { MadisonChat } from "@/components/MadisonChat";

export default function ConciergePage() {
  const [searchParams] = useSearchParams();
  
  // Read URL params passed from collections
  const destination = searchParams.get("destination");
  const context = searchParams.get("context");
  const nights = searchParams.get("nights");
  const vibes = searchParams.get("vibes");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Context Banner */}
        {context && (
          <div className="mb-4 p-4 rounded-xl bg-[#F6F0E4] border border-[#E5DFC6]">
            <p className="text-sm text-[#6E6650]">
              <span className="font-medium text-[#0a2225]">Continuing from: </span>
              {context} {destination && `in ${destination}`}
            </p>
          </div>
        )}

        {/* Intro Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-secondary text-foreground mb-3">
            Your Goldsainte Concierge
          </h1>
          <h2 className="text-lg md:text-xl text-muted-foreground mb-4">
            A calm, human-feeling assistant for every part of your trip.
          </h2>
          <p className="text-sm md:text-base text-foreground/80 leading-relaxed max-w-2xl mx-auto mb-6">
            I can help you sketch your first itinerary, refine a trip brief, create a visual storyboard, 
            or match you with creators and certified agents whose style fits your vision. Think of me as 
            the person who makes travel feel beautifully simple.
          </p>
          <p className="text-sm text-muted-foreground italic">
            Tell me what you're dreaming of, and I'll take it from here.
          </p>
        </div>

        {/* Chat Interface */}
        <MadisonChat 
          initialDestination={destination}
          initialContext={context}
          initialNights={nights}
          initialVibes={vibes}
        />
      </div>
    </div>
  );
}
