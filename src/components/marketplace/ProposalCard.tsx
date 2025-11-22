import { UserCircle } from "lucide-react";

interface ProposalCardProps {
  proposal: any;
  showAdminInsights?: boolean; // when true, show internal/admin-only fields
}

export default function ProposalCard({ proposal, showAdminInsights = false }: ProposalCardProps) {
  // Optional admin fields – these are internal-only and safe to ignore if null/undefined
  const adminMarginAmount = proposal.admin_margin_amount as number | undefined;
  const adminMarginPercent = proposal.admin_margin_percent as number | undefined;
  const adminCostBasis = proposal.admin_cost_basis as number | undefined;
  const adminComplexityScore = proposal.admin_complexity_score as number | undefined;
  const adminSupplierNotes = proposal.admin_supplier_notes as string | undefined;

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
            {proposal.price_from != null ? `$${proposal.price_from.toLocaleString()}` : "—"}
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
            What&apos;s Included
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
            Why They&apos;re a Great Fit
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

      {/* ADMIN-ONLY INSIGHTS */}
      {showAdminInsights && (
        <>
          <div className="mt-5 h-px w-full bg-border" />

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Admin insights
              </p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                Not visible to traveler
              </p>
            </div>

            {/* Metrics grid */}
            <div className="grid gap-3 md:grid-cols-3">
              {/* Margin amount */}
              <div className="space-y-1 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Margin (est.)
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {adminMarginAmount != null ? `$${adminMarginAmount.toLocaleString()}` : "—"}
                  {adminMarginPercent != null && (
                    <span className="ml-1 text-[11px] text-muted-foreground">
                      ({adminMarginPercent}%)
                    </span>
                  )}
                </p>
              </div>

              {/* Cost basis */}
              <div className="space-y-1 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Cost basis (est.)
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {adminCostBasis != null ? `$${adminCostBasis.toLocaleString()}` : "—"}
                </p>
              </div>

              {/* Complexity */}
              <div className="space-y-1 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Complexity score
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {adminComplexityScore != null ? `${adminComplexityScore}/10` : "—"}
                </p>
              </div>
            </div>

            {/* Supplier / internal notes */}
            {adminSupplierNotes && (
              <div className="space-y-1 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Supplier / internal notes
                </p>
                <p className="text-[11px] leading-relaxed whitespace-pre-line text-muted-foreground">
                  {adminSupplierNotes}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
