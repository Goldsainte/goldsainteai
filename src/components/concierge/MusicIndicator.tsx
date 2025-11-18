import { Music, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MusicIndicatorProps {
  isPlaying: boolean;
  onToggle: () => void;
  className?: string;
}

export const MusicIndicator = ({ isPlaying, onToggle, className }: MusicIndicatorProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "gap-1.5 h-7 px-2 text-xs",
            isPlaying && "text-primary",
            className
          )}
        >
          {isPlaying ? (
            <>
              <Music className={cn("w-3.5 h-3.5", isPlaying && "animate-pulse")} />
              <span className="hidden sm:inline">Music</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Music Off</span>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isPlaying ? "Background music playing" : "Click to play background music"}</p>
      </TooltipContent>
    </Tooltip>
  );
};
