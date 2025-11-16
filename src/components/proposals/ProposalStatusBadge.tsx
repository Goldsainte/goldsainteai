// src/components/proposals/ProposalStatusBadge.tsx
import { TripProposalStatus } from "@/services/proposalService";

export function ProposalStatusBadge({ status }: { status: TripProposalStatus }) {
  const { label, bg, text } = mapStatus(status);

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px]"
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  );
}

function mapStatus(status: TripProposalStatus) {
  switch (status) {
    case "draft":
      return {
        label: "Draft (not sent)",
        bg: "#f6f3ea",
        text: "#4a4a4a",
      };
    case "sent":
      return {
        label: "Sent · awaiting review",
        bg: "#d4e7dd",
        text: "#0c4d47",
      };
    case "traveler_review":
      return {
        label: "Traveler reviewing",
        bg: "#f5e9c5",
        text: "#6d5223",
      };
    case "accepted":
      return {
        label: "Accepted · proceed to payment",
        bg: "#cfe8d7",
        text: "#0c4d47",
      };
    case "declined":
      return {
        label: "Declined",
        bg: "#f0d1d1",
        text: "#5b2c2c",
      };
    case "expired":
      return {
        label: "Expired",
        bg: "#e2e2e2",
        text: "#555555",
      };
    case "withdrawn":
      return {
        label: "Withdrawn",
        bg: "#e2e2e2",
        text: "#555555",
      };
    default:
      return {
        label: status,
        bg: "#e2e2e2",
        text: "#555555",
      };
  }
}
