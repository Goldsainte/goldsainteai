import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  capLabel,
  CAPABILITY_PROPOSAL_FIELDS,
  type ProposalField,
} from "@/lib/onTripCapabilities";

// ============================================================================
// HIRE PROPOSAL COMPOSER — the creator's reply to being hired, built for the
// hire economy instead of masked out of the agent wizard. Its questions come
// from the capability taxonomy: a content-creation hire asks content
// questions, a photography hire asks photography questions. It writes the
// EXACT trip_proposals row the wizard writes, so the message card, accept,
// deposit, and escrow are untouched downstream.
// ============================================================================

const F =
  "w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-[15px] text-[#0a2225] placeholder:text-[#0a2225]/35 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50";

interface Props {
  tripData: any;
  userId: string;
  hireCaps: string[];
  hireRate: number | null;
  hireDays: number;
  hireEstimate: number | null;
}

export function HireProposalComposer({ tripData, userId, hireCaps, hireRate, hireDays, hireEstimate }: Props) {
  const navigate = useNavigate();
  const isCreator = Boolean(tripData?.preferred_creator_id);

  const [message, setMessage] = useState("");
  const [price, setPrice] = useState<string>(hireEstimate ? String(hireEstimate) : "");
  const [depositPct, setDepositPct] = useState<string>("25");
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [expenseLines, setExpenseLines] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Restate the creator's own expense terms — these become the proposal's
  // "traveler covers" record so acceptance memorializes the money agreement.
  useEffect(() => {
    (async () => {
      try {
        const { data: svc } = await (supabase
          .from("creator_services")
          .select("expense_travel, expense_lodging, expense_meals" as any)
          .eq("creator_id", userId)
          .eq("service_tier", "on_trip")
          .limit(1) as any);
        const s: any = (svc as any)?.[0];
        const lines: string[] = [];
        const place = (v: string | null | undefined, label: string) => {
          if (v === "traveler") lines.push(`${label} \u2014 traveler covers`);
          else if (v === "split") lines.push(`${label} \u2014 each our own`);
        };
        place(s?.expense_travel, "Flights & transport");
        place(s?.expense_lodging, "Lodging");
        place(s?.expense_meals, "Meals");
        setExpenseLines(lines);
      } catch {
        /* terms restatement is best-effort */
      }
    })();
  }, [userId]);

  const setAnswer = (cap: string, field: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [cap]: { ...(prev[cap] || {}), [field]: value } }));

  const priceNum = parseFloat(price);
  const payout = Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum * 0.93) : null;

  const deliverableLines = useMemo(() => {
    const lines: string[] = [];
    for (const cap of hireCaps) {
      lines.push(capLabel(cap));
      const fields = CAPABILITY_PROPOSAL_FIELDS[cap] || [];
      for (const f of fields) {
        const v = (answers[cap]?.[f.id] || "").trim();
        if (v) lines.push(`${f.label}: ${v}${f.suffix ? ` ${f.suffix}` : ""}`);
      }
    }
    return lines;
  }, [hireCaps, answers]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Add a short reply \u2014 confirm you're free and how you'll host the days.");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("Set your total for the trip.");
      return;
    }
    const dep = parseFloat(depositPct);
    if (!Number.isFinite(dep) || dep <= 0 || dep >= 100) {
      toast.error("Deposit must be between 1 and 99 percent.");
      return;
    }
    setSubmitting(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 14);
      const paymentSchedule = [
        { name: "Deposit", percentage: dep, due: "On acceptance" },
        { name: "Balance", percentage: 100 - dep, due: "Before the trip" },
      ];
      const payload: any = {
        trip_request_id: tripData.id,
        proposer_id: userId,
        proposer_role: isCreator ? "creator" : "agent",
        headline: `${tripData?.source_metadata?.hire_service_title || "On-trip hosting"} \u2014 ${tripData.destination || "your trip"}`,
        message: message.trim(),
        itinerary_summary: null,
        price_from: priceNum,
        currency: "USD",
        deposit_percentage: dep,
        deposit_due_days: 3,
        nights: null,
        inclusions: deliverableLines.length > 0 ? deliverableLines : null,
        exclusions: expenseLines.length > 0 ? expenseLines : null,
        custom_cancellation_terms: null,
        price_breakdown: {
          pricing_type: "total",
          hire: {
            capabilities: hireCaps,
            answers,
            day_rate: hireRate,
            trip_days: hireDays,
          },
        },
        payment_schedule: paymentSchedule,
        valid_until: validUntil.toISOString(),
        status: "sent",
        ...(isCreator ? { creator_id: userId } : { agent_id: userId }),
      };
      const { data, error } = await supabase.from("trip_proposals").insert(payload).select("id").single();
      if (error) throw error;
      toast.success("Proposal sent");
      navigate(`/proposals/${(data as any).id}`);
    } catch (err: any) {
      toast.error("Couldn't send your proposal" + (err?.message ? `: ${err.message}` : ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF9F0] px-4 py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F]">Your reply</p>
        <h1 className="mt-2 font-secondary text-2xl leading-tight text-[#0a2225] md:text-3xl">
          Hired for {hireCaps.length > 0 ? hireCaps.map(capLabel).join(", ") : "your trip"}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#0a2225]/70">
          {tripData?.destination}
          {hireDays > 0 ? `, ${hireDays} days` : ""}
          {hireRate ? ` \u00b7 your listed rate $${hireRate}/day` : ""}
          {hireEstimate ? ` \u00b7 \u2248 $${hireEstimate.toLocaleString()} total` : ""}
          {" \u2014 no itinerary needed. Confirm, scope it, price it."}
        </p>

        <div className="mt-8 space-y-8">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#0a2225]">Your message *</label>
            <textarea
              rows={3}
              className={F}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Confirm you're free for these dates and how you'll host the days…"
            />
          </div>

          {hireCaps.map((cap) => {
            const fields: ProposalField[] = CAPABILITY_PROPOSAL_FIELDS[cap] || [];
            return (
              <div key={cap} className="border-t border-[#E5DFC6] pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F]">{capLabel(cap)}</p>
                {fields.length === 0 ? (
                  <p className="mt-2 text-[13.5px] text-[#0a2225]/60">Covered by your hosted days — nothing extra to define.</p>
                ) : (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {fields.map((f) => (
                      <div key={f.id} className={f.type === "text" ? "sm:col-span-2" : ""}>
                        <label className="mb-1 block text-[12.5px] text-[#0a2225]/70">
                          {f.label}
                          {f.suffix ? <span className="text-[#0a2225]/40"> ({f.suffix})</span> : null}
                        </label>
                        {f.type === "select" ? (
                          <select
                            className={F}
                            value={answers[cap]?.[f.id] || ""}
                            onChange={(e) => setAnswer(cap, f.id, e.target.value)}
                          >
                            <option value="">Choose…</option>
                            {(f.options || []).map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.type === "number" ? "number" : "text"}
                            min={f.type === "number" ? "0" : undefined}
                            className={F}
                            value={answers[cap]?.[f.id] || ""}
                            onChange={(e) => setAnswer(cap, f.id, e.target.value)}
                            placeholder={f.placeholder}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="border-t border-[#E5DFC6] pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F]">Price</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12.5px] text-[#0a2225]/70">
                  Total for the trip{hireDays > 0 && hireRate ? ` (\u2248 ${hireDays} \u00d7 $${hireRate}/day)` : ""} *
                </label>
                <input type="number" min="0" className={F} value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[12.5px] text-[#0a2225]/70">Deposit on acceptance (%)</label>
                <input type="number" min="1" max="99" className={F} value={depositPct} onChange={(e) => setDepositPct(e.target.value)} />
              </div>
            </div>
            {payout && (
              <p className="mt-3 text-[13px] text-[#0a2225]/70">
                Your payout {"\u2248"} <span className="font-secondary text-[16px] text-[#8D6B2F]">${payout.toLocaleString()}</span>{" "}
                after the 7% platform fee · held in escrow, released after the trip.
              </p>
            )}
            {expenseLines.length > 0 && (
              <p className="mt-2 text-[12.5px] text-[#0a2225]/55">{expenseLines.join(" \u00b7 ")}</p>
            )}
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="w-full rounded-full bg-[#0c4d47] px-6 py-4 text-[15px] font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225] disabled:opacity-60"
          >
            {submitting ? "Sending\u2026" : "Send proposal"}
          </button>
          <p className="-mt-4 text-center text-[12px] text-[#0a2225]/55">
            They accept and pay the deposit — escrow-protected until the trip.
          </p>
        </div>
      </div>
    </div>
  );
}
