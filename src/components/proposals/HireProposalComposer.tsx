import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIRewriteButton } from "@/components/AIRewriteButton";
import {
  capLabel,
  CAPABILITY_PROPOSAL_FIELDS,
  type ProposalField,
} from "@/lib/onTripCapabilities";

// ============================================================================
// HIRE PROPOSAL COMPOSER v2 — the creator's reply to being hired.
// Universal blocks (every capability inherits them): availability
// confirmation, hosting & working style, communication expectations,
// traveler responsibilities, special requests. Capability-specific craft
// questions come from CAPABILITY_PROPOSAL_FIELDS (founder-editable config).
// Writes the EXACT trip_proposals row the wizard writes — message card,
// accept, deposit, escrow all untouched downstream.
// ============================================================================

const F =
  "w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-[15px] text-[#0a2225] placeholder:text-[#0a2225]/35 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F]";

const HOSTING_OPTIONS = [
  "Traveling with you full-time",
  "Joining for planned activities only",
  "Creating content independently",
  "Combination",
];
const COMMS_OPTIONS = ["Entire day", "During planned shoots", "Mornings only", "Flexible"];
const RESPONSIBILITY_ITEMS = [
  { id: "accommodation", label: "Accommodation" },
  { id: "transportation", label: "Transportation" },
  { id: "meals", label: "Meals" },
  { id: "activities", label: "Activity access" },
  { id: "flights", label: "Flights" },
];

interface Props {
  tripData: any;
  userId: string;
  hireCaps: string[];
  hireRate: number | null;
  hireDays: number;
  hireEstimate: number | null;
}

function Radio({ name, options, value, onChange }: { name: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`h-9 rounded-lg border px-3 text-[13px] font-medium transition-colors !min-h-0 !min-w-0 ${
            value === o ? "border-[#0c4d47] bg-[#0c4d47] text-[#f7f3ea]" : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#C7A962]"
          }`}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Multi({ options, values, onToggle }: { options: string[]; values: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onToggle(o)}
          className={`h-9 rounded-lg border px-3 text-[13px] font-medium transition-colors !min-h-0 !min-w-0 ${
            values.includes(o) ? "border-[#0c4d47] bg-[#0c4d47] text-[#f7f3ea]" : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#C7A962]"
          }`}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function HireProposalComposer({ tripData, userId, hireCaps, hireRate, hireDays, hireEstimate }: Props) {
  const navigate = useNavigate();
  const isCreator = Boolean(tripData?.preferred_creator_id);

  // 1. Availability confirmation
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(false);
  const [arrival, setArrival] = useState<string>(tripData?.start_date ? String(tripData.start_date).slice(0, 10) : "");
  const [departure, setDeparture] = useState<string>(tripData?.end_date ? String(tripData.end_date).slice(0, 10) : "");
  const [dateLimitations, setDateLimitations] = useState("");
  // 2. Hosting / working style
  const [hostingStyle, setHostingStyle] = useState("");
  const [hostingDesc, setHostingDesc] = useState("");
  // 9. Communication
  const [comms, setComms] = useState("");
  // 8. Traveler responsibilities: id -> "traveler" | "me"
  const [responsibilities, setResponsibilities] = useState<Record<string, "traveler" | "me">>({});
  // 10. Special requests
  const [specialRequests, setSpecialRequests] = useState("");
  // Capability craft answers
  const [answers, setAnswers] = useState<Record<string, Record<string, any>>>({});
  // Price
  const [price, setPrice] = useState<string>(hireEstimate ? String(hireEstimate) : "");
  const [depositPct, setDepositPct] = useState<string>("25");
  const [submitting, setSubmitting] = useState(false);

  // Prefill responsibilities from the creator's own on-trip expense terms.
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
        const who = (v: string | null | undefined): "traveler" | "me" => (v === "creator" ? "me" : "traveler");
        setResponsibilities((prev) => ({
          accommodation: prev.accommodation ?? who(s?.expense_lodging),
          transportation: prev.transportation ?? who(s?.expense_travel),
          meals: prev.meals ?? who(s?.expense_meals),
          activities: prev.activities ?? "traveler",
          flights: prev.flights ?? who(s?.expense_travel),
        }));
      } catch { /* prefills are best-effort */ }
    })();
  }, [userId]);

  const setAnswer = (cap: string, field: string, value: any) =>
    setAnswers((prev) => ({ ...prev, [cap]: { ...(prev[cap] || {}), [field]: value } }));
  const toggleMulti = (cap: string, field: string, option: string) =>
    setAnswers((prev) => {
      const cur: string[] = Array.isArray(prev[cap]?.[field]) ? prev[cap][field] : [];
      const next = cur.includes(option) ? cur.filter((x) => x !== option) : [...cur, option];
      return { ...prev, [cap]: { ...(prev[cap] || {}), [field]: next } };
    });

  const priceNum = parseFloat(price);
  const payout = Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum * 0.93) : null;

  const deliverableLines = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Availability confirmed: ${arrival || "?"} \u2013 ${departure || "?"}`);
    if (dateLimitations.trim()) lines.push(`Date limitations: ${dateLimitations.trim()}`);
    if (hostingStyle) lines.push(`Hosting style: ${hostingStyle}`);
    if (comms) lines.push(`Available during the trip: ${comms}`);
    for (const cap of hireCaps) {
      lines.push(capLabel(cap));
      for (const f of CAPABILITY_PROPOSAL_FIELDS[cap] || []) {
        const v = answers[cap]?.[f.id];
        if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
        const text = Array.isArray(v) ? v.join(", ") : String(v).trim();
        if (text) lines.push(`${f.label}: ${text}${f.suffix ? ` ${f.suffix}` : ""}`);
      }
    }
    const mine = RESPONSIBILITY_ITEMS.filter((r) => responsibilities[r.id] === "me").map((r) => r.label);
    if (mine.length) lines.push(`Included in my fee: ${mine.join(", ")}`);
    if (specialRequests.trim()) lines.push(`Good to know: ${specialRequests.trim()}`);
    return lines;
  }, [arrival, departure, dateLimitations, hostingStyle, comms, hireCaps, answers, responsibilities, specialRequests]);

  const exclusionLines = useMemo(
    () => RESPONSIBILITY_ITEMS.filter((r) => responsibilities[r.id] === "traveler").map((r) => `${r.label} \u2014 traveler provides`),
    [responsibilities]
  );

  const handleSubmit = async () => {
    if (!availabilityConfirmed) {
      toast.error("Confirm your availability for these dates first.");
      return;
    }
    if (!arrival || !departure) {
      toast.error("Set your arrival and departure dates.");
      return;
    }
    if (!hostingDesc.trim() && !hostingStyle) {
      toast.error("Tell them how you'll host and work during the trip.");
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
      const message =
        (hostingDesc.trim() || `I'm confirmed and available ${arrival} \u2013 ${departure}.`) +
        (hostingStyle ? `\n\nHow I'll be with you: ${hostingStyle.toLowerCase()}.` : "");
      const payload: any = {
        trip_request_id: tripData.id,
        proposer_id: userId,
        proposer_role: isCreator ? "creator" : "agent",
        headline: `${tripData?.source_metadata?.hire_service_title || "On-trip hosting"} \u2014 ${tripData.destination || "your trip"}`,
        message,
        itinerary_summary: null,
        price_from: priceNum,
        currency: "USD",
        deposit_percentage: dep,
        deposit_due_days: 3,
        nights: null,
        inclusions: deliverableLines.length > 0 ? deliverableLines : null,
        exclusions: exclusionLines.length > 0 ? exclusionLines : null,
        custom_cancellation_terms: null,
        price_breakdown: {
          pricing_type: "total",
          hire: {
            capabilities: hireCaps,
            answers,
            availability: { confirmed: true, arrival, departure, limitations: dateLimitations.trim() || null },
            hosting_style: hostingStyle || null,
            communication: comms || null,
            responsibilities,
            special_requests: specialRequests.trim() || null,
            day_rate: hireRate,
            trip_days: hireDays,
          },
        },
        payment_schedule: [
          { name: "Deposit", percentage: dep, due: "On acceptance" },
          { name: "Balance", percentage: 100 - dep, due: "Before the trip" },
        ],
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

  const renderCapField = (cap: string, f: ProposalField) => {
    const v = answers[cap]?.[f.id];
    if (f.type === "multiselect") {
      return <Multi options={f.options || []} values={Array.isArray(v) ? v : []} onToggle={(o) => toggleMulti(cap, f.id, o)} />;
    }
    if (f.type === "radio") {
      return <Radio name={`${cap}-${f.id}`} options={f.options || []} value={v || ""} onChange={(nv) => setAnswer(cap, f.id, nv)} />;
    }
    if (f.type === "select") {
      return (
        <select className={F} value={v || ""} onChange={(e) => setAnswer(cap, f.id, e.target.value)}>
          <option value="">Choose{"\u2026"}</option>
          {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (f.type === "textarea") {
      return (
        <div>
          {f.withAI && (
            <div className="mb-1 flex justify-end">
              <AIRewriteButton value={v || ""} onRewrite={(nv: string) => setAnswer(cap, f.id, nv)} fieldLabel={f.label} />
            </div>
          )}
          <textarea rows={3} className={F} value={v || ""} onChange={(e) => setAnswer(cap, f.id, e.target.value)} placeholder={f.placeholder} />
        </div>
      );
    }
    return (
      <input
        type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
        min={f.type === "number" ? "0" : undefined}
        className={F}
        value={v || ""}
        onChange={(e) => setAnswer(cap, f.id, e.target.value)}
        placeholder={f.placeholder}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FDF9F0] px-4 py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <p className={EYEBROW}>Your reply</p>
        <h1 className="mt-2 font-secondary text-2xl leading-tight text-[#0a2225] md:text-3xl">
          Hired for {hireCaps.length > 0 ? hireCaps.map(capLabel).join(", ") : "your trip"}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#0a2225]/70">
          {tripData?.destination}
          {hireDays > 0 ? `, ${hireDays} days` : ""}
          {hireRate ? ` \u00b7 your listed rate $${hireRate}/day` : ""}
          {hireEstimate ? ` \u00b7 \u2248 $${hireEstimate.toLocaleString()} total` : ""}
        </p>

        <div className="mt-8 space-y-8">
          {/* 1 — Availability confirmation */}
          <div className="border-t border-[#E5DFC6] pt-6">
            <p className={EYEBROW}>Availability</p>
            <button type="button" onClick={() => setAvailabilityConfirmed((c) => !c)}
              className="mt-3 flex w-full items-center gap-3 rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-left transition-colors hover:border-[#C7A962] !min-h-0">
              <span className={`flex h-5 w-5 items-center justify-center rounded-md border text-[12px] ${
                availabilityConfirmed ? "border-[#0c4d47] bg-[#0c4d47] text-[#f7f3ea]" : "border-[#C7A962]/60 bg-white text-transparent"
              }`}>{"\u2713"}</span>
              <span className="text-[14px] text-[#0a2225]">I confirm I am available for these dates <span className="text-[#B3261E]">*</span></span>
            </button>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12.5px] text-[#0a2225]/70">Arrival *</label>
                <input type="date" className={F} value={arrival} onChange={(e) => setArrival(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[12.5px] text-[#0a2225]/70">Departure *</label>
                <input type="date" className={F} value={departure} onChange={(e) => setDeparture(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[12.5px] text-[#0a2225]/70">Any date limitations</label>
                <input type="text" className={F} value={dateLimitations} onChange={(e) => setDateLimitations(e.target.value)}
                  placeholder="e.g. I need to depart by 2pm on the last day" />
              </div>
            </div>
          </div>

          {/* 2 — Hosting / working style */}
          <div className="border-t border-[#E5DFC6] pt-6">
            <p className={EYEBROW}>Hosting & working style</p>
            <p className="mb-2 mt-2 text-[12.5px] text-[#0a2225]/70">During the trip I'll primarily be:</p>
            <Radio name="hosting" options={HOSTING_OPTIONS} value={hostingStyle} onChange={setHostingStyle} />
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[12.5px] text-[#0a2225]/70">Describe how you'll host and work during the trip</label>
                <AIRewriteButton value={hostingDesc} onRewrite={setHostingDesc} fieldLabel="Hosting & working style" />
              </div>
              <textarea rows={3} className={F} value={hostingDesc} onChange={(e) => setHostingDesc(e.target.value)}
                placeholder="I plan the days around your pace — shooting in golden hours, off-camera the rest…" />
            </div>
          </div>

          {/* Capability craft questions (config-driven) */}
          {hireCaps.map((cap) => {
            const fields: ProposalField[] = CAPABILITY_PROPOSAL_FIELDS[cap] || [];
            let lastSection: string | undefined;
            return (
              <div key={cap} className="border-t border-[#E5DFC6] pt-6">
                <p className={EYEBROW}>{capLabel(cap)}</p>
                {fields.length === 0 ? (
                  <p className="mt-2 text-[13.5px] text-[#0a2225]/60">Covered by your hosted days {"\u2014"} nothing extra to define.</p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {fields.map((f) => {
                      const showSection = f.section && f.section !== lastSection;
                      lastSection = f.section ?? lastSection;
                      return (
                        <div key={f.id}>
                          {showSection && (
                            <p className="mb-2 mt-4 text-[12px] font-medium uppercase tracking-[0.14em] text-[#0a2225]/55">{f.section}</p>
                          )}
                          <label className="mb-1 block text-[12.5px] text-[#0a2225]/70">
                            {f.label}{f.suffix ? <span className="text-[#0a2225]/40"> ({f.suffix})</span> : null}
                          </label>
                          {renderCapField(cap, f)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* 8 — Traveler responsibilities */}
          <div className="border-t border-[#E5DFC6] pt-6">
            <p className={EYEBROW}>Who covers what</p>
            <p className="mb-3 mt-2 text-[12.5px] text-[#0a2225]/70">Clear terms prevent disputes {"\u2014"} tap each item.</p>
            <div className="space-y-2.5">
              {RESPONSIBILITY_ITEMS.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-[#0a2225]">{r.label}</span>
                  <div className="inline-flex rounded-lg border border-[#E5DFC6] bg-white p-0.5">
                    {(["traveler", "me"] as const).map((who) => (
                      <button key={who} type="button" onClick={() => setResponsibilities((prev) => ({ ...prev, [r.id]: who }))}
                        className={`h-8 rounded-md px-3 text-[12px] font-medium transition-colors !min-h-0 !min-w-0 ${
                          responsibilities[r.id] === who ? "bg-[#0c4d47] text-[#f7f3ea]" : "text-[#0a2225]/70 hover:bg-[#f7f3ea]"
                        }`}>
                        {who === "traveler" ? "Traveler provides" : "In my fee"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 9 — Communication expectations */}
          <div className="border-t border-[#E5DFC6] pt-6">
            <p className={EYEBROW}>Communication</p>
            <p className="mb-2 mt-2 text-[12.5px] text-[#0a2225]/70">During the trip I'll be available:</p>
            <Radio name="comms" options={COMMS_OPTIONS} value={comms} onChange={setComms} />
          </div>

          {/* 10 — Special requests */}
          <div className="border-t border-[#E5DFC6] pt-6">
            <div className="flex items-center justify-between">
              <p className={EYEBROW}>Anything they should know</p>
              <AIRewriteButton value={specialRequests} onRewrite={setSpecialRequests} fieldLabel="Special requests" />
            </div>
            <textarea rows={3} className={`${F} mt-3`} value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Dietary restrictions, accessibility, preferred accommodations, luggage & equipment, visa requirements…" />
          </div>

          {/* Price */}
          <div className="border-t border-[#E5DFC6] pt-6">
            <p className={EYEBROW}>Price</p>
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
                after the 7% platform fee {"\u00b7"} held in escrow, released after the trip.
              </p>
            )}
          </div>

          <button type="button" disabled={submitting} onClick={handleSubmit}
            className="w-full rounded-full bg-[#0c4d47] px-6 py-4 text-[15px] font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225] disabled:opacity-60">
            {submitting ? "Sending\u2026" : "Send proposal"}
          </button>
          <p className="-mt-4 text-center text-[12px] text-[#0a2225]/55">
            They accept and pay the deposit {"\u2014"} escrow-protected until the trip.
          </p>
        </div>
      </div>
    </div>
  );
}
