import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Music, Sparkles, Shield } from "lucide-react";

interface ConciergeIntroModalProps {
  open: boolean;
  onClose: () => void;
  onEnableFeatures: () => void;
}

export const ConciergeIntroModal = ({ open, onClose, onEnableFeatures }: ConciergeIntroModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">
            Meet Madison — your luxury travel concierge
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            Goldsainte blends creators, agents, and AI to build cinematic travel experiences. Madison helps you bring it all together:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Voice Feature */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Talk naturally with voice</h4>
              <p className="text-xs text-muted-foreground">
                Speak to Madison just like a real concierge. Say "Hey Goldsainte" anytime to activate voice mode.
              </p>
            </div>
          </div>

          {/* Music Feature */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Music className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Luxury atmosphere with music</h4>
              <p className="text-xs text-muted-foreground">
                Soft background music creates an elegant, boutique hotel lobby experience.
              </p>
            </div>
          </div>

          {/* Storyboards Feature */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Shapes your ideas into storyboards</h4>
              <p className="text-xs text-muted-foreground">
                Turn inspiration into visual plans you can refine and share with creators and agents.
              </p>
            </div>
          </div>

          {/* Safety Feature */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Protected & private</h4>
              <p className="text-xs text-muted-foreground">
                Everything stays inside Goldsainte — no phone numbers, no emails, no off-platform payments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button 
            onClick={() => {
              onEnableFeatures();
              onClose();
            }}
            className="w-full"
            size="lg"
          >
            Start planning with Madison
          </Button>
          <Button 
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Skip intro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
