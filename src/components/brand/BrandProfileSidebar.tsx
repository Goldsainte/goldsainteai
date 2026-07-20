import { Star, ExternalLink, Bookmark, ShieldCheck, MessageCircle, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BrandProfileSidebarProps {
  brandName: string;
  averageRating?: number | null;
  reviewCount?: number | null;
  website?: string | null;
  onRequestTrip?: () => void;
  onAddToStoryboard?: () => void;
  className?: string;
}

export function BrandProfileSidebar({
  brandName,
  averageRating,
  reviewCount,
  website,
  onRequestTrip,
  onAddToStoryboard,
  className,
}: BrandProfileSidebarProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Rating card */}
      <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm">
        {averageRating ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-5 w-5",
                    star <= Math.round(averageRating)
                      ? "fill-[#C7A962] text-[#C7A962]"
                      : "fill-[#E5DFC6] text-[#E5DFC6]"
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-2xl font-bold text-[#0a2225]">
              {averageRating.toFixed(1)}
            </p>
            <p className="text-xs text-[#6B7280]">
              Based on {reviewCount ?? 0} reviews
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 fill-[#E5DFC6] text-[#E5DFC6]" />
              ))}
            </div>
            <p className="mt-2 text-sm text-[#6B7280]">New partner</p>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-5 space-y-2.5">
          <Button
            onClick={onRequestTrip}
            className="w-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-xl h-11 font-medium"
          >
            Request a trip
          </Button>
          
          {website && (
            <Button
              variant="outline"
              asChild
              className="w-full border-[#E5DFC6] hover:bg-[#F5F0E0] rounded-xl h-11"
            >
              <a href={website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit website
              </a>
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={onAddToStoryboard}
            className="w-full hover:bg-[#F5F0E0] rounded-xl h-11 text-[#0a2225]"
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Save to storyboard
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
          How it works
        </h3>
        <ol className="space-y-3">
          {[
            { step: 1, text: "Share your trip details and preferences" },
            { step: 2, text: "Get matched with this verified partner" },
            { step: 3, text: "Book securely through Goldsainte" },
          ].map(({ step, text }) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5F0E0] text-xs font-semibold text-[#0a2225]">
                {step}
              </span>
              <span className="text-sm text-[#4a4a4a] leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Trust & Safety */}
      <div className="rounded-2xl border border-[#E5DFC6] bg-[#F5F0E0]/50 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
          Trust & Safety
        </h3>
        <ul className="space-y-3">
          {[
            { icon: ShieldCheck, text: "Verified partner" },
            { icon: CreditCard, text: "Secure payments through Stripe" },
            { icon: MessageCircle, text: "On-platform messaging" },
            { icon: CheckCircle, text: "Dispute resolution support" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 text-[#0c4d47]" />
              <span className="text-sm text-[#0a2225]">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
