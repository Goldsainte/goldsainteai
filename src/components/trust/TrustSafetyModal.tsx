// src/components/trust/TrustSafetyModal.tsx
import { Shield, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

type ModalContext = "chat" | "trip_posting" | "proposal_acceptance" | "payment";

type TrustSafetyModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ModalContext;
  onConfirm: () => void;
  onCancel?: () => void;
};

const CONTEXT_CONFIG = {
  chat: {
    title: "Keep your trip safe on Goldsainte",
    icon: Shield,
    variant: "warning" as const,
    rules: [
      {
        text: "Never share phone numbers, email addresses, or social media handles in chat",
        reason: "Moving conversations off-platform means we can't help if something goes wrong",
      },
      {
        text: "Don't accept payment requests through Venmo, Cash App, Zelle, or direct bank transfers",
        reason: "These payments aren't protected and you won't be eligible for refunds or dispute resolution",
      },
      {
        text: "Report any requests to move communication or payments off Goldsainte",
        reason: "This violates our Terms of Service and puts your booking at risk",
      },
    ],
    confirmText: "I understand — continue to chat",
    requireAcknowledgment: true,
  },
  trip_posting: {
    title: "Post your trip safely",
    icon: Shield,
    variant: "info" as const,
    rules: [
      {
        text: "Don't include contact information in your trip description",
        reason: "Goldsainte chat is how creators and agents will reach you",
      },
      {
        text: "Keep budget discussions in proposals, not in public descriptions",
        reason: "Proposals happen privately between you and vetted partners",
      },
      {
        text: "All communication must stay on Goldsainte",
        reason: "We can only protect bookings and handle disputes for on-platform trips",
      },
    ],
    confirmText: "Got it — post my trip",
    requireAcknowledgment: true,
  },
  proposal_acceptance: {
    title: "Before you accept this proposal",
    icon: AlertTriangle,
    variant: "warning" as const,
    rules: [
      {
        text: "Verify all trip details match what you discussed",
        reason: "Once accepted, you'll move into the booking flow and payment schedule",
      },
      {
        text: "Payment will only happen through Goldsainte's secure checkout",
        reason: "Never send money outside Goldsainte — you won't be protected",
      },
      {
        text: "Keep all future communication in your Goldsainte trip chat",
        reason: "If issues arise, we need a record of what was promised",
      },
      {
        text: "Review the cancellation policy and refund terms",
        reason: "Understand what happens if plans change before your trip",
      },
    ],
    confirmText: "I've reviewed everything — accept proposal",
    requireAcknowledgment: true,
  },
  payment: {
    title: "Goldsainte payment protection",
    icon: Shield,
    variant: "success" as const,
    rules: [
      {
        text: "Your payment is held securely until trip milestones are met",
        reason: "We release funds to creators/agents only when services are delivered",
      },
      {
        text: "Never pay outside Goldsainte, even if asked",
        reason: "Outside payments aren't protected and violate our Terms of Service",
      },
      {
        text: "You can dispute charges if something doesn't match the proposal",
        reason: "Our support team reviews all disputes with your chat history as evidence",
      },
    ],
    confirmText: "Proceed to secure payment",
    requireAcknowledgment: false,
  },
};

export function TrustSafetyModal({
  open,
  onOpenChange,
  context,
  onConfirm,
  onCancel,
}: TrustSafetyModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const config = CONTEXT_CONFIG[context];

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
    setAcknowledged(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
    setAcknowledged(false);
  };

  const Icon = config.icon;
  const canConfirm = !config.requireAcknowledgment || acknowledged;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-background border-border">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                config.variant === "warning"
                  ? "bg-yellow-500/10"
                  : config.variant === "success"
                  ? "bg-emerald-500/10"
                  : "bg-primary/10"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  config.variant === "warning"
                    ? "text-yellow-600"
                    : config.variant === "success"
                    ? "text-emerald-600"
                    : "text-primary"
                }`}
              />
            </div>
            <DialogTitle className="text-lg font-display">
              {config.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            These rules protect your booking and help us support you if anything
            doesn't go to plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {config.rules.map((rule, index) => (
            <div
              key={index}
              className="flex gap-3 rounded-xl bg-muted/50 p-3 border border-border"
            >
              <div className="mt-0.5">
                {config.variant === "warning" ? (
                  <XCircle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {rule.text}
                </p>
                <p className="text-xs text-muted-foreground">{rule.reason}</p>
              </div>
            </div>
          ))}
        </div>

        {config.requireAcknowledgment && (
          <div className="flex items-start gap-3 rounded-lg bg-accent/50 p-3 border border-accent">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="acknowledge"
              className="text-xs text-foreground cursor-pointer flex-1"
            >
              I understand that moving communication or payments off Goldsainte
              means I won't be protected and may violate Terms of Service,
              potentially resulting in account restrictions.
            </label>
          </div>
        )}

        <DialogFooter className="gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="text-sm"
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="text-sm"
          >
            {config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
