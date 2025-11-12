import { Circle, Radio, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type VoiceState = 'idle' | 'listening' | 'muted';

interface VoiceStatusChipProps {
  state: VoiceState;
  onClick: () => void;
  className?: string;
}

export const VoiceStatusChip = ({ state, onClick, className }: VoiceStatusChipProps) => {
  const config = {
    idle: {
      icon: <Circle className="w-3.5 h-3.5" />,
      text: "Voice Ready",
      tooltip: "Click to enable voice",
      emoji: "🎧",
    },
    listening: {
      icon: <Radio className="w-3.5 h-3.5 animate-pulse" />,
      text: "Listening...",
      tooltip: "Click to pause",
      emoji: "🟢",
    },
    muted: {
      icon: <VolumeX className="w-3.5 h-3.5" />,
      text: "Voice Off",
      tooltip: "Click to unmute",
      emoji: "🔇",
    },
  };

  const current = config[state];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          onClick={onClick}
          className={cn(
            "gap-1.5 text-xs font-medium transition-all",
            state === 'listening' && "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30",
            className
          )}
        >
          <span className="text-sm">{current.emoji}</span>
          <span className="hidden sm:inline">{current.text}</span>
          {current.icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{current.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};
