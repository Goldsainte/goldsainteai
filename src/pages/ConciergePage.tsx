import { useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { MadisonChat } from "@/components/MadisonChat";
import { BackButton } from "@/components/ui/BackButton";

export default function ConciergePage() {
  const [searchParams] = useSearchParams();
  
  // Read URL params passed from collections
  const destination = searchParams.get("destination");
  const context = searchParams.get("context");
  const nights = searchParams.get("nights");
  const vibes = searchParams.get("vibes");

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <BackButton className="mb-6" />

        {/* Context Banner */}
        {context && (
          <div className="mb-6 p-4 rounded-2xl bg-white border border-[#E5DFC6] shadow-sm">
            <p className="text-sm text-[#6B7280]">
              <span className="font-medium text-[#0a2225]">Continuing from: </span>
              {context} {destination && `in ${destination}`}
            </p>
          </div>
        )}

        {/* Intro Section */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#C7A962]" />
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-[#C7A962]">
              AI Concierge
            </span>
          </div>
        <h1 className="text-3xl md:text-4xl font-secondary text-[#0a2225] mb-4">
          Madison by Goldsainte AI
        </h1>
        <p className="text-base text-[#0a2225]/80 leading-relaxed max-w-2xl mx-auto">
          Bring me your ideas—I'll help you shape your first itinerary, refine your trip brief, 
          craft a visual storyboard, and connect you with creators and certified agents whose 
          style complements your vision.
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
