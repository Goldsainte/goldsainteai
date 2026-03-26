import { Compass, Bookmark, Map } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DiscoveryWelcomeModalProps {
  open: boolean;
  onDismiss: () => void;
}

const STEPS = [
  { icon: Compass, label: "Explore", desc: "Browse travel ideas" },
  { icon: Bookmark, label: "Save", desc: "Pin images to your storyboard" },
  { icon: Map, label: "Plan", desc: "Turn it into a custom trip" },
];

export function DiscoveryWelcomeModal({ open, onDismiss }: DiscoveryWelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent className="max-w-sm p-8 text-center border-border bg-background">
        <div className="space-y-6">
          <div>
            <h2 className="font-secondary text-xl text-foreground mb-2">
              Plan your next trip visually
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Explore travel ideas, save what you love, and build your own trip storyboard.
              When you're ready, we'll turn it into a personalized itinerary.
            </p>
          </div>

          <div className="flex justify-center gap-6">
            {STEPS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2 max-w-[90px]">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={onDismiss}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-11"
          >
            Start Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
