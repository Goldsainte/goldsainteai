import { cn } from "@/lib/utils";

interface VoiceStatusMessageProps {
  status: 'wake-active' | 'listening' | 'responding' | 'idle';
  className?: string;
}

export const VoiceStatusMessage = ({ status, className }: VoiceStatusMessageProps) => {
  const messages = {
    'wake-active': "Listening for 'Hey Goldsainte'…",
    'listening': "Listening…",
    'responding': "Responding…",
    'idle': "Say 'Hey Goldsainte' or click 🎙️ to start",
  };

  return (
    <div className={cn(
      "flex justify-center my-2",
      className
    )}>
      <div className="bg-muted/50 border border-muted px-3 py-1.5 rounded-full">
        <p className="text-xs text-muted-foreground text-center animate-fade-in">
          {messages[status]}
        </p>
      </div>
    </div>
  );
};
