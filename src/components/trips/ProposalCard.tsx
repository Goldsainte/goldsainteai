import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Calendar, Users, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TripProposalStatus } from "@/services/proposalService";

interface Proposal {
  id: string;
  status: TripProposalStatus;
  headline: string | null;
  message: string | null;
  price_from: number | null;
  currency: string | null;
  nights: number | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  created_at: string;
  proposer_id: string;
  proposer_role: string;
}

interface ProposalCardProps {
  proposalId: string;
  isAccepted?: boolean;
  showAcceptButton?: boolean;
  tripRequestId?: string;
  onAccept?: () => void;
}

export function ProposalCard({
  proposalId,
  isAccepted = false,
  showAcceptButton = false,
  tripRequestId,
  onAccept,
}: ProposalCardProps) {
  const { toast } = useToast();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  // Load proposal data
  useState(() => {
    supabase
      .from("trip_proposals")
      .select("*")
      .eq("id", proposalId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load proposal", error);
          return;
        }
        setProposal(data as Proposal);
        setLoading(false);
      });
  });

  const handleAccept = async () => {
    if (!tripRequestId || !proposal) return;

    setAccepting(true);
    try {
      // 1. Update proposal status
      const { error: proposalError } = await supabase
        .from("trip_proposals")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", proposal.id);

      if (proposalError) throw proposalError;

      // 2. Update trip request
      const { error: tripError } = await supabase
        .from("trip_requests")
        .update({
          accepted_proposal_id: proposal.id,
          accepted_at: new Date().toISOString(),
          status: "in_progress",
        })
        .eq("id", tripRequestId);

      if (tripError) throw tripError;

      // 3. Create booking draft with commission calculations
      const { data: userData } = await supabase.auth.getUser();
      const totalPriceCents = proposal.price_from || 0;
      
      // Calculate 3.5% platform host fee
      const platformCommission = Math.round(totalPriceCents * 0.035);
      const partnerPayout = totalPriceCents - platformCommission;
      
      const { error: bookingError } = await supabase.from("trip_bookings").upsert(
        [{
          trip_request_id: tripRequestId,
          proposal_id: proposal.id,
          traveler_id: userData.user?.id || "",
          partner_id: proposal.proposer_id,
          partner_role: proposal.proposer_role || "creator_agent",
          total_price: totalPriceCents,
          platform_commission: platformCommission,
          partner_payout: partnerPayout,
          currency: proposal.currency || "usd",
          status: "pending",
        }] as any,
        { onConflict: "trip_request_id" }
      );

      if (bookingError) throw bookingError;

      toast({
        title: "Proposal accepted!",
        description: "The creator/agent will prepare your booking details.",
      });

      if (onAccept) onAccept();
    } catch (err) {
      console.error("Failed to accept proposal", err);
      toast({
        title: "Error",
        description: "Failed to accept proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#E5DFC6] bg-gradient-to-br from-blue-50/50 to-white p-4">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-full mb-3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="rounded-2xl border border-[#E5DFC6] bg-white p-4 text-xs text-[#8C8470]">
        Proposal not found
      </div>
    );
  }

  const statusColors: Record<TripProposalStatus, string> = {
    draft: "bg-[#F5F0E0] text-[#7A7151]",
    sent: "bg-[#F0F7F6] text-[#0c4d47]",
    traveler_review: "bg-purple-50 text-purple-700",
    accepted: "bg-emerald-50 text-emerald-700",
    declined: "bg-red-50 text-red-700",
    withdrawn: "bg-[#F5F0E0] text-[#7A7151]",
    expired: "bg-[#F5F0E0] text-[#7A7151]",
  };

  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-gradient-to-br from-blue-50/30 to-white p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`text-[10px] uppercase tracking-wide ${statusColors[proposal.status]}`}>
            {proposal.status === "traveler_review" ? "Under review" : proposal.status}
          </Badge>
          {isAccepted && (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
        </div>
        <p className="text-[10px] text-[#8C8470]">
          {new Date(proposal.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>

      {proposal.headline && (
        <h4 className="mb-2 text-sm font-semibold text-[#0a2225]">
          {proposal.headline}
        </h4>
      )}

      {proposal.message && (
        <p className="mb-3 whitespace-pre-line text-xs text-[#4a4a4a]">
          {proposal.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {proposal.price_from !== null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1 text-[11px] font-medium text-[#0a2225]">
            <DollarSign className="h-3 w-3 text-[#BFAD72]" />
            {proposal.currency?.toUpperCase() || "USD"}{" "}
            {(proposal.price_from / 100).toLocaleString()}
          </span>
        )}
        {proposal.nights !== null && proposal.nights > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1 text-[11px] font-medium text-[#0a2225]">
            <Calendar className="h-3 w-3 text-[#BFAD72]" />
            {proposal.nights} nights
          </span>
        )}
      </div>

      {((proposal.inclusions && proposal.inclusions.length > 0) || (proposal.exclusions && proposal.exclusions.length > 0)) && (
        <div className="space-y-2 border-t border-[#E5DFC6] pt-3 text-[11px]">
          {proposal.inclusions && proposal.inclusions.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-[#7A7151] uppercase tracking-wide">
                Included
              </p>
              <p className="text-[#4a4a4a] whitespace-pre-line">{proposal.inclusions.join(', ')}</p>
            </div>
          )}
          {proposal.exclusions && proposal.exclusions.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-[#7A7151] uppercase tracking-wide">
                Not included
              </p>
              <p className="text-[#4a4a4a] whitespace-pre-line">{proposal.exclusions.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {showAcceptButton && !isAccepted && proposal.status === "sent" && (
        <div className="mt-4 border-t border-[#E5DFC6] pt-3">
          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-[#0a2225] text-[#E5DFC6] hover:bg-[#0a2225]/90"
            size="sm"
          >
            {accepting ? "Accepting..." : "Accept this proposal"}
          </Button>
        </div>
      )}

      {isAccepted && (
        <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
          <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Proposal accepted
          </p>
          <p className="mt-1 text-[10px] text-emerald-600">
            Your creator/agent will prepare the booking details.
          </p>
        </div>
      )}
    </div>
  );
}
