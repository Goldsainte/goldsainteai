export type CommissionMode = "solo_creator" | "solo_agent" | "collab";

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
}

export function calculateCommissions({
  totalPriceCents,
  commissionMode,
  proposalCreatorPct,
  proposalAgentPct,
}: CommissionInput): CommissionBreakdown {
  const total = Math.max(totalPriceCents || 0, 0);
  const platformPct = commissionMode === "collab" ? 0.15 : 0.2;
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

  return {
    platformPct: platformPct * 100,
    platformFeeAmount,
    creatorPct: creatorPct * 100,
    creatorAmount,
    agentPct: agentPct * 100,
    agentAmount,
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
