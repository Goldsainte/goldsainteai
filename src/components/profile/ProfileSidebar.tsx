import { Activity, Clock, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FollowButton from "@/components/FollowButton";
import { formatDistanceToNow } from "date-fns";

interface ProfileSidebarProps {
  name: string;
  rating?: number | null;
  reviewCount?: number | null;
  onRequestTrip?: () => void;
  targetUserId?: string;
  lastActiveAt?: string | null;
  responseTimeHours?: number | null;
  isVerified?: boolean;
  professionalLicenseVerified?: boolean | null;
  insuranceVerified?: boolean | null;
  className?: string;
}

export function ProfileSidebar({
  name,
  rating,
  reviewCount,
  onRequestTrip,
  targetUserId,
  lastActiveAt,
  responseTimeHours,
  isVerified,
  professionalLicenseVerified,
  insuranceVerified,
  className,
}: ProfileSidebarProps) {
  const lastActiveText = lastActiveAt
    ? `Active ${formatDistanceToNow(new Date(lastActiveAt), { addSuffix: false })} ago`
    : null;

  const responseTimeText = responseTimeHours
    ? responseTimeHours <= 1
      ? "Responds within 1 hour"
      : responseTimeHours <= 24
      ? `Responds within ${responseTimeHours} hours`
      : `Responds within ${Math.ceil(responseTimeHours / 24)} days`
    : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Plan Your Journey CTA */}
      <div className="rounded-2xl border border-[#E5DFC6] bg-white p-6 shadow-sm">
        <h3 className="font-secondary text-lg text-[#0a2225] mb-3">
          Plan Your Journey
        </h3>

        <div className="space-y-2 mb-5">
          {[
            "Share your travel vision",
            "Receive a personalized plan within 48h",
            "Book securely through Goldsainte",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#C7A962] flex-shrink-0" />
              <span className="text-sm text-[#6B7280] leading-snug">{step}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={onRequestTrip}
          className="w-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-xl h-11 font-medium"
        >
          Design My Trip
        </Button>
        <p className="text-center text-xs text-[#6B7280] mt-2">
          Takes 2 minutes · No commitment
        </p>

        {rating != null && rating > 0 && (
          <p className="mt-3 text-center text-sm text-[#6B7280]">
            <span className="text-[#C7A962]">★</span>{" "}
            <span className="font-medium text-[#0a2225]">{rating.toFixed(1)}</span>
            {" · "}
            {reviewCount ?? 0} reviews
          </p>
        )}

        {/* Follow */}
        {targetUserId && (
          <div className="mt-3">
            <FollowButton targetUserId={targetUserId} />
          </div>
        )}

        {(lastActiveText || responseTimeText) && (
          <div className="mt-4 pt-3 border-t border-[#E5DFC6] space-y-2">
            {lastActiveText && (
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <Activity className="h-3.5 w-3.5 text-green-500" />
                {lastActiveText}
              </div>
            )}
            {responseTimeText && (
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <Clock className="h-3.5 w-3.5 text-[#C7A962]" />
                {responseTimeText}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trust & Safety */}
      <div className="rounded-2xl border border-[#E5DFC6] bg-[#F5F0E0]/50 p-5">
        <h3 className="font-secondary text-base text-[#0a2225] mb-4">
          Trust & Safety
        </h3>
        <ul className="space-y-2.5">
          {[
            "Verified partner",
            "Secure booking through Goldsainte",
            "On-platform messaging",
            "Dispute resolution support",
          ].map((text) => (
            <li key={text} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#C7A962] flex-shrink-0" />
              <span className="text-sm text-[#0a2225]">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {(isVerified !== undefined || professionalLicenseVerified !== undefined || insuranceVerified !== undefined) && (
        <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-[#C7A962] font-medium mb-3">
            Verified by Goldsainte
          </p>
          <ul className="space-y-2.5">
            {[
              { label: "Identity confirmed", done: !!isVerified },
              { label: "Professional credentials", done: !!professionalLicenseVerified },
              { label: "Insurance on file", done: !!insuranceVerified },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-2.5 text-sm">
                {item.done ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0c4d47] text-white flex-shrink-0">
                    <Check className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#E5DFC6] text-[#9A9384] flex-shrink-0">
                    <Circle className="h-2 w-2" />
                  </span>
                )}
                <span className={item.done ? "text-[#0a2225]" : "text-[#9A9384]"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
