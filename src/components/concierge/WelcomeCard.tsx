import { MessageSquare, Sparkles, Users, FileText, Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WelcomeCardProps {
  onDismiss: () => void;
  onPromptClick: (prompt: string) => void;
  onStartVoice?: () => void;
}

export const WelcomeCard = ({ onDismiss, onPromptClick, onStartVoice }: WelcomeCardProps) => {
  const starterPrompts = [
    "Help me plan a trip based on a TikTok I saved.",
    "Build a storyboard for a Bali honeymoon.",
    "Match me with creators who fit a luxury aesthetic.",
    "Help me refine my trip brief before I post it.",
    "Show me boutique hotels in Paris this spring.",
    "Turn these ideas into a trip I can actually book.",
  ];

  return (
    <Card className="bg-muted/30 border-muted p-4 mb-3 animate-fade-in">
      <div className="space-y-3">
        <div className="mb-3">
          <h4 className="font-serif text-sm font-semibold text-foreground mb-1">
            Hey, I'm Madison — your Goldsainte travel concierge.
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            I help travelers turn inspiration into storyboards, match with creators and certified agents, and shape every detail of a luxury trip — all inside Goldsainte.
          </p>
        </div>

        {/* Voice Mode CTA */}
        {onStartVoice && (
          <Button
            onClick={() => {
              onStartVoice();
              onDismiss();
            }}
            size="lg"
            className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 animate-pulse"
          >
            <Mic className="w-4 h-4" />
            Start Voice Conversation
          </Button>
        )}
        
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Or try asking:
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {starterPrompts.slice(0, 3).map((prompt, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                onClick={() => {
                  onPromptClick(prompt);
                  onDismiss();
                }}
                className="h-auto py-2 px-3 text-left justify-start text-[11px] hover:bg-primary/10 hover:text-primary"
              >
                <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
                <span className="line-clamp-2">{prompt}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
