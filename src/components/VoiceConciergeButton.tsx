import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceConciergeButtonProps {
  onClick?: () => void;
  className?: string;
}

export function VoiceConciergeButton({ onClick, className }: VoiceConciergeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="voice-concierge-button"
      aria-label="Open Madison concierge"
      className={cn(
        "fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-4 py-2 text-sm font-semibold text-[#E5DFC6] shadow-lg transition hover:bg-[#073331] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c4d47]",
        className,
      )}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      Hey Goldsainte
    </button>
  );
}
