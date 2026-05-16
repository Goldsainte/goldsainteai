import { MessageSquare, DollarSign, CheckCircle } from "lucide-react";

interface AgentMyBidsTabProps {
  myBids: any[];
  onMessage: (job: any) => void;
  onPaymentDetails: (bid: any) => void;
  onSubmitCompletion: (job: any) => void;
}

export function AgentMyBidsTab({ myBids, onMessage, onPaymentDetails, onSubmitCompletion }: AgentMyBidsTabProps) {
  if (myBids.length === 0) {
    return (
      <div className="bg-white border border-[#E5DFC6] rounded-2xl p-12 text-center">
        <h3 className="font-secondary text-2xl text-[#0a2225] mb-2">No proposals yet</h3>
        <p className="text-sm text-[#6B7280]">Submit your first proposal from the Available Jobs tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {myBids.map((bid) => (
        <div key={bid.id} className="bg-white border border-[#E5DFC6] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="pr-4">
              <h3 className="font-secondary text-xl text-[#0a2225] mb-1">{bid.marketplace_jobs?.title}</h3>
              <p className="text-sm text-[#6B7280]">{bid.marketplace_jobs?.destination}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs whitespace-nowrap ${
                  bid.status === "accepted"
                    ? "bg-[#0c4d47] text-[#E5DFC6]"
                    : bid.status === "rejected"
                    ? "bg-[#fce7e6] text-[#a02622]"
                    : "bg-[#FDF9F0] border border-[#E5DFC6] text-[#0a2225]"
                }`}
              >
                {bid.status}
              </span>
              {bid.marketplace_jobs?.status && (
                <span className="inline-flex items-center rounded-full bg-[#FDF9F0] border border-[#E5DFC6] px-3 py-1 text-xs text-[#0a2225] whitespace-nowrap">
                  Trip: {bid.marketplace_jobs.status.replace("_", " ")}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Your proposal:</span>
              <span className="font-medium text-[#0a2225]">{bid.currency} {bid.proposed_price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Completion time:</span>
              <span className="text-[#0a2225]">{bid.estimated_completion_days} days</span>
            </div>
            <p className="text-sm text-[#0a2225] mt-3 leading-relaxed">{bid.proposal_details}</p>

            {bid.status === "accepted" && (
              <div className="flex flex-wrap gap-2 mt-5">
                <button
                  onClick={() => onMessage(bid.marketplace_jobs)}
                  className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-full border border-[#0a2225] px-5 py-2.5 text-sm text-[#0a2225] hover:bg-[#0a2225] hover:text-white transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message traveler
                </button>
                <button
                  onClick={() => onPaymentDetails(bid)}
                  className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-full border border-[#0a2225] px-5 py-2.5 text-sm text-[#0a2225] hover:bg-[#0a2225] hover:text-white transition-colors"
                >
                  <DollarSign className="h-4 w-4" />
                  Payment details
                </button>
                {bid.marketplace_jobs?.status === "in_progress" && (
                  <button
                    onClick={() => onSubmitCompletion(bid.marketplace_jobs)}
                    className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-5 py-2.5 text-sm text-[#E5DFC6] hover:bg-[#0a3d39] transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Submit completion
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}