import { useSearchParams } from "react-router-dom";
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
    <div className="min-h-screen bg-[#FDF9F0] pb-24 lg:pb-0">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
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

        {/* Minimal Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-secondary text-[#0a2225]">Madison</h1>
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
