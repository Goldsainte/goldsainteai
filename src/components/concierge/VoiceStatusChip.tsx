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
      icon: <Circle className="w-4 h-4" />,
      text: "Try Voice",
      tooltip: "Click to start voice conversation with Madison",
      emoji: "🎤",
    },
    listening: {
      icon: <Radio className="w-4 h-4 animate-pulse" />,
      text: "Listening...",
      tooltip: "Click to pause voice mode",
      emoji: "🟢",
    },
    muted: {
      icon: <VolumeX className="w-4 h-4" />,
      text: "Voice Off",
      tooltip: "Click to unmute voice",
      emoji: "🔇",
    },
  };

  const current = config[state];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={state === 'idle' ? 'default' : 'secondary'}
          size="sm"
          onClick={onClick}
          className={cn(
            "gap-2 text-xs font-medium transition-all",
            state === 'idle' && "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 animate-pulse",
            state === 'listening' && "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30",
            className
          )}
        >
          <span className="text-base">{current.emoji}</span>
          <span>{current.text}</span>
          {current.icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{current.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};
