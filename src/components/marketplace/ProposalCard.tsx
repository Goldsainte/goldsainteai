import { Star, MessageCircle, CheckCircle } from "lucide-react";
import type { Proposal } from "@/pages/marketplace/TripRequestDetail";

interface ProposalCardProps {
  proposal: Proposal;
  onAccept: () => void;
  onOpenChat: () => void;
  formattedBudgetRange: string;
  isRequestOwner: boolean;
}

export function ProposalCard({
  proposal,
  onAccept,
  onOpenChat,
  formattedBudgetRange,
  isRequestOwner,
}: ProposalCardProps) {
  const isAccepted = proposal.status === "accepted";
  const isDeclined = proposal.status === "declined";

  return (
    <div
      className={[
        "rounded-2xl bg-card p-4 shadow-sm ring-1 transition-all",
        isAccepted
          ? "ring-emerald-500 ring-2"
          : isDeclined
          ? "opacity-50 ring-border"
          : "ring-border hover:ring-primary/50",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {proposal.avatarInitials}
          </div>

          {/* Author info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{proposal.authorName}</h3>
              {isAccepted && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  <CheckCircle className="h-3 w-3" />
                  Accepted
                </span>
              )}
            </div>
            {proposal.handle && (
              <p className="text-xs text-muted-foreground">{proposal.handle}</p>
            )}
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{proposal.rating.toFixed(1)}</span>
              </div>
              <span>·</span>
              <span>{proposal.reviewsCount} reviews</span>
              <span>·</span>
              <span className="capitalize">{proposal.authorType}</span>
            </div>
          </div>
        </div>

        {/* Status badge for declined */}
        {isDeclined && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Declined
          </span>
        )}
      </div>

      {/* Proposal message */}
      <div className="mt-3 text-xs text-foreground">
        <p>{proposal.message}</p>
      </div>

      {/* Highlights */}
      {proposal.highlights.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {proposal.highlights.map((highlight, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Footer: pricing + actions */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <div>
          <p className="text-xs text-muted-foreground">Proposal price</p>
          <p className="text-sm font-semibold text-foreground">{formattedBudgetRange}</p>
          <p className="text-[11px] text-muted-foreground">{proposal.timelineLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenChat}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            <MessageCircle className="h-3 w-3" />
            Chat
          </button>

          {isRequestOwner && !isAccepted && !isDeclined && (
            <button
              type="button"
              onClick={onAccept}
              className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Accept proposal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
