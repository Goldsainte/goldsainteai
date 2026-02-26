export type CommissionMode = "solo_creator" | "solo_agent" | "collab";

/** Platform fee constants — 7% total, split evenly */
export const HOST_FEE_PCT = 0.035; // 3.5% deducted from agent/creator
export const GUEST_FEE_PCT = 0.035; // 3.5% added to traveler
export const PLATFORM_TOTAL_PCT = HOST_FEE_PCT + GUEST_FEE_PCT; // 7%

export interface CommissionInput {
  totalPriceCents: number;
  commissionMode: CommissionMode;
  proposalCreatorPct?: number | null;
  proposalAgentPct?: number | null;
}

export interface CommissionBreakdown {
  platformPct: number;
  platformFeeAmount: number;
  creatorPct: number;
  creatorAmount: number;
  agentPct: number;
  agentAmount: number;
  hostFee: number;
  hostFeePct: number;
  guestFee: number;
  guestFeePct: number;
  travelerTotal: number;
}

export function calculateCommissions({
  totalPriceCents,
  commissionMode,
  proposalCreatorPct,
  proposalAgentPct,
}: CommissionInput): CommissionBreakdown {
  const total = Math.max(totalPriceCents || 0, 0);
  const platformPct = HOST_FEE_PCT; // host-side fee is always 3.5%
  const remainingPct = 1 - platformPct;

  let creatorPct = 0;
  let agentPct = 0;

  if (commissionMode === "collab") {
    const creatorProposal = proposalCreatorPct ?? null;
    const agentProposal = proposalAgentPct ?? null;
    const sum =
      creatorProposal != null && agentProposal != null
        ? creatorProposal + agentProposal
        : null;

    if (sum != null && Math.abs(sum - remainingPct * 100) < 0.01) {
      creatorPct = (creatorProposal ?? 0) / 100;
      agentPct = (agentProposal ?? 0) / 100;
    } else {
      creatorPct = remainingPct / 2;
      agentPct = remainingPct / 2;
    }
  } else if (commissionMode === "solo_creator") {
    creatorPct = remainingPct;
  } else if (commissionMode === "solo_agent") {
    agentPct = remainingPct;
  }

  const platformFeeAmount = Math.round(total * platformPct);
  const creatorAmount = Math.round(total * creatorPct);
  const agentAmount = Math.round(total * agentPct);

  const hostFee = Math.round(total * HOST_FEE_PCT);
  const guestFee = Math.round(total * GUEST_FEE_PCT);
  const travelerTotal = total + guestFee;

  return {
    platformPct: platformPct * 100,
    platformFeeAmount,
    creatorPct: creatorPct * 100,
    creatorAmount,
    agentPct: agentPct * 100,
    agentAmount,
    hostFee,
    hostFeePct: HOST_FEE_PCT * 100,
    guestFee,
    guestFeePct: GUEST_FEE_PCT * 100,
    travelerTotal,
  };
}

export function deriveCommissionMode(params: {
  creatorId?: string | null;
  agentId?: string | null;
}): CommissionMode {
  const hasCreator = Boolean(params.creatorId);
  const hasAgent = Boolean(params.agentId);

  if (hasCreator && hasAgent) return "collab";
  if (hasCreator) return "solo_creator";
  return "solo_agent";
}
