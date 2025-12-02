import { useState } from "react";
import { Sparkles } from "lucide-react";

interface TripAboutSectionProps {
  description: string;
  promoCode?: string;
  promoDescription?: string;
}

export function TripAboutSection({
  description,
  promoCode,
  promoDescription,
}: TripAboutSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = description.length > 500;
  const displayText = shouldTruncate && !isExpanded 
    ? description.slice(0, 500) + "..." 
    : description;

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">
        About This Trip
      </h2>

      {/* Promo Banner */}
      {promoCode && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-gradient-to-r from-[#C7B892]/20 to-[#C7B892]/5 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#C7B892]" />
          <div>
            <p className="font-medium text-[#0a2225]">
              {promoDescription || "Special Offer!"}
            </p>
            <p className="mt-1 text-sm text-[#4a4a4a]">
              Use code: <span className="font-semibold text-[#C7B892]">{promoCode}</span>
            </p>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mt-4">
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#4a4a4a]">
          {displayText}
        </p>
        
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-sm font-medium text-[#0C4D47] hover:underline"
          >
            {isExpanded ? "Read Less" : "Read More"}
          </button>
        )}
      </div>
    </section>
  );
}
