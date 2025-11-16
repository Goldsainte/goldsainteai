import { Star, MessageCircle, CheckCircle } from "lucide-react";
import type { Proposal } from "@/pages/marketplace/TripRequestDetail";

interface ProposalCardProps {
  proposal: Proposal;
  onAccept: () => void;
  onOpenChat: () => void;
  formattedBudgetRange: string;
  isRequestOwner: boolean;
}

export function ProposalCard({
  proposal,
  onAccept,
  onOpenChat,
  formattedBudgetRange,
  isRequestOwner,
}: ProposalCardProps) {
  const isAccepted = proposal.status === "accepted";
  const isDeclined = proposal.status === "declined";

  return (
    <article className="rounded-2xl bg-white p-4 text-xs shadow-sm ring-1 ring-neutral-200/80">
      {/* Header: avatar + author info + rating */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-700">
          {proposal.avatarInitials}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-semibold text-neutral-900">
              {proposal.authorName}
            </h3>
            {proposal.handle && (
              <span className="text-[11px] text-neutral-500">
                {proposal.handle}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium capitalize text-neutral-700">
              {proposal.authorType === "agent"
                ? "Certified agent"
                : "Travel creator"}
            </span>
            {isAccepted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                <CheckCircle className="h-3 w-3" />
                Accepted
              </span>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-neutral-600">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium">{proposal.rating.toFixed(1)}</span>
            </div>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-500">
              {proposal.reviewsCount} reviews
            </span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-500">
              Sent {new Date(proposal.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Status pill */}
        {isDeclined && (
          <span className="inline-flex rounded-full bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-400 ring-1 ring-neutral-200">
            Declined
          </span>
        )}
      </div>

      {/* Budget + timeline */}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="space-y-0.5">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">
            Estimated budget
          </p>
          <p className="text-sm font-semibold text-neutral-900">
            {formattedBudgetRange}
          </p>
          <p className="text-[11px] text-neutral-500">
            Final price depends on selection.
          </p>
        </div>

        <div className="space-y-0.5 md:col-span-2">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">
            Timeline
          </p>
          <p className="text-xs text-neutral-700">{proposal.timelineLabel}</p>
        </div>
      </div>

      {/* Highlights */}
      {proposal.highlights && proposal.highlights.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">
            Highlights
          </p>
          <ul className="mt-1 space-y-0.5 text-[11px] text-neutral-700">
            {proposal.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-neutral-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Message */}
      <div className="mt-3 border-t border-neutral-100 pt-3">
        <p className="text-[11px] uppercase tracking-wide text-neutral-400">
          Proposal details
        </p>
        <p className="mt-1 whitespace-pre-line text-xs text-neutral-700">
          {proposal.message}
        </p>
      </div>

      {/* Policy notice for travelers */}
      {isRequestOwner && !isDeclined && !isAccepted && (
        <div className="mt-3 rounded-2xl bg-neutral-50 border border-neutral-200 p-2.5 text-[10px] text-neutral-600">
          <p>
            <span className="font-semibold text-neutral-900">
              By accepting this proposal
            </span>
            , your trip and payments stay protected by Goldsainte.
          </p>
          <p className="mt-1">
            For your safety, please do not send direct bank transfers or share
            phone numbers to finalize payment. All payments and changes should
            go through this platform.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenChat}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-300 hover:text-neutral-900"
        >
          <MessageCircle className="h-3 w-3" />
          Message
        </button>

        {isRequestOwner && (
          <button
            type="button"
            onClick={onAccept}
            disabled={isAccepted || isDeclined}
            className={[
              "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors",
              isAccepted || isDeclined
                ? "cursor-not-allowed bg-neutral-200 text-neutral-500"
                : "bg-neutral-900 text-white hover:bg-neutral-800",
            ].join(" ")}
          >
            {isAccepted ? "Accepted" : "Accept proposal"}
          </button>
        )}
      </div>
    </article>
  );
}
