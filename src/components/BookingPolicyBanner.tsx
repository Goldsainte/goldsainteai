import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BookingPolicyBannerProps {
  bookingType?: "flight" | "hotel" | "package" | "car";
}

export function BookingPolicyBanner({ bookingType = "flight" }: BookingPolicyBannerProps) {
  const getPolicyText = () => {
    switch (bookingType) {
      case "flight":
        return "Cancel 24+ hours before departure for a full refund minus $50 processing fee.";
      case "hotel":
        return "Free cancellation up to 48 hours before check-in. Later cancellations may incur charges.";
      case "package":
        return "Cancel 30+ days before travel for 90% refund minus $100 administrative fee.";
      case "car":
        return "Cancel 24+ hours before pickup for a full refund. Later cancellations may incur fees.";
      default:
        return "Review our cancellation policy before booking.";
    }
  };

  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-sm">{getPolicyText()}</span>
        <Button variant="link" asChild className="h-auto p-0 text-sm">
          <Link to="/cancellation-refund-policy">
            View Full Policy
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
