// src/components/policies/MarketplaceDisclaimer.tsx

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Marketplace Disclaimer
 *
 * Usage:
 * <MarketplaceDisclaimer size="sm" />  // compact
 * <MarketplaceDisclaimer size="md" />  // default
 * <MarketplaceDisclaimer size="lg" />  // prominent
 *
 * This component reminds users that Goldsainte is a marketplace only.
 * It can be placed on booking screens, proposal forms, trip details,
 * chat threads, or any page where liability context is helpful.
 */
interface MarketplaceDisclaimerProps {
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
}

export function MarketplaceDisclaimer({
  size = "md",
  align = "left",
}: MarketplaceDisclaimerProps) {
  const textSize =
    size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs";

  const padding =
    size === "sm" ? "py-2 px-3" : size === "lg" ? "py-4 px-5" : "py-3 px-4";

  const alignment = align === "center" ? "text-center" : "text-left";

  return (
    <Alert className={`${padding} ${alignment}`}>
      <Info className="h-4 w-4 shrink-0" />
      <AlertDescription className={`${textSize} leading-relaxed`}>
        Goldsainte is a curated marketplace. Travel services shown or booked on this
        platform are designed, sold, and fulfilled by independent travel professionals and
        third-party suppliers. The travel professional is the seller of record for your
        trip and is paid directly at checkout — Goldsainte holds a platform service fee
        only and is not the airline, hotel, tour operator, ground operator, seller, or
        service provider for your trip.
        <br />
        <br />
        Cancellation and refund eligibility is governed by supplier rules and the travel
        professional's terms for each itinerary. Please review all applicable policies
        before accepting or booking a trip.
        <br />
        <br />
        <Link
          to="/cancellation-refund-policy"
          className="underline underline-offset-2 font-medium"
          target="_blank"
        >
          View Goldsainte's full Cancellation & Refund Policy
        </Link>
        .
      </AlertDescription>
    </Alert>
  );
}
