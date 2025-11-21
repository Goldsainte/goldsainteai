import { cn } from "@/lib/utils";
import logomark from "@/assets/logomark-gold.png";

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
        "fixed bottom-4 right-4 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      <img 
        src={logomark} 
        alt="Goldsainte" 
        className="h-12 w-12 object-contain"
      />
    </button>
  );
}
