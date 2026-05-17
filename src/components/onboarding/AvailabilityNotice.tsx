import { Globe } from "lucide-react";
import { Link } from "react-router-dom";

export function AvailabilityNotice() {
  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-[#FDF9F0] p-5 my-8">
      <div className="flex items-start gap-3">
        <Globe className="h-5 w-5 text-[#0c4d47] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-[#0a2225] text-sm mb-1">Available in 47 countries</p>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Travelers can book from anywhere. Travel professionals and creators must be based in a country supported by Stripe Connect to receive payments.{" "}
            <Link to="/help/supported-countries" className="text-[#0c4d47] underline">
              View supported countries
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}