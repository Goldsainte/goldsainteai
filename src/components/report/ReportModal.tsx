// src/components/report/ReportModal.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  context: {
    conversationId?: string;
    messageId?: string;
    bookingId?: string;
    reportedUserId?: string;
  };
};

const REASONS: { value: string; label: string }[] = [
  { value: "off_platform_contact", label: "Trying to move off Goldsainte" },
  { value: "payment_issue", label: "Asking for direct payments / external links" },
  { value: "harassment", label: "Harassment or inappropriate behavior" },
  { value: "spam", label: "Spam or irrelevant content" },
  { value: "other", label: "Something else" },
];

export function ReportModal({ isOpen, onClose, context }: ReportModalProps) {
  const [reason, setReason] = useState<string>("off_platform_contact");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You need to be signed in to submit a report.");
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: context.reportedUserId ?? null,
        conversation_id: context.conversationId ?? null,
        message_id: context.messageId ?? null,
        booking_id: context.bookingId ?? null,
        report_type: reason,
        description: details || null,
      });

      if (insertError) {
        console.error(insertError);
        setError("We couldn't submit your report. Please try again.");
      } else {
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedReasonLabel =
    REASONS.find((r) => r.value === reason)?.label || "your report";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-[#0a2225] text-[#E5DFC6] border border-[#BFAD72]/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold">Report an issue</p>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] text-[#E5DFC6]/70 hover:text-[#E5DFC6]"
          >
            Close
          </button>
        </div>

        {submitted ? (
          <div className="space-y-2 text-[11px]">
            <p className="font-semibold">Thank you. We've received this.</p>
            <p className="text-[#E5DFC6]/80">
              Our team will review this conversation and may reach out if we
              need more detail. For your safety, consider pausing communication
              on this trip until we've had a chance to look.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-[#BFAD72] text-[#0a2225] px-3 py-1.5 text-[11px] font-semibold hover:bg-[#d4c58d]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase tracking-[0.16em] text-[#E5DFC6]/70">
                What's going on?
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-2xl border border-[#31434a] bg-[#061215] px-3 py-2 text-[11px] outline-none"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-[#E5DFC6]/80">
                Anything else we should know? (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-[#31434a] bg-[#061215] px-3 py-2 text-[11px] outline-none"
                placeholder="E.g. They asked me to send payment to a personal account, or to move to another app."
              />
            </div>

            {error && (
              <p className="text-[10px] text-red-400">{error}</p>
            )}

            <p className="text-[10px] text-[#E5DFC6]/60">
              We'll only use this report to review this conversation and your
              trip, and to keep Goldsainte safe for travelers, creators and
              agents.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-full bg-[#BFAD72] text-[#0a2225] px-3 py-1.5 text-[11px] font-semibold hover:bg-[#d4c58d] disabled:opacity-50"
            >
              {submitting ? "Sending…" : `Submit ${selectedReasonLabel}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
