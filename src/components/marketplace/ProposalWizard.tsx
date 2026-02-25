import { useState } from "react";
import { Link } from "react-router-dom";
import { DollarSign, FileText, User, Shield, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { LuxuryStepIndicator } from "@/components/onboarding/LuxuryStepIndicator";
import { CancellationPolicySelector } from "@/components/CancellationPolicySelector";
import { Checkbox } from "@/components/ui/checkbox";
import { MarketplaceDisclaimer } from "@/components/policies/MarketplaceDisclaimer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const luxuryInputClass =
  "w-full rounded-xl border border-[#E5DFC6] bg-[#FDFBF5] px-4 py-3 text-sm text-[#0a2225] placeholder:text-[#9A9079] focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50 focus:border-[#C7A962] transition-colors";

const STEPS = [
  { title: "Pricing", icon: DollarSign },
  { title: "Itinerary", icon: FileText },
  { title: "Why You", icon: User },
  { title: "Confirm", icon: Shield },
];

interface ProposalState {
  priceFrom: string;
  priceTo: string;
  timelineLabel: string;
  message: string;
  included: string;
  notIncluded: string;
  itineraryOverview: string;
  fitReason: string;
  cancellationPolicyId: string;
  customCancellationTerms: string;
  depositPercentage: string;
  depositDueDays: string;
  ackGoldsaintePolicies: boolean;
  ackAgentCancellation: boolean;
}

interface ProposalWizardProps {
  newProposal: ProposalState;
  setNewProposal: React.Dispatch<React.SetStateAction<ProposalState>>;
  onSubmit: (e: React.FormEvent) => void;
  submittingProposal: boolean;
  proposalsCount: number;
}

export function ProposalWizard({
  newProposal,
  setNewProposal,
  onSubmit,
  submittingProposal,
  proposalsCount,
}: ProposalWizardProps) {
  const [step, setStep] = useState(0);

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 0:
        if (!newProposal.priceFrom || parseFloat(newProposal.priceFrom) <= 0) {
          toast.error("Please enter a price greater than 0");
          return false;
        }
        return true;
      case 1:
        if (!newProposal.itineraryOverview.trim()) {
          toast.error("Please provide an itinerary overview");
          return false;
        }
        return true;
      case 2:
        if (!newProposal.fitReason.trim()) {
          toast.error("Please explain why you're a great fit");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleStepClick = (s: number) => {
    if (s <= step) setStep(s);
  };

  const formatPrice = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? "—" : `$${n.toLocaleString()}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
          Ready to propose?
        </p>
        <h2 className="mt-1 font-secondary text-lg text-[#0a2225]">Submit your proposal</h2>
        <p className="mt-1 text-sm text-[#6B7280] leading-relaxed max-w-lg">
          {proposalsCount > 0
            ? `${proposalsCount} ${proposalsCount === 1 ? "proposal has" : "proposals have"} already been submitted — stand out with yours.`
            : "Be the first to submit a proposal for this trip."}
        </p>
      </div>

      {/* Step indicator */}
      <LuxuryStepIndicator steps={STEPS} currentStep={step} onStepClick={handleStepClick} />
      <p className="text-center text-xs text-[#9A9079]">
        Step {step + 1} of 4 — {STEPS[step].title}
      </p>

      {/* Step content */}
      <form onSubmit={onSubmit}>
        <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5 md:p-6 shadow-sm transition-opacity duration-200">
          {/* Step 0: Pricing */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="font-secondary text-base text-[#0a2225]">Pricing & Timeline</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-medium text-sm text-[#0a2225]">Price (USD) *</label>
                  <input
                    type="number"
                    min={0}
                    className={luxuryInputClass}
                    placeholder="e.g. 6500"
                    value={newProposal.priceFrom}
                    onChange={(e) => setNewProposal((p) => ({ ...p, priceFrom: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-sm text-[#0a2225]">Timeline (days)</label>
                  <input
                    type="text"
                    className={luxuryInputClass}
                    placeholder="e.g. 3–5"
                    value={newProposal.timelineLabel}
                    onChange={(e) => setNewProposal((p) => ({ ...p, timelineLabel: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-medium text-sm text-[#0a2225]">Deposit (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={luxuryInputClass}
                    placeholder="e.g. 30"
                    value={newProposal.depositPercentage}
                    onChange={(e) => setNewProposal((p) => ({ ...p, depositPercentage: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-sm text-[#0a2225]">Deposit due (days)</label>
                  <input
                    type="number"
                    min={0}
                    className={luxuryInputClass}
                    placeholder="e.g. 3"
                    value={newProposal.depositDueDays}
                    onChange={(e) => setNewProposal((p) => ({ ...p, depositDueDays: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Itinerary */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-secondary text-base text-[#0a2225]">What's Included</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-medium text-sm text-[#0a2225]">Included</label>
                  <textarea
                    rows={3}
                    className={luxuryInputClass}
                    placeholder="Hotels, transfers, breakfast, guided experiences…"
                    value={newProposal.included}
                    onChange={(e) => setNewProposal((p) => ({ ...p, included: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-sm text-[#0a2225]">Not included</label>
                  <textarea
                    rows={3}
                    className={luxuryInputClass}
                    placeholder="Flights, travel insurance, most dinners…"
                    value={newProposal.notIncluded}
                    onChange={(e) => setNewProposal((p) => ({ ...p, notIncluded: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-sm text-[#0a2225]">Itinerary overview *</label>
                <textarea
                  rows={4}
                  className={luxuryInputClass}
                  placeholder="Day 1: Arrival · Day 2: Private yacht · Day 3: Wine country…"
                  value={newProposal.itineraryOverview}
                  onChange={(e) => setNewProposal((p) => ({ ...p, itineraryOverview: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 2: Fit */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-secondary text-base text-[#0a2225]">Why You</h3>
              <div className="space-y-1.5">
                <label className="font-medium text-sm text-[#0a2225]">Why you're a great fit *</label>
                <textarea
                  rows={5}
                  className={luxuryInputClass}
                  placeholder="Your expertise, hotel partners, on-the-ground connections…"
                  value={newProposal.fitReason}
                  onChange={(e) => setNewProposal((p) => ({ ...p, fitReason: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="font-secondary text-base text-[#0a2225]">Review & Confirm</h3>

              {/* Summary */}
              <div className="rounded-xl border border-[#E5DFC6] bg-[#FDFBF5] p-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9A9079]">Price</span>
                  <span className="font-semibold text-[#0a2225]">{formatPrice(newProposal.priceFrom)}</span>
                </div>
                {newProposal.timelineLabel && (
                  <div className="flex justify-between">
                    <span className="text-[#9A9079]">Timeline</span>
                    <span className="text-[#0a2225]">{newProposal.timelineLabel} days</span>
                  </div>
                )}
                {newProposal.depositPercentage && (
                  <div className="flex justify-between">
                    <span className="text-[#9A9079]">Deposit</span>
                    <span className="text-[#0a2225]">{newProposal.depositPercentage}%{newProposal.depositDueDays ? ` due in ${newProposal.depositDueDays} days` : ""}</span>
                  </div>
                )}
                {newProposal.itineraryOverview && (
                  <div className="border-t border-[#E5DFC6] pt-2.5">
                    <span className="text-[#9A9079] text-xs">Itinerary</span>
                    <p className="mt-0.5 text-[#0a2225] text-xs leading-relaxed line-clamp-3">{newProposal.itineraryOverview}</p>
                  </div>
                )}
                {newProposal.fitReason && (
                  <div className="border-t border-[#E5DFC6] pt-2.5">
                    <span className="text-[#9A9079] text-xs">Why you</span>
                    <p className="mt-0.5 text-[#0a2225] text-xs leading-relaxed line-clamp-2">{newProposal.fitReason}</p>
                  </div>
                )}
              </div>

              {/* Cancellation policy */}
              <CancellationPolicySelector
                selectedPolicyId={newProposal.cancellationPolicyId || undefined}
                onPolicySelect={(policyId) => setNewProposal((p) => ({ ...p, cancellationPolicyId: policyId }))}
              />
              <div className="space-y-1.5">
                <label className="font-medium text-sm text-[#0a2225]">Additional cancellation terms (optional)</label>
                <textarea
                  rows={2}
                  className={luxuryInputClass}
                  placeholder="Blackout dates, non-refundable elements…"
                  value={newProposal.customCancellationTerms}
                  onChange={(e) => setNewProposal((p) => ({ ...p, customCancellationTerms: e.target.value }))}
                />
              </div>

              {/* Acknowledgements */}
              <div className="space-y-3 rounded-xl border border-[#E5DFC6] bg-[#FDFBF5] px-4 py-3">
                <p className="text-sm font-semibold text-[#0a2225]">Policy acknowledgements</p>
                <label className="flex items-start gap-2 text-xs text-[#6B7280] leading-relaxed">
                  <Checkbox
                    checked={newProposal.ackGoldsaintePolicies}
                    onCheckedChange={(checked) => setNewProposal((p) => ({ ...p, ackGoldsaintePolicies: Boolean(checked) }))}
                  />
                  <span>
                    I understand that Goldsainte operates as a marketplace and I am solely responsible for trip delivery. I've reviewed the{" "}
                    <Link to="/cancellation-refund-policy" className="underline underline-offset-2 text-[#7A7151]" target="_blank">Cancellation Policy</Link>{" "}and{" "}
                    <Link to="/terms" className="underline underline-offset-2 text-[#7A7151]" target="_blank">Terms</Link>.
                  </span>
                </label>
                <label className="flex items-start gap-2 text-xs text-[#6B7280] leading-relaxed">
                  <Checkbox
                    checked={newProposal.ackAgentCancellation}
                    onCheckedChange={(checked) => setNewProposal((p) => ({ ...p, ackAgentCancellation: Boolean(checked) }))}
                  />
                  <span>I confirm the cancellation, refund, and deposit terms in this proposal are accurate and will be honored.</span>
                </label>
              </div>

              <MarketplaceDisclaimer size="sm" />
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-white px-5 py-2.5 text-sm font-medium text-[#0a2225] transition hover:bg-[#FDFBF5]"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0c4d47]/90"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submittingProposal || !newProposal.ackGoldsaintePolicies || !newProposal.ackAgentCancellation}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-7 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0c4d47]/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingProposal ? "Submitting…" : "Submit proposal"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
