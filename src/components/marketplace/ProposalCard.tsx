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

  // Legal/commercial fields
  const cancellationPolicyId = (proposal as any).cancellation_policy_id as string | undefined;
  const customCancellationTerms = (proposal as any).custom_cancellation_terms as string | undefined;
  const depositPercentage = (proposal as any).deposit_percentage as number | undefined;
  const depositDueDays = (proposal as any).deposit_due_days as number | undefined;

  // Compute visual bands for inline pills
  let marginBandLabel: string | null = null;
  if (adminMarginPercent != null) {
    if (adminMarginPercent < 10) marginBandLabel = "Low margin";
    else if (adminMarginPercent <= 20) marginBandLabel = "Balanced";
    else marginBandLabel = "High margin";
  }

  const complexityLabel = adminComplexityScore != null 
    ? `Complexity ${adminComplexityScore}/10` 
    : null;

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
            
            {/* Admin-only triage pills */}
            {showAdminInsights && (marginBandLabel || complexityLabel) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {marginBandLabel && (
                  <span className="inline-flex items-center rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-neutral-50">
                    {marginBandLabel}
                  </span>
                )}
                {complexityLabel && (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                    {complexityLabel}
                  </span>
                )}
              </div>
            )}
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

      {/* Cancellation & Deposit Terms */}
      {(cancellationPolicyId || depositPercentage != null || customCancellationTerms) && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="text-xs font-medium text-foreground">Cancellation & Payment Terms</p>
          {cancellationPolicyId && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Standard cancellation policy applied
            </p>
          )}
          {depositPercentage != null && depositDueDays != null && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {depositPercentage}% deposit due within {depositDueDays} days of acceptance
            </p>
          )}
          {customCancellationTerms && (
            <p className="text-[11px] text-muted-foreground mt-2 italic leading-relaxed">
              {customCancellationTerms}
            </p>
          )}
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
