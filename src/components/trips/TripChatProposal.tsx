import { ProposalCard } from "./ProposalCard";

interface TripChatProposalProps {
  proposalId: string;
  isAccepted?: boolean;
  showAcceptButton?: boolean;
  tripRequestId?: string;
  onAccepted?: () => void;
}

export function TripChatProposal({
  proposalId,
  isAccepted,
  showAcceptButton,
  tripRequestId,
  onAccepted,
}: TripChatProposalProps) {
  return (
    <div className="my-3">
      <ProposalCard
        proposalId={proposalId}
        isAccepted={isAccepted}
        showAcceptButton={showAcceptButton}
        tripRequestId={tripRequestId}
        onAccept={onAccepted}
      />
    </div>
  );
}
