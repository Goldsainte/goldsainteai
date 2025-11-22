import { UserCircle } from "lucide-react";

export default function ProposalCard({ proposal }: { proposal: any }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {proposal?.proposer?.avatar_url ? (
            <img
              src={proposal.proposer.avatar_url}
              alt={proposal.proposer.full_name || "Proposer"}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <UserCircle className="h-10 w-10 text-muted-foreground" />
          )}

          <div className="space-y-[2px]">
            <p className="text-sm font-semibold text-foreground">
              {proposal?.proposer?.full_name || "Unnamed Creator/Agent"}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {proposal?.proposer_role === "agent" ? "Travel Agent" : "Creator"}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <p className="text-base font-semibold text-foreground">
            ${proposal.price_from?.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground">Estimated total</p>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-border" />

      {/* Itinerary Overview */}
      <div className="mt-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Itinerary Overview
        </p>
        <p className="text-xs leading-relaxed text-foreground">
          {proposal.message || "No itinerary provided."}
        </p>
      </div>

      {/* Included */}
      {proposal.inclusions && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            What's Included
          </p>
          <p className="text-xs leading-relaxed whitespace-pre-line text-foreground">
            {proposal.inclusions}
          </p>
        </div>
      )}

      {/* Not Included */}
      {proposal.exclusions && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Not Included / Optional Add-ons
          </p>
          <p className="text-xs leading-relaxed whitespace-pre-line text-foreground">
            {proposal.exclusions}
          </p>
        </div>
      )}

      {/* Why They're a Fit */}
      {proposal.headline && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Why They're a Great Fit
          </p>
          <p className="text-xs leading-relaxed whitespace-pre-line text-foreground">
            {proposal.headline}
          </p>
        </div>
      )}

      {/* Timeline */}
      {proposal.nights && (
        <div className="mt-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Timeline
          </p>
          <p className="text-xs text-foreground">{proposal.nights} nights</p>
        </div>
      )}
    </div>
  );
}
