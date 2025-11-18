import { addDays, subDays } from "date-fns";

const DEFAULT_TEMPLATE = [
  { label: "Booking confirmation", percentage: 20, timing: "creation" as const },
  { label: "Pre-departure check-in", percentage: 30, timing: "departure_minus_7" as const },
  { label: "Trip completion", percentage: 50, timing: "completion" as const },
];

export interface BuildMilestonesArgs {
  bookingId: string;
  createdAt?: string;
  departureDate?: string | null;
  completionDate?: string | null;
}

export function buildDefaultMilestones({
  bookingId,
  createdAt,
  departureDate,
  completionDate,
}: BuildMilestonesArgs) {
  const createdDate = createdAt ? new Date(createdAt) : new Date();
  const departure = departureDate ? new Date(departureDate) : null;
  const completion = completionDate ? new Date(completionDate) : null;

  return DEFAULT_TEMPLATE.map((entry) => {
    let dueDate = createdDate;

    if (entry.timing === "departure_minus_7" && departure) {
      dueDate = subDays(departure, 7);
    }

    if (entry.timing === "completion" && completion) {
      dueDate = completion;
    } else if (entry.timing === "completion" && departure) {
      dueDate = addDays(departure, 1);
    }

    return {
      booking_id: bookingId,
      label: entry.label,
      percentage: entry.percentage,
      due_at: dueDate.toISOString(),
      status: "PENDING" as const,
    };
  });
}

export function calculateMilestoneAmount(
  partnerAmountCents: number,
  percentage: number,
) {
  const pct = Math.max(percentage, 0) / 100;
  return Math.round(Math.max(partnerAmountCents, 0) * pct);
}
