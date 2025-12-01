import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const BULLET_POINTS = [
  "All important communication stays on Goldsainte. Keep booking details, changes, and approvals inside the platform so there's a clear record if anything needs to be reviewed.",
  "No phone numbers or personal emails in chat. For your safety and ours, please don't share direct contact details. If something goes wrong, we can only help with what's on-platform.",
  "All payments are processed through Goldsainte. Never send money by wire, bank transfer, or external links. Trips paid outside the platform aren't protected by our policies.",
  "Agents and creators are vetted and monitored. Verified travel professionals and creators follow strict standards on communication, documentation, and trip delivery.",
  "You can report anything that feels off. If a message, offer, or behavior doesn't feel right, you can flag it directly from the chat or booking view.",
];

type TrustSafetyContext = "chat" | "trip" | "booking" | "general";

type TrustSafetyModalProps = {
  open: boolean;
  onClose: () => void;
  context?: TrustSafetyContext;
  onAcknowledge?: () => void | Promise<void>;
};

const CONTEXT_NOTES: Record<TrustSafetyContext, string | null> = {
  chat: "Applies to all messages between you, your creator, and your travel agent.",
  trip: "Applies to trip details, quotes, and changes before you book.",
  booking: "Applies to this booking, from deposit to trip completion.",
  general: null,
};

export function TrustSafetyModal({ open, onClose, context = "general", onAcknowledge }: TrustSafetyModalProps) {
  const subtitle = CONTEXT_NOTES[context];

  const handleConfirm = async () => {
    try {
      await onAcknowledge?.();
    } finally {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-xl border border-border bg-background">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg">Staying safe with Goldsainte</DialogTitle>
              {subtitle && (
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-3">
            Goldsainte is designed to keep every trip, every conversation, and every payment inside a protected environment. These guidelines help us protect you, your money, and the quality of your experience.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] sm:max-h-[60vh]">
          <div className="space-y-3 py-4 pr-4">
            {BULLET_POINTS.map((point) => (
              <div key={point} className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground">
                {point}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border/60 bg-accent/40 px-4 py-3 text-sm text-foreground mr-4">
            <p className="font-semibold mb-1">Why this protects you</p>
            <p className="text-sm text-muted-foreground">
              Keeping everything inside Goldsainte—messages, documents, and payments—gives us the ability to step in if there's a dispute, a cancellation, or a quality issue. It also helps prevent fraud, miscommunication, and off-platform behavior that puts your trip at risk.
            </p>
          </div>
        </ScrollArea>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={handleConfirm} className="flex-1">I understand</Button>
          <Link
            to="/trust-and-safety"
            onClick={() => onClose()}
            className={cn(
              "text-sm font-medium text-primary hover:text-primary/80 text-center",
              "underline-offset-4 hover:underline"
            )}
          >
            Read full policies
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
