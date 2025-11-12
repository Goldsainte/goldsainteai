import { MessageSquare, Mic, Send } from "lucide-react";
import { Card } from "@/components/ui/card";

interface WelcomeCardProps {
  onDismiss: () => void;
}

export const WelcomeCard = ({ onDismiss }: WelcomeCardProps) => {
  return (
    <Card className="bg-muted/30 border-muted p-4 mb-3 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">👋</span>
          <h4 className="font-serif text-sm font-semibold text-foreground">
            Welcome to Goldsainte AI Concierge
          </h4>
        </div>
        
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
            <span>Ask about flights, hotels, or restaurants</span>
          </li>
          <li className="flex items-start gap-2">
            <Send className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
            <span>Try: "Find a flight to Miami next Friday"</span>
          </li>
          <li className="flex items-start gap-2">
            <Mic className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
            <span>Click 🎙️ to talk, or type your request</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">🎧</span>
            <span>Say "Hey Goldsainte" to start by voice</span>
          </li>
        </ul>
      </div>
    </Card>
  );
};
