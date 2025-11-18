export interface CancellationEvaluation {
  refundPercentage: number;
  partnerPayoutPercentage: number;
  appliedRule: string;
}

export function evaluateCancellationWindow(options: {
  rules: Record<string, number>;
  departureDate: string;
  cancelledAt: string;
}): CancellationEvaluation {
  const { rules, departureDate, cancelledAt } = options;
  const departure = new Date(departureDate).getTime();
  const cancelled = new Date(cancelledAt).getTime();
  const diffMs = departure - cancelled;
  const daysBefore = Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);

  const sortedKeys = Object.keys(rules);
  let appliedKey = sortedKeys[0] ?? "";
  let penalty = 0;

  for (const key of sortedKeys) {
    if (matchesRuleBand(key, daysBefore)) {
      appliedKey = key;
      penalty = Number(rules[key] ?? 0);
      break;
    }
  }

  const clampedPenalty = Math.min(Math.max(penalty, 0), 1);
  const partnerPayoutPercentage = clampedPenalty;
  const refundPercentage = 1 - clampedPenalty;

  return {
    refundPercentage,
    partnerPayoutPercentage,
    appliedRule: appliedKey,
  };
}

function matchesRuleBand(rule: string, daysBefore: number) {
  if (rule.includes("-")) {
    const [min, max] = rule.split("-").map((v) => Number(v.replace(/\D/g, "")));
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      return daysBefore >= min && daysBefore <= max;
    }
  }

  if (rule.includes("+")) {
    const value = Number(rule.replace(/\D/g, ""));
    if (!Number.isNaN(value)) {
      return daysBefore >= value;
    }
  }

  if (rule.startsWith("<")) {
    const value = Number(rule.replace(/\D/g, ""));
    if (!Number.isNaN(value)) {
      return daysBefore < value;
    }
  }

  return false;
}
