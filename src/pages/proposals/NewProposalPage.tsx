import { useState, useEffect, useMemo, useRef } from "react";
import { capLabel } from "@/lib/onTripCapabilities";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Send, MapPin, Calendar, DollarSign,
  Clock, Users, ChevronLeft, Upload, X, FileText, Plus, Trash2, AlertCircle, Info, Percent, Sparkles, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HOST_FEE_PCT, GUEST_FEE_PCT } from "@/lib/booking/commission";

type TripRequestData = {
  id: string;
  title: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  user_id: string;
  description: string | null;
  interests: string[] | null;
};

type CancellationWindow = { band: string; refund_pct: number };
type UploadedFile = { name: string; path: string; size: number; type: string };
type CommissionModel = "percentage" | "flat_fee" | "hybrid";
type CommissionTier = { threshold: number; pct: number };

const STEPS = [
  "Your Pitch",
  "Scope of Services",
  "Pricing & Payment",
  "Cancellation Policy",
  "Deliverables",
  "Attachments",
  "Review & Submit",
];

const labelClasses = "text-sm font-medium text-[#0a2225]";
const inputClasses = "rounded-xl h-11 text-sm border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962] transition-all";
const textareaClasses = "rounded-xl border-[#E5DFC6] bg-white text-sm focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962] transition-all";
const selectTriggerClasses = "rounded-xl h-11 text-sm border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20";
const eyebrowClasses = "text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]";

const DEFAULT_CANCELLATION_WINDOWS: CancellationWindow[] = [
  { band: "60+", refund_pct: 90 },
  { band: "30-59", refund_pct: 50 },
  { band: "14-29", refund_pct: 25 },
  { band: "<14", refund_pct: 0 },
];

const CANCELLATION_LABELS: Record<string, string> = {
  "60+": "60+ days before departure",
  "30-59": "30–59 days before departure",
  "14-29": "14–29 days before departure",
  "<14": "Less than 14 days before departure",
};

export default function NewProposalPage() {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get("tripId") || "";
  const editId = searchParams.get("edit");
  const isEditing = !!editId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [aiPolishing, setAiPolishing] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiScoping, setAiScoping] = useState(false);
  const [aiRefiningTerms, setAiRefiningTerms] = useState(false);
  const [tripData, setTripData] = useState<TripRequestData | null>(null);
  // ---- On-trip HIRE awareness (v2): a hire reply is a quote to show up,
  // not an itinerary pitch. Same submit, same row \u2014 the machine sections
  // below simply don't render for hires and their fields are auto-filled. ----
  const hireMeta: any = (tripData as any)?.source_metadata || {};
  const isHire = Boolean(hireMeta.hire_on_trip);
  const hireRate = typeof hireMeta.hire_day_rate_usd === "number" ? hireMeta.hire_day_rate_usd : null;
  const hireDays = typeof hireMeta.trip_days === "number" ? hireMeta.trip_days :
    (tripData?.start_date && tripData?.end_date
      ? Math.max(0, Math.round((new Date(tripData.end_date).getTime() - new Date(tripData.start_date).getTime()) / 86400000))
      : 0);
  const hireCaps: string[] = Array.isArray(hireMeta.hire_capabilities) ? hireMeta.hire_capabilities : [];
  const hireEstimate = typeof hireMeta.estimated_total_usd === "number" ? hireMeta.estimated_total_usd :
    (hireRate && hireDays > 0 ? hireRate * hireDays : null);
  const [proposalCount, setProposalCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Step 0 — Pitch
  const [headline, setHeadline] = useState("");
  const [message, setMessage] = useState("");
  const [itinerarySummary, setItinerarySummary] = useState("");
  const [proposerRole, setProposerRole] = useState<"agent" | "creator">("agent");

  // Step 1 — Scope
  const [inclusionsText, setInclusionsText] = useState("");
  const [exclusionsText, setExclusionsText] = useState("");
  const [serviceLevel, setServiceLevel] = useState("full_service");
  const [revisionCount, setRevisionCount] = useState("2");
  const [supportLevel, setSupportLevel] = useState("business_hours");
  const [handlesSupplierPayments, setHandlesSupplierPayments] = useState(false);

  // Step 2 — Pricing
  const [pricingType, setPricingType] = useState("per_person");
  const [priceFrom, setPriceFrom] = useState<number | "">("");
  const [hasPlanningFee, setHasPlanningFee] = useState(false);
  const [planningFee, setPlanningFee] = useState<number | "">("");
  const [planningFeeRefundable, setPlanningFeeRefundable] = useState(false);
  const [depositPct, setDepositPct] = useState(25);
  const [depositDueDays, setDepositDueDays] = useState<number | "">(7);
  const [balanceDue, setBalanceDue] = useState("before_departure");
  const [pricingConfirmed, setPricingConfirmed] = useState("confirmed");
  const [deliveryDays, setDeliveryDays] = useState<number | "">(7);

  // Commission model
  const [commissionModel, setCommissionModel] = useState<CommissionModel>("percentage");
  const [commissionPct, setCommissionPct] = useState<number | "">(15);
  const [commissionTiered, setCommissionTiered] = useState(false);
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([
    { threshold: 5000, pct: 20 },
    { threshold: Infinity, pct: 15 },
  ]);
  const [flatFeeAmount, setFlatFeeAmount] = useState<number | "">("");
  const [flatFeeCovers, setFlatFeeCovers] = useState("planning");
  const [hybridFlatFee, setHybridFlatFee] = useState<number | "">("");
  const [hybridCommissionPct, setHybridCommissionPct] = useState<number | "">(10);

  // Step 3 — Cancellation
  const [depositRefundable, setDepositRefundable] = useState("non_refundable");
  const [cancellationWindows, setCancellationWindows] = useState<CancellationWindow[]>(DEFAULT_CANCELLATION_WINDOWS);
  const [changeFee, setChangeFee] = useState<number | "">("");
  const [supplierDependent, setSupplierDependent] = useState(false);
  const [supplierDependentNote, setSupplierDependentNote] = useState("");
  const [customCancellationTerms, setCustomCancellationTerms] = useState("");

  // Step 4 — Deliverables
  const [delItinerary, setDelItinerary] = useState(true);
  const [delBookingMgmt, setDelBookingMgmt] = useState(false);
  const [bookingMgmtLevel, setBookingMgmtLevel] = useState("full_service");
  const [delOnTripSupport, setDelOnTripSupport] = useState(false);
  const [onTripSupportLevel, setOnTripSupportLevel] = useState("business_hours");
  const [delConcierge, setDelConcierge] = useState(false);
  const [conciergeDetails, setConciergeDetails] = useState("");

  // ── Edit mode: prefill every field from the existing proposal. The Edit
  // button has ALWAYS navigated here with ?edit=<id>; the wizard just never
  // read it — agents had to start over. Now it loads their work back. ──
  const prefilledRef = useRef(false);
  const hirePrefilledRef = useRef(false);
  useEffect(() => {
    if (!isHire || editId || hirePrefilledRef.current || !tripData) return;
    hirePrefilledRef.current = true;
    setHeadline(`${hireMeta.hire_service_title || "On-trip hosting"} \u2014 ${tripData.destination || "your trip"}`);
    setPricingType("total");
    if ((tripData as any).preferred_creator_id) setProposerRole("creator");
    else if ((tripData as any).preferred_agent_id) setProposerRole("agent");
    if (hireEstimate) setPriceFrom((cur: any) => cur || hireEstimate);
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u?.user) return;
        const { data: svc } = await (supabase
          .from("creator_services")
          .select("expense_travel, expense_lodging, expense_meals" as any)
          .eq("creator_id", u.user.id)
          .eq("service_tier", "on_trip")
          .limit(1) as any);
        const s: any = (svc as any)?.[0];
        const covered: string[] = [...(hireCaps.length ? hireCaps.map(capLabel) : ["My hosted days, start to finish"])];
        const notCovered: string[] = [];
        const place = (v: string | null | undefined, label: string) => {
          if (v === "creator") covered.push(`${label} \u2014 in my rate`);
          else if (v === "traveler") notCovered.push(`${label} \u2014 traveler covers`);
          else if (v === "split") notCovered.push(`${label} \u2014 each our own`);
        };
        place(s?.expense_travel, "Flights & transport");
        place(s?.expense_lodging, "Lodging");
        place(s?.expense_meals, "Meals");
        setInclusionsText((cur) => cur || covered.join("\n"));
        setExclusionsText((cur) => cur || notCovered.join("\n"));
      } catch { /* prefills are best-effort */ }
    })();
  }, [isHire, editId, tripData]);
  useEffect(() => {
    if (!editId || prefilledRef.current) return;
    (async () => {
      const { data: p, error } = await supabase
        .from("trip_proposals")
        .select("*")
        .eq("id", editId)
        .maybeSingle();
      if (error || !p) {
        toast.error("Couldn't load this proposal for editing.");
        return;
      }
      prefilledRef.current = true;
      setHeadline(p.headline ?? "");
      setMessage(p.message ?? "");
      setItinerarySummary(p.itinerary_summary ?? "");
      if (p.proposer_role === "agent" || p.proposer_role === "creator") setProposerRole(p.proposer_role);
      if (typeof p.price_from === "number") setPriceFrom(p.price_from);
      if (typeof p.deposit_percentage === "number") setDepositPct(p.deposit_percentage);
      if (typeof p.deposit_due_days === "number") setDepositDueDays(p.deposit_due_days);
      if (typeof p.nights === "number") setDeliveryDays(p.nights);
      if (Array.isArray(p.inclusions)) setInclusionsText(p.inclusions.join("\n"));
      if (Array.isArray(p.exclusions)) setExclusionsText(p.exclusions.join("\n"));
      if (p.custom_cancellation_terms) setCustomCancellationTerms(p.custom_cancellation_terms);
      const pb: any = p.price_breakdown ?? {};
      if (pb.service_level) setServiceLevel(pb.service_level);
      if (pb.revision_count != null) setRevisionCount(String(pb.revision_count));
      if (pb.support_level) setSupportLevel(pb.support_level);
      if (typeof pb.handles_supplier_payments === "boolean") setHandlesSupplierPayments(pb.handles_supplier_payments);
      if (pb.pricing_type) setPricingType(pb.pricing_type);
      if (pb.pricing_confirmed === false) setPricingConfirmed("estimated");
      if (pb.balance_due) setBalanceDue(pb.balance_due);
      if (pb.deposit_refundable) setDepositRefundable(pb.deposit_refundable);
      if (Array.isArray(pb.cancellation_windows) && pb.cancellation_windows.length > 0) {
        setCancellationWindows(
          pb.cancellation_windows.map((w: any) => ({
            label: w.label ?? "",
            refund_percent: w.refund_percent ?? 0,
          })) as any
        );
      }
      if (pb.planning_fee) {
        setHasPlanningFee(true);
        setPlanningFee(pb.planning_fee);
        setPlanningFeeRefundable(!!pb.planning_fee_refundable);
      }
      if (pb.change_fee) setChangeFee(pb.change_fee);
      if (pb.supplier_dependent) {
        setSupplierDependent(true);
        setSupplierDependentNote(pb.supplier_dependent_note ?? "");
      }
      if (Array.isArray(pb.external_links)) {
        const urls = pb.external_links.map((l: any) => l?.url).filter(Boolean);
        if (urls.length > 0) setExternalLinks(urls);
      }
      if (pb.commission_model) setCommissionModel(pb.commission_model);
      if (pb.commission_pct != null) setCommissionPct(pb.commission_pct);
      if (pb.flat_fee_amount != null) setFlatFeeAmount(pb.flat_fee_amount);
      if (pb.flat_fee_covers) setFlatFeeCovers(pb.flat_fee_covers);
      if (pb.hybrid_flat_fee != null) setHybridFlatFee(pb.hybrid_flat_fee);
      if (pb.hybrid_commission_pct != null) setHybridCommissionPct(pb.hybrid_commission_pct);
    })();
  }, [editId]);

  // Step 5 — Attachments
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [externalLinks, setExternalLinks] = useState<string[]>([""]);
  const [uploading, setUploading] = useState(false);

  // Step 6 — Legal
  const [ackTerms, setAckTerms] = useState(false);
  const [ackDeposit, setAckDeposit] = useState(false);
  const [ackCancellation, setAckCancellation] = useState(false);

  const commissionCalc = useMemo(() => {
    const tripCost = typeof priceFrom === "number" ? priceFrom : 0;
    if (tripCost <= 0) return { commission: 0, hostFee: 0, guestFee: 0, agentPayout: 0, travelerTotal: 0 };

    let commission = 0;
    if (commissionModel === "percentage") {
      const pct = typeof commissionPct === "number" ? commissionPct : 0;
      if (commissionTiered && commissionTiers.length > 0) {
        let remaining = tripCost;
        let prevThreshold = 0;
        for (const tier of commissionTiers) {
          const bracketSize = tier.threshold === Infinity ? remaining : Math.min(remaining, tier.threshold - prevThreshold);
          if (bracketSize <= 0) break;
          commission += bracketSize * (tier.pct / 100);
          remaining -= bracketSize;
          prevThreshold = tier.threshold;
        }
      } else {
        commission = tripCost * (pct / 100);
      }
    } else if (commissionModel === "flat_fee") {
      commission = typeof flatFeeAmount === "number" ? flatFeeAmount : 0;
    } else if (commissionModel === "hybrid") {
      const flat = typeof hybridFlatFee === "number" ? hybridFlatFee : 0;
      const pct = typeof hybridCommissionPct === "number" ? hybridCommissionPct : 0;
      commission = flat + tripCost * (pct / 100);
    }

    const hostFee = Math.round(tripCost * HOST_FEE_PCT);
    const guestFee = Math.round(tripCost * GUEST_FEE_PCT);
    const agentPayout = Math.round(commission - hostFee);
    const travelerTotal = tripCost + guestFee;

    return { commission: Math.round(commission), hostFee, guestFee, agentPayout, travelerTotal };
  }, [priceFrom, commissionModel, commissionPct, commissionTiered, commissionTiers, flatFeeAmount, hybridFlatFee, hybridCommissionPct]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  useEffect(() => {
    if (!tripId) return;
    (async () => {
      setLoading(true);
      const [{ data: trip }, { count }] = await Promise.all([
        supabase.from("trip_requests").select("id, title, destination, start_date, end_date, budget_min, budget_max, user_id, description, interests, travelers_adults, travelers_children, source_metadata, preferred_creator_id, preferred_agent_id" as any).eq("id", tripId).maybeSingle(),
        supabase.from("trip_proposals").select("id", { count: "exact", head: true }).eq("trip_request_id", tripId),
      ]);
      setTripData(trip as any);
      setProposalCount(count ?? 0);
      setLoading(false);
    })();
  }, [tripId]);

  const canAdvance = () => {
    if (step === 0) return headline.trim().length > 0 && message.trim().length >= 5;
    if (step === 1) return inclusionsText.trim().length > 0;
    if (step === 2) return typeof priceFrom === "number" && priceFrom > 0;
    if (step === 6) return ackTerms && ackDeposit && ackCancellation;
    return true;
  };

  const handleAiPolish = async () => {
    if (message.trim().length < 10) {
      toast.error("Jot down a few rough notes first — the AI refines what you give it.");
      return;
    }
    setAiPolishing(true);
    try {
      const dates = tripData?.start_date
        ? `${format(new Date(tripData.start_date), "MMM d")}${
            tripData?.end_date ? ` – ${format(new Date(tripData.end_date), "MMM d, yyyy")}` : ""
          }`
        : undefined;
      const { data, error } = await supabase.functions.invoke("ai-proposal-polish", {
        body: {
          notes: message,
          headline,
          destination: tripData?.destination ?? undefined,
          dates,
          budgetMin: tripData?.budget_min ?? undefined,
          budgetMax: tripData?.budget_max ?? undefined,
          role: proposerRole,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.pitch) setMessage(data.pitch);
      if (data?.headline) setHeadline(data.headline);
      toast.success("Refined — review it and make it yours.");
    } catch (err: any) {
      console.error("ai-proposal-polish failed", err);
      toast.error("Couldn't refine right now — your notes are untouched.");
    } finally {
      setAiPolishing(false);
    }
  };

  const handleAiDraftAll = async () => {
    setAiDrafting(true);
    try {
      const dates = tripData?.start_date
        ? `${format(new Date(tripData.start_date), "MMM d")}${
            tripData?.end_date ? ` – ${format(new Date(tripData.end_date), "MMM d, yyyy")}` : ""
          }`
        : undefined;
      const { data, error } = await supabase.functions.invoke("ai-proposal-polish", {
        body: {
          mode: "full_draft",
          notes: message,
          headline,
          destination: tripData?.destination ?? undefined,
          dates,
          // ISO dates so the backend can compute the exact day count —
          // the display string alone made the AI default to 7-day itineraries.
          startDate: tripData?.start_date ?? undefined,
          endDate: tripData?.end_date ?? undefined,
          budgetMin: tripData?.budget_min ?? undefined,
          budgetMax: tripData?.budget_max ?? undefined,
          role: proposerRole,
          interests: tripData?.interests ?? undefined,
          request_description: tripData?.description ?? undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data.headline) setHeadline(data.headline);
      if (data.pitch) setMessage(data.pitch);
      if (data.itinerary_summary) setItinerarySummary(data.itinerary_summary);
      if (Array.isArray(data.inclusions) && data.inclusions.length > 0) setInclusionsText(data.inclusions.join("\n"));
      if (Array.isArray(data.exclusions) && data.exclusions.length > 0) setExclusionsText(data.exclusions.join("\n"));
      if (typeof data.price_per_person === "number" && data.price_per_person > 0) setPriceFrom(data.price_per_person);
      if (typeof data.deposit_percentage === "number") setDepositPct(data.deposit_percentage);
      if (typeof data.delivery_days === "number") setDeliveryDays(data.delivery_days);
      if (data.cancellation_terms) setCustomCancellationTerms(data.cancellation_terms);
      setDelBookingMgmt(Boolean(data.booking_management));
      setDelOnTripSupport(Boolean(data.on_trip_support));
      setAttempted(false);
      toast.success("Full proposal drafted — walk each step and make it yours.");
    } catch (err) {
      console.error("ai full draft failed", err);
      toast.error("Couldn't draft right now — nothing was changed.");
    } finally {
      setAiDrafting(false);
    }
  };

  const handleAiScope = async () => {
    if (inclusionsText.trim().length < 5) {
      toast.error("Add a few rough inclusion lines first.");
      return;
    }
    setAiScoping(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-proposal-polish", {
        body: {
          mode: "scope_polish",
          inclusions_raw: inclusionsText,
          exclusions_raw: exclusionsText,
          destination: tripData?.destination ?? undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (Array.isArray(data.inclusions) && data.inclusions.length > 0) setInclusionsText(data.inclusions.join("\n"));
      if (Array.isArray(data.exclusions)) setExclusionsText(data.exclusions.join("\n"));
      toast.success("Lists tidied — review each line.");
    } catch (err) {
      console.error("ai scope polish failed", err);
      toast.error("Couldn't tidy right now — your lists are untouched.");
    } finally {
      setAiScoping(false);
    }
  };

  const handleAiRefineTerms = async () => {
    if (customCancellationTerms.trim().length < 10) {
      toast.error("Jot rough terms first — the AI refines what you give it.");
      return;
    }
    setAiRefiningTerms(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-proposal-polish", {
        body: { mode: "cancel_polish", terms_raw: customCancellationTerms },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data.cancellation_terms) setCustomCancellationTerms(data.cancellation_terms);
      toast.success("Terms refined — make sure they're exactly your policy.");
    } catch (err) {
      console.error("ai terms polish failed", err);
      toast.error("Couldn't refine right now — your terms are untouched.");
    } finally {
      setAiRefiningTerms(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const files = Array.from(e.target.files);
    if (uploadedFiles.length + files.length > 5) {
      toast.error("Maximum 5 files allowed");
      return;
    }
    setUploading(true);
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 50MB limit`);
        continue;
      }
      // Storage keys reject spaces and special characters — a screenshot
      // named "Screenshot 2026-07-13 at 5.39.25 PM.png" must be sanitized
      // for the KEY while the original name is kept for display.
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${tripId}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from("proposal-attachments").upload(path, file);
      if (error) {
        // Surface the REAL reason (invalid key vs bucket not found vs policy)
        // instead of a generic message that hides the diagnosis.
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }
      setUploadedFiles((prev) => [...prev, { name: file.name, path, size: file.size, type: file.type }]);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = async (path: string) => {
    await supabase.storage.from("proposal-attachments").remove([path]);
    setUploadedFiles((prev) => prev.filter((f) => f.path !== path));
  };

  const handleSubmit = async () => {
    if (!user || !tripData) return;
    setSubmitting(true);

    try {
    const inclusions = inclusionsText.split("\n").map((s) => s.trim()).filter(Boolean);
    const exclusions = exclusionsText.split("\n").map((s) => s.trim()).filter(Boolean);

    // Build deliverables into inclusions
    if (delItinerary) inclusions.push("Full Itinerary PDF: Day-by-day PDF with booking confirmations, maps, and contacts");
    if (delBookingMgmt) inclusions.push(`Booking Management: ${bookingMgmtLevel === "full_service" ? "Full-service (I book everything)" : bookingMgmtLevel === "advisory" ? "Advisory only (recommendations)" : "Hybrid (I book key components)"}`);
    if (delOnTripSupport) inclusions.push(`On-Trip Support: ${onTripSupportLevel === "24_7" ? "24/7 emergency line" : onTripSupportLevel === "business_hours" ? "Business hours phone support" : "Email only"}`);
    if (delConcierge && conciergeDetails) inclusions.push(`Concierge Services: ${conciergeDetails}`);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 14);

    const priceBreakdown: Record<string, unknown> = {
      service_level: serviceLevel,
      revision_count: revisionCount,
      support_level: supportLevel,
      handles_supplier_payments: handlesSupplierPayments,
      pricing_type: pricingType,
      pricing_confirmed: pricingConfirmed === "confirmed",
      balance_due: balanceDue,
      deposit_refundable: depositRefundable,
      cancellation_windows: cancellationWindows.map((w: any) => ({
        label: w.label || w.band || "",
        refund_percent: w.refund_percent ?? w.refund_pct ?? 0,
      })),
      ...(hasPlanningFee && planningFee ? { planning_fee: planningFee, planning_fee_refundable: planningFeeRefundable } : {}),
      ...(changeFee ? { change_fee: changeFee } : {}),
      ...(supplierDependent ? { supplier_dependent: true, supplier_dependent_note: supplierDependentNote } : {}),
      external_links: externalLinks.filter((l) => l.trim()).map((url) => ({ label: url, url })),
      // Commission model fields
      commission_model: commissionModel,
      ...(commissionModel === "percentage" ? {
        commission_pct: commissionPct,
        commission_tiered: commissionTiered,
        ...(commissionTiered ? { commission_tiers: commissionTiers } : {}),
      } : {}),
      ...(commissionModel === "flat_fee" ? {
        flat_fee_amount: flatFeeAmount,
        flat_fee_covers: flatFeeCovers,
      } : {}),
      ...(commissionModel === "hybrid" ? {
        hybrid_flat_fee: hybridFlatFee,
        hybrid_commission_pct: hybridCommissionPct,
      } : {}),
      host_fee_pct: HOST_FEE_PCT * 100,
      guest_fee_pct: GUEST_FEE_PCT * 100,
      platform_total_pct: (HOST_FEE_PCT + GUEST_FEE_PCT) * 100,
      agent_commission_estimate: commissionCalc.commission,
      agent_payout_estimate: commissionCalc.agentPayout,
      traveler_total_estimate: commissionCalc.travelerTotal,
      guest_service_fee_estimate: commissionCalc.guestFee,
    };

    // The payment schedule IS the platform's escrow model — derived from the
    // deposit terms the agent already chose, never hand-authored. (The old
    // schedule-type state was dead UI that silently saved "Full Payment
    // 100%" onto every proposal, contradicting its own deposit terms.)
    const paymentSchedule =
      typeof depositPct === "number" && depositPct > 0 && depositPct < 100
        ? [
            {
              name: "Deposit",
              percentage: depositPct,
              due:
                typeof depositDueDays === "number"
                  ? `Within ${depositDueDays} days of acceptance`
                  : "On acceptance",
            },
            { name: "Balance", percentage: 100 - depositPct, due: "Before departure" },
          ]
        : [{ name: "Full Payment", percentage: 100, due: "On acceptance" }];

    const payload = {
      trip_request_id: tripId,
      proposer_id: user.id,
      proposer_role: proposerRole,
      headline,
      message,
      itinerary_summary: itinerarySummary || null,
      price_from: typeof priceFrom === "number" ? priceFrom : null,
      currency: "USD",
      deposit_percentage: depositPct,
      deposit_due_days: typeof depositDueDays === "number" ? depositDueDays : null,
      nights: typeof deliveryDays === "number" ? deliveryDays : null,
      inclusions: inclusions.length > 0 ? inclusions : null,
      exclusions: exclusions.length > 0 ? exclusions : null,
      custom_cancellation_terms: customCancellationTerms || null,
      price_breakdown: priceBreakdown,
      payment_schedule: paymentSchedule,
      valid_until: validUntil.toISOString(),
      status: "sent",
      ...(proposerRole === "agent" ? { agent_id: user.id } : { creator_id: user.id }),
    };

    let insertedData: { id: string } | null = null;
    let error: any = null;
    if (editId) {
      // Update in place: identity + status fields stay untouched.
      const updatePayload: any = { ...payload };
      delete updatePayload.trip_request_id;
      delete updatePayload.proposer_id;
      delete updatePayload.proposer_role;
      delete updatePayload.status;
      delete updatePayload.agent_id;
      delete updatePayload.creator_id;
      const res = await supabase.from("trip_proposals").update(updatePayload).eq("id", editId).select("id").single();
      insertedData = res.data as any;
      error = res.error;
    } else {
      const res = await supabase.from("trip_proposals").insert(payload as any).select("id").single();
      insertedData = res.data as any;
      error = res.error;
    }

    if (error || !insertedData) {
      console.error("Proposal submit error", error);
      toast.error("Failed to submit proposal. Please try again.");
      setSubmitting(false);
      return;
    }

    // Save attachment records
    if (uploadedFiles.length > 0) {
      await supabase.from("proposal_attachments").insert(
        uploadedFiles.map((f) => ({
          proposal_id: insertedData.id,
          uploaded_by: user.id,
          file_name: f.name,
          file_path: f.path,
          file_size: f.size,
          file_type: f.type,
        }))
      );
    }

    // Notify traveler (non-blocking) — only for NEW proposals; edits
    // shouldn't re-send "you received a new proposal".
    if (!editId) {
      supabase.functions.invoke("notify-trip-proposal", {
        body: { tripRequestId: tripId },
      }).catch((err) => console.error("Notification error:", err));
    }

    toast.success("Proposal submitted successfully!");
    navigate(`/proposals/${insertedData.id}`);
    } catch (err) {
      console.error("Proposal submission failed:", err);
      toast.error("An unexpected error occurred while submitting your proposal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f3ea] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading trip details…</div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen bg-[#f7f3ea] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Trip request not found.</p>
        <Button variant="outline" onClick={() => navigate(tripId ? `/marketplace/request/${tripId}` : '/marketplace')}>Go Back</Button>
      </div>
    );
  }

  const budgetMid = tripData.budget_min && tripData.budget_max
    ? (tripData.budget_min + tripData.budget_max) / 2
    : null;
  const priceVsBudget = budgetMid && typeof priceFrom === "number" && priceFrom > 0
    ? priceFrom <= (tripData.budget_max || Infinity) ? "within" : "above"
    : null;

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#0a2225] flex flex-col">
      {/* Command bar — two-tier */}
      <header className="sticky top-0 z-50 shadow-[0_2px_16px_rgba(10,34,37,0.28)]">
        <div className="bg-gradient-to-r from-[#0c4d47] to-[#0a2225]">
          <div className="mx-auto flex h-[72px] max-w-5xl items-center gap-4 px-4 md:px-6">
            <button
              onClick={() => navigate(tripId ? `/marketplace/request/${tripId}` : '/marketplace')}
              aria-label="Back"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[#E5DFC6]/28 text-[#E5DFC6] transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] uppercase tracking-[0.3em] text-[#C7A962]">Submit a Proposal</p>
              <p className="truncate font-secondary text-[23px] leading-tight text-white">{tripData.title || "Trip Request"}</p>
            </div>
            <div className="hidden shrink-0 items-center gap-4 text-[13px] text-[#f7f3ea] md:flex">
              {tripData.destination && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />{tripData.destination}
                </span>
              )}
              {tripData.start_date && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />{format(new Date(tripData.start_date), "MMM d")}
                  {tripData.end_date && ` – ${format(new Date(tripData.end_date), "MMM d")}`}
                </span>
              )}
              {(tripData.budget_min || tripData.budget_max) && (
                <span className="inline-flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  {tripData.budget_min && `$${tripData.budget_min.toLocaleString()}`}
                  {tripData.budget_min && tripData.budget_max && " – "}
                  {tripData.budget_max && `$${tripData.budget_max.toLocaleString()}`}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-[#083530]">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <div
              className="flex h-[46px] items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ fontFamily: "Inter, sans-serif" }}
              role="tablist"
            >
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={i === step}
                  onClick={() => { if (i < step) { setStep(i); setAttempted(false); } }}
                  disabled={i > step}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors ${
                    i === step
                      ? "bg-[#C7A962] font-semibold text-[#0a2225]"
                      : i < step
                      ? "text-[#E5DFC6]/75 hover:bg-white/10 hover:text-[#E5DFC6]"
                      : "cursor-default text-[#E5DFC6]/35"
                  }`}
                >
                  {i + 1}.&nbsp;{s}
                </button>
              ))}
              <span className="ml-auto hidden shrink-0 pl-3 text-[12.5px] text-[#E5DFC6]/60 sm:inline">
                Step {step + 1} of {STEPS.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">

            {/* STEP 0: Pitch */}
            {isHire && (
              <div className="mb-5 rounded-2xl border border-[#C7A962]/50 bg-[#FDF9F0] p-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">On-trip hire</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[#0a2225]">
                  You're being hired to join this trip — {tripData?.destination}
                  {hireDays > 0 ? `, ${hireDays} days` : ""}
                  {hireRate ? ` \u00b7 your listed rate $${hireRate}/day` : ""}
                  {hireEstimate ? ` \u00b7 \u2248 $${hireEstimate.toLocaleString()} total` : ""}.
                </p>
                {hireCaps.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {hireCaps.map((id) => (
                      <span key={id} className="inline-flex h-7 items-center rounded-lg border border-[#C7A962]/60 bg-white px-2.5 text-[11px] font-medium text-[#0a2225]">
                        {capLabel(id)}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1.5 text-[12.5px] text-[#0a2225]/60">No itinerary needed — confirm your price and terms; the trip is theirs, the days are yours to host.</p>
              </div>
            )}
            {step === 0 && (
              <Card className="rounded-2xl border-0 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Step One</p>
                    <h2 className="font-secondary text-[24px] leading-snug text-[#0a2225]">Your Pitch</h2>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#0a2225]/55">{isHire ? "Confirm you're available and set your terms \u2014 no itinerary needed." : "Describe your proposed itinerary and why you're the best fit."}</p>
                  </div>

                  <div style={isHire ? { display: "none" } : undefined} className="rounded-2xl border border-[#C7A962]/40 bg-[#C7A962]/[0.07] p-4">
                    <button
                      type="button"
                      onClick={handleAiDraftAll}
                      disabled={aiDrafting}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:opacity-50"
                    >
                      {aiDrafting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-[#C7A962]" />
                      )}
                      {aiDrafting ? "Drafting your proposal…" : "Draft entire proposal with Goldsainte AI"}
                    </button>
                    <p className="mt-2 text-[12px] leading-relaxed text-[#0a2225]/55">
                      Pre-fills every step from the trip request — pitch, scope, pricing, terms, deliverables. You review and edit each one before anything is sent. Add rough notes below first if you want them woven in.
                    </p>
                  </div>

                  <div style={isHire ? { display: "none" } : undefined} className="space-y-2">
                    <Label className={labelClasses}>Your Role</Label>
                    <div className="flex gap-3">
                      {(["agent", "creator"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setProposerRole(role)}
                          className={`min-h-[40px] rounded-full px-5 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors ${
                            proposerRole === role
                              ? "bg-[#0c4d47] text-[#E5DFC6]"
                              : "border border-[#0a2225]/20 bg-white text-[#0a2225]/60 hover:border-[#C7A962]"
                          }`}
                        >
                          {role === "agent" ? "Travel Agent" : "Creator"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2" style={isHire ? { display: "none" } : undefined}>
                    <Label className={labelClasses} htmlFor="headline">Headline <span className="text-destructive">*</span></Label>
                    <Input
                      className={inputClasses}
                      id="headline"
                      placeholder="e.g. 7-Night Luxury Safari with Private Guide"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      maxLength={120}
                    />
                    {attempted && headline.length === 0 && (
                      <p className="text-xs text-destructive">Required</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses} htmlFor="message">{isHire ? "Your reply" : "Your Proposal"} <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="message"
                      placeholder={isHire ? "Confirm you're free for these dates and how you'll host the days\u2026" : "Describe your proposed itinerary, unique experiences, and why you're the best fit for this trip…"}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className={`${textareaClasses} min-h-[180px]`}
                    />
                    <div className="flex items-center justify-between pt-0.5">
                      <button
                        type="button"
                        onClick={handleAiPolish}
                        disabled={aiPolishing || message.trim().length < 10}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#C7A962]/60 bg-[#C7A962]/10 px-3.5 py-1.5 text-[12px] font-medium text-[#8D6B2F] transition-colors hover:bg-[#C7A962]/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {aiPolishing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {aiPolishing ? "Refining…" : "Refine with Goldsainte AI"}
                      </button>
                      <p className="text-[11px] text-[#0a2225]/40">AI drafts — you approve every word</p>
                    </div>
                    <div className="flex justify-between">
                      {attempted && message.trim().length < 5 ? (
                        <p className="text-xs text-destructive">Minimum 5 characters required</p>
                      ) : (
                        <span />
                      )}
                      <p className="text-xs text-muted-foreground">{message.length} characters</p>
                    </div>
                  </div>

                  <div className="space-y-2" style={isHire ? { display: "none" } : undefined}>
                    <Label className={labelClasses} htmlFor="itinerary-summary">Itinerary Summary <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Textarea
                      id="itinerary-summary"
                      placeholder={"Day 1: Arrival & transfer to hotel\nDay 2: Guided city tour\nDay 3: Safari excursion\n..."}
                      value={itinerarySummary}
                      onChange={(e) => setItinerarySummary(e.target.value)}
                      className={`${textareaClasses} min-h-[120px]`}
                    />
                    <p className="text-xs text-muted-foreground">Brief day-by-day overview of the proposed trip structure.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 1: Scope of Services */}
            {step === 1 && (
              <Card className="rounded-2xl border-0 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Step Two</p>
                    <h2 className="font-secondary text-[24px] leading-snug text-[#0a2225]">Scope of Services</h2>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#0a2225]/55">Define exactly what is and isn't included in your proposal.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses} htmlFor="inclusions">{isHire ? "What your rate covers" : "What's Included"} <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="inclusions"
                      placeholder={"Airport transfers\nHotel bookings (4-star+)\n2 guided excursions\nTravel insurance coordination\nRestaurant reservations"}
                      value={inclusionsText}
                      onChange={(e) => setInclusionsText(e.target.value)}
                      className={`${textareaClasses} min-h-[140px]`}
                    />
                    <p className="text-xs text-muted-foreground">One item per line. Be specific about what the traveler will receive.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses} htmlFor="exclusions">{isHire ? "What the traveler covers" : "What's Not Included"}</Label>
                    <Textarea
                      id="exclusions"
                      placeholder={"International flights\nMeals not specified in itinerary\nPersonal expenses\nVisa fees\nTravel insurance premiums"}
                      value={exclusionsText}
                      onChange={(e) => setExclusionsText(e.target.value)}
                      className={`${textareaClasses} min-h-[120px]`}
                    />
                    <p className="text-xs text-muted-foreground">One item per line. Setting clear exclusions prevents disputes.</p>
                    <button
                      type="button"
                      onClick={handleAiScope}
                      disabled={aiScoping || inclusionsText.trim().length < 5}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#C7A962]/60 bg-[#C7A962]/10 px-3.5 py-1.5 text-[12px] font-medium text-[#8D6B2F] transition-colors hover:bg-[#C7A962]/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {aiScoping ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {aiScoping ? "Tidying…" : "Tidy lists with Goldsainte AI"}
                    </button>
                  </div>

                  <div style={isHire ? { display: "none" } : undefined} className="space-y-3">
                    <Label className={labelClasses}>Service Level</Label>
                    <RadioGroup value={serviceLevel} onValueChange={setServiceLevel} className="space-y-2">
                      {[
                        { value: "advisory", label: "Advisory", desc: "I provide recommendations; the traveler books independently" },
                        { value: "full_service", label: "Full-Service", desc: "I handle all research, bookings, and coordination end-to-end" },
                        { value: "concierge", label: "Concierge", desc: "Full-service plus on-trip support, reservations, and personal touches" },
                      ].map((opt) => (
                        <label key={opt.value} className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${serviceLevel === opt.value ? "border-[#0c4d47] bg-[#0c4d47]/5" : "hover:bg-muted/30"}`}>
                          <RadioGroupItem value={opt.value} className="mt-0.5" />
                          <div>
                            <span className="font-medium text-sm">{opt.label}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div style={isHire ? { display: "none" } : undefined} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div style={isHire ? { display: "none" } : undefined} className="space-y-2">
                      <Label className={labelClasses}>Itinerary Revisions Included</Label>
                      <Select value={revisionCount} onValueChange={setRevisionCount}>
                        <SelectTrigger className={selectTriggerClasses}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 revision</SelectItem>
                          <SelectItem value="2">2 revisions</SelectItem>
                          <SelectItem value="3">3 revisions</SelectItem>
                          <SelectItem value="unlimited">Unlimited within scope</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClasses}>Support Level</Label>
                      <Select value={supportLevel} onValueChange={setSupportLevel}>
                        <SelectTrigger className={selectTriggerClasses}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email only</SelectItem>
                          <SelectItem value="business_hours">Business hours phone</SelectItem>
                          <SelectItem value="24_7">24/7 emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Checkbox
                      id="supplier-payments"
                      checked={handlesSupplierPayments}
                      onCheckedChange={(c) => setHandlesSupplierPayments(!!c)}
                      className="mt-0.5"
                    />
                    <div style={isHire ? { display: "none" } : undefined}>
                      <Label htmlFor="supplier-payments" className={`${labelClasses} cursor-pointer font-medium`}>I handle payments to suppliers</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">I will process payments to hotels, tours, and other suppliers on behalf of the traveler.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 2: Pricing & Payment */}
            {step === 2 && (
              <Card className="rounded-2xl border-0 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Step Three</p>
                    <h2 className="font-secondary text-[24px] leading-snug text-[#0a2225]">Pricing & Payment</h2>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#0a2225]/55">Define your pricing structure and payment terms.</p>
                  </div>

                  <div style={isHire ? { display: "none" } : undefined} className="space-y-3">
                    <Label className={labelClasses}>Pricing Type</Label>
                    <RadioGroup value={pricingType} onValueChange={setPricingType} className="flex gap-3">
                      <label className={`flex-1 flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${pricingType === "per_person" ? "border-[#0c4d47] bg-[#0c4d47]/5" : "hover:bg-muted/30"}`}>
                        <RadioGroupItem value="per_person" />
                        <span className="text-sm font-medium">Per Person</span>
                      </label>
                      <label className={`flex-1 flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${pricingType === "total" ? "border-[#0c4d47] bg-[#0c4d47]/5" : "hover:bg-muted/30"}`}>
                        <RadioGroupItem value="total" />
                        <span className="text-sm font-medium">Total Trip Cost</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses} htmlFor="price">{isHire ? `Total for the trip${hireDays > 0 && hireRate ? ` (\u2248 ${hireDays} days \u00d7 $${hireRate}/day)` : ""}` : `Trip Cost (${pricingType === "per_person" ? "per person" : "total"})`} <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        min={0}
                        placeholder="0"
                        className={`${inputClasses} pl-9 sm:pl-10`}
                        value={priceFrom}
                        onChange={(e) => setPriceFrom(e.target.value ? Number(e.target.value) : "")}
                      />
                    </div>
                  </div>

                  {/* Commission Pricing Model */}
                  <div className="space-y-4">
                    <div style={isHire ? { display: "none" } : undefined}>
                      <Label className="text-sm font-semibold">How You Earn</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Select how your commission is structured for this trip.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {([
                        { value: "percentage" as CommissionModel, label: "Percentage Commission", desc: "Earn a % of total trip value", icon: Percent },
                        { value: "flat_fee" as CommissionModel, label: "Flat Planning Fee", desc: "Charge a fixed service fee", icon: DollarSign },
                        { value: "hybrid" as CommissionModel, label: "Hybrid", desc: "Fixed fee + % commission", icon: Plus },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCommissionModel(opt.value)}
                          className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all ${
                            commissionModel === opt.value
                              ? "border-[#0c4d47] bg-[#0c4d47]/5"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <opt.icon className={`h-5 w-5 ${commissionModel === opt.value ? "text-[#0c4d47]" : "text-[#8D6B2F]"}`} strokeWidth={2.25} />
                          <div>
                            <p className="text-sm font-medium">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Percentage Commission Fields */}
                    {commissionModel === "percentage" && (
                      <div className="space-y-4 pl-1">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className={labelClasses} htmlFor="commission-pct">Commission %</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[280px]">
                                  <p className="text-xs">Industry standard is 10–20% commission on total trip value. Luxury and bespoke experiences may command 15–25%.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="relative w-32">
                            <Input
                              id="commission-pct"
                              type="number"
                              min={1}
                              max={50}
                              step={0.5}
                              value={commissionPct}
                              onChange={(e) => setCommissionPct(e.target.value ? Number(e.target.value) : "")}
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-lg border p-4">
                          <Checkbox
                            id="tiered-commission"
                            checked={commissionTiered}
                            onCheckedChange={(c) => setCommissionTiered(!!c)}
                            className="mt-0.5"
                          />
                          <div>
                            <Label htmlFor="tiered-commission" className={`${labelClasses} cursor-pointer font-medium`}>Tiered commission</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">e.g. 20% on the first $5,000 and 15% above</p>
                          </div>
                        </div>

                        {commissionTiered && (
                          <div className="space-y-2 pl-4">
                            {commissionTiers.map((tier, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {i === 0 ? "First" : "Above"} $
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="Threshold"
                                  value={tier.threshold === Infinity ? "" : tier.threshold}
                                  onChange={(e) => {
                                    const next = [...commissionTiers];
                                    next[i] = { ...tier, threshold: e.target.value ? Number(e.target.value) : Infinity };
                                    setCommissionTiers(next);
                                  }}
                                  className="w-28"
                                  disabled={i === commissionTiers.length - 1}
                                />
                                <span className="text-xs text-muted-foreground">at</span>
                                <Input
                                  type="number"
                                  min={1}
                                  max={50}
                                  step={0.5}
                                  value={tier.pct}
                                  onChange={(e) => {
                                    const next = [...commissionTiers];
                                    next[i] = { ...tier, pct: Number(e.target.value) || 0 };
                                    setCommissionTiers(next);
                                  }}
                                  className="w-20"
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                                {commissionTiers.length > 2 && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCommissionTiers((prev) => prev.filter((_, j) => j !== i))}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => {
                              const last = commissionTiers[commissionTiers.length - 1];
                              setCommissionTiers((prev) => [
                                ...prev.slice(0, -1),
                                { ...prev[prev.length - 2], threshold: prev[prev.length - 2]?.threshold || 5000 },
                                { threshold: Infinity, pct: last.pct }
                              ]);
                            }}>
                              <Plus className="h-3.5 w-3.5 mr-1" /> Add Tier
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Flat Fee Fields */}
                    {commissionModel === "flat_fee" && (
                      <div className="space-y-4 pl-1">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className={labelClasses} htmlFor="flat-fee">Fee Amount</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[280px]">
                                  <p className="text-xs">Typical flat fees range from $299–$1,500+ depending on trip complexity.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="relative w-40">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="flat-fee"
                              type="number"
                              min={0}
                              placeholder="0"
                              className={`${inputClasses} pl-9 sm:pl-10`}
                              value={flatFeeAmount}
                              onChange={(e) => setFlatFeeAmount(e.target.value ? Number(e.target.value) : "")}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClasses}>Fee Covers</Label>
                          <Select value={flatFeeCovers} onValueChange={setFlatFeeCovers}>
                            <SelectTrigger className={`${selectTriggerClasses} w-60`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planning">Planning only</SelectItem>
                              <SelectItem value="execution">Planning + Execution</SelectItem>
                              <SelectItem value="full_service">Full service</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Hybrid Fields */}
                    {commissionModel === "hybrid" && (
                      <div className="space-y-4 pl-1">
                        <div className="flex items-center gap-2 mb-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[280px]">
                                <p className="text-xs">Common hybrid: $500 planning fee + 10% commission on bookings.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="text-xs text-muted-foreground">Flat fee + percentage commission</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className={labelClasses} htmlFor="hybrid-flat">Flat Fee</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="hybrid-flat"
                                type="number"
                                min={0}
                                placeholder="0"
                                className={`${inputClasses} pl-9 sm:pl-10`}
                                value={hybridFlatFee}
                                onChange={(e) => setHybridFlatFee(e.target.value ? Number(e.target.value) : "")}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses} htmlFor="hybrid-pct">Commission %</Label>
                            <div className="relative">
                              <Input
                                id="hybrid-pct"
                                type="number"
                                min={1}
                                max={50}
                                step={0.5}
                                value={hybridCommissionPct}
                                onChange={(e) => setHybridCommissionPct(e.target.value ? Number(e.target.value) : "")}
                                className="pr-8"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fee Breakdown Card */}
                  {commissionCalc.commission > 0 && (
                    <div className="rounded-lg border-2 border-[#0c4d47]/20 bg-[#0c4d47]/5 p-5 space-y-4">
                      <p className="text-sm font-semibold text-foreground">Fee Breakdown</p>

                      {/* Agent side */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Your Commission</span>
                          <span className="font-medium text-foreground">${commissionCalc.commission.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Platform fee (3.5%)</span>
                          <span className="text-destructive">-${commissionCalc.hostFee.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-[#0c4d47]/20 pt-1.5 flex justify-between text-sm font-semibold">
                          <span className="text-[#0c4d47]">Your Estimated Payout</span>
                          <span className="text-[#0c4d47]">${commissionCalc.agentPayout.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Traveler side */}
                      <div className="border-t border-[#0c4d47]/20 pt-3 space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What the Traveler Pays</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Trip Cost</span>
                          <span className="font-medium text-foreground">${(typeof priceFrom === "number" ? priceFrom : 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Service Fee (3.5%)</span>
                          <span className="text-foreground">+${commissionCalc.guestFee.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-[#0c4d47]/20 pt-1.5 flex justify-between text-sm font-semibold">
                          <span className="text-foreground">Traveler Total</span>
                          <span className="text-foreground">${commissionCalc.travelerTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* STEP 3: Cancellation Policy */}
            {step === 3 && (
              <Card className="rounded-2xl border-0 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Step Four</p>
                    <h2 className="font-secondary text-[24px] leading-snug text-[#0a2225]">Cancellation & Refund Policy</h2>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#0a2225]/55">Define your cancellation terms. These are binding commitments shown to the traveler.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className={labelClasses}>Is Deposit Refundable?</Label>
                    <RadioGroup value={depositRefundable} onValueChange={setDepositRefundable} className="space-y-2">
                      {[
                        { value: "fully_refundable", label: "Fully refundable" },
                        { value: "partially_refundable", label: "Partially refundable" },
                        { value: "non_refundable", label: "Non-refundable" },
                      ].map((opt) => (
                        <label key={opt.value} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${depositRefundable === opt.value ? "border-[#0c4d47] bg-[#0c4d47]/5" : "hover:bg-muted/30"}`}>
                          <RadioGroupItem value={opt.value} />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className={labelClasses}>Cancellation Windows</Label>
                    <p className="text-xs text-muted-foreground">Set the refund percentage for each cancellation window relative to the departure date.</p>
                    <div className="space-y-2">
                      {cancellationWindows.map((w, i) => (
                        <div key={w.band} className="flex items-center gap-3 rounded-lg border p-3">
                          <span className="text-sm flex-1 min-w-0">{CANCELLATION_LABELS[w.band] || w.band}</span>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={w.refund_pct}
                            onChange={(e) => {
                              const next = [...cancellationWindows];
                              next[i] = { ...w, refund_pct: Number(e.target.value) || 0 };
                              setCancellationWindows(next);
                            }}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">% refund</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses} htmlFor="change-fee">Change Fee After Acceptance <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="change-fee"
                        type="number"
                        min={0}
                        placeholder="0"
                        className={`${inputClasses} pl-9 sm:pl-10`}
                        value={changeFee}
                        onChange={(e) => setChangeFee(e.target.value ? Number(e.target.value) : "")}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Fee charged for itinerary changes after the proposal is accepted.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <Checkbox
                        id="supplier-clause"
                        checked={supplierDependent}
                        onCheckedChange={(c) => setSupplierDependent(!!c)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="supplier-clause" className={`${labelClasses} cursor-pointer font-medium`}>Supplier-dependent cancellation clause</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Some components are subject to third-party supplier cancellation policies.</p>
                      </div>
                    </div>
                    {supplierDependent && (
                      <Textarea
                        placeholder="Specify which components are subject to supplier policies (e.g., safari bookings, boutique hotels with non-refundable rates)…"
                        value={supplierDependentNote}
                        onChange={(e) => setSupplierDependentNote(e.target.value)}
                        className={`${textareaClasses} min-h-[80px]`}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses} htmlFor="custom-terms">Additional Cancellation Terms <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Textarea
                      id="custom-terms"
                      placeholder="Any additional cancellation or refund terms not covered above…"
                      value={customCancellationTerms}
                      onChange={(e) => setCustomCancellationTerms(e.target.value)}
                      className={`${textareaClasses} min-h-[80px]`}
                    />
                    <button
                      type="button"
                      onClick={handleAiRefineTerms}
                      disabled={aiRefiningTerms || customCancellationTerms.trim().length < 10}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#C7A962]/60 bg-[#C7A962]/10 px-3.5 py-1.5 text-[12px] font-medium text-[#8D6B2F] transition-colors hover:bg-[#C7A962]/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {aiRefiningTerms ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {aiRefiningTerms ? "Refining…" : "Refine terms with Goldsainte AI"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 4: Deliverables */}
            {step === 4 && (
              <Card className="rounded-2xl border-0 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Step Five</p>
                    <h2 className="font-secondary text-[24px] leading-snug text-[#0a2225]">Deliverables</h2>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#0a2225]/55">Select and configure what the traveler will receive.</p>
                  </div>

                  {/* Full Itinerary PDF */}
                  <div className={`rounded-lg border p-4 space-y-3 transition-colors ${delItinerary ? "border-[#0c4d47] bg-[#0c4d47]/5" : ""}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox id="del-itinerary" checked={delItinerary} onCheckedChange={(c) => setDelItinerary(!!c)} className="mt-0.5" />
                      <div>
                        <Label htmlFor="del-itinerary" className={`${labelClasses} cursor-pointer font-medium`}>Full Itinerary PDF</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Day-by-day PDF with booking confirmations, maps, and contact details.</p>
                      </div>
                    </div>
                  </div>

                  {/* Booking Management */}
                  <div className={`rounded-lg border p-4 space-y-3 transition-colors ${delBookingMgmt ? "border-[#0c4d47] bg-[#0c4d47]/5" : ""}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox id="del-booking" checked={delBookingMgmt} onCheckedChange={(c) => setDelBookingMgmt(!!c)} className="mt-0.5" />
                      <div>
                        <Label htmlFor="del-booking" className={`${labelClasses} cursor-pointer font-medium`}>Booking Management</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">How bookings for hotels, flights, and activities are handled.</p>
                      </div>
                    </div>
                    {delBookingMgmt && (
                      <RadioGroup value={bookingMgmtLevel} onValueChange={setBookingMgmtLevel} className="pl-8 space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <RadioGroupItem value="advisory" /><span className="text-sm">Advisory only (recommendations)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <RadioGroupItem value="full_service" /><span className="text-sm">Full-service (I book everything)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <RadioGroupItem value="hybrid" /><span className="text-sm">Hybrid (I book key components)</span>
                        </label>
                      </RadioGroup>
                    )}
                  </div>

                  {/* On-Trip Support */}
                  <div className={`rounded-lg border p-4 space-y-3 transition-colors ${delOnTripSupport ? "border-[#0c4d47] bg-[#0c4d47]/5" : ""}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox id="del-support" checked={delOnTripSupport} onCheckedChange={(c) => setDelOnTripSupport(!!c)} className="mt-0.5" />
                      <div>
                        <Label htmlFor="del-support" className={`${labelClasses} cursor-pointer font-medium`}>On-Trip Support</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Support availability during the trip.</p>
                      </div>
                    </div>
                    {delOnTripSupport && (
                      <RadioGroup value={onTripSupportLevel} onValueChange={setOnTripSupportLevel} className="pl-8 space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <RadioGroupItem value="email" /><span className="text-sm">Email only</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <RadioGroupItem value="business_hours" /><span className="text-sm">Business hours phone support</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <RadioGroupItem value="24_7" /><span className="text-sm">24/7 emergency line</span>
                        </label>
                      </RadioGroup>
                    )}
                  </div>

                  {/* Revisions — read-only from step 1 */}
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="text-[#0c4d47]">✓</span>
                      <div>
                        <span className="font-medium text-sm">Revisions Included</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {revisionCount === "unlimited" ? "Unlimited within scope" : `${revisionCount} revision${revisionCount !== "1" ? "s" : ""}`} (set in Scope of Services)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Concierge */}
                  <div className={`rounded-lg border p-4 space-y-3 transition-colors ${delConcierge ? "border-[#0c4d47] bg-[#0c4d47]/5" : ""}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox id="del-concierge" checked={delConcierge} onCheckedChange={(c) => setDelConcierge(!!c)} className="mt-0.5" />
                      <div>
                        <Label htmlFor="del-concierge" className={`${labelClasses} cursor-pointer font-medium`}>Concierge Services</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Restaurant reservations, spa bookings, event tickets, etc.</p>
                      </div>
                    </div>
                    {delConcierge && (
                      <Input
                        placeholder="Specify what's included (e.g., restaurant reservations, spa bookings, event tickets)"
                        value={conciergeDetails}
                        onChange={(e) => setConciergeDetails(e.target.value)}
                        className={`${inputClasses} ml-8`}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 5: Attachments */}
            {step === 5 && (
              <Card className="rounded-2xl border-0 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Step Six</p>
                    <h2 className="font-secondary text-[24px] leading-snug text-[#0a2225]">Attachments</h2>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#0a2225]/55">Upload supporting documents or add external links to strengthen your proposal.</p>
                  </div>

                  {/* File uploads */}
                  <div className="space-y-3">
                    <Label className={labelClasses}>Upload Files <span className="text-muted-foreground font-normal">(max 5 files, 10MB each)</span></Label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {uploading ? "Uploading…" : "Click or drag files here"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WEBP</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        {uploadedFiles.map((f) => (
                          <div key={f.path} className="flex items-center gap-3 rounded-lg border p-3">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm flex-1 truncate">{f.name}</span>
                            <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)}KB</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(f.path)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* External links */}
                  <div className="space-y-3">
                    <Label className={labelClasses}>External Links <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <p className="text-xs text-muted-foreground">Portfolio, sample itineraries, or any supporting URLs.</p>
                    {externalLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          placeholder="https://..."
                          value={link}
                          onChange={(e) => {
                            const next = [...externalLinks];
                            next[i] = e.target.value;
                            setExternalLinks(next);
                          }}
                          className="flex-1"
                        />
                        {externalLinks.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExternalLinks((prev) => prev.filter((_, j) => j !== i))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {externalLinks.length < 5 && (
                      <Button variant="outline" size="sm" onClick={() => setExternalLinks((prev) => [...prev, ""])}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Link
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 6: Review & Submit */}
            {step === 6 && (
              <Card className="rounded-2xl border-0 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Step Seven</p>
                    <h2 className="font-secondary text-[24px] leading-snug text-[#0a2225]">Review & Submit</h2>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#0a2225]/55">Review your contract proposal before submitting.</p>
                  </div>

                  {/* Pitch Summary */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proposal Summary</h3>
                    <p className="font-semibold">{headline}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{message}</p>
                    {itinerarySummary && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Itinerary Summary</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{itinerarySummary}</p>
                      </div>
                    )}
                    <span className="inline-block text-xs bg-muted rounded-full px-2 py-0.5 capitalize">{proposerRole}</span>
                  </div>

                  {/* Scope */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scope of Services</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Service Level</span>
                      <span className="font-medium capitalize">{serviceLevel.replace("_", "-")}</span>
                      <span className="text-muted-foreground">Revisions</span>
                      <span className="font-medium">{revisionCount === "unlimited" ? "Unlimited" : revisionCount}</span>
                      <span className="text-muted-foreground">Support</span>
                      <span className="font-medium capitalize">{supportLevel.replace("_", " ")}</span>
                    </div>
                    {inclusionsText.trim() && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Inclusions</p>
                        <ul className="text-sm space-y-0.5">
                          {inclusionsText.split("\n").filter(Boolean).map((item, i) => (
                            <li key={i} className="flex items-start gap-2"><span className="text-[#0c4d47]">✓</span>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {exclusionsText.trim() && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Exclusions</p>
                        <ul className="text-sm space-y-0.5">
                          {exclusionsText.split("\n").filter(Boolean).map((item, i) => (
                            <li key={i} className="flex items-start gap-2"><span className="text-destructive">✗</span>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="rounded-lg border p-4 space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Pricing Type</span>
                      <span className="font-medium">{pricingType === "per_person" ? "Per Person" : "Total Trip Cost"}</span>
                      <span className="text-muted-foreground">Trip Cost</span>
                      <span className="font-medium">${typeof priceFrom === "number" ? priceFrom.toLocaleString() : "—"}</span>
                      {hasPlanningFee && planningFee && (
                        <>
                          <span className="text-muted-foreground">Planning Fee</span>
                          <span className="font-medium">${Number(planningFee).toLocaleString()} {planningFeeRefundable ? "(refundable)" : "(non-refundable)"}</span>
                        </>
                      )}
                      <span className="text-muted-foreground">Deposit</span>
                      <span className="font-medium">{depositPct}%{typeof priceFrom === "number" ? ` ($${Math.round(priceFrom * depositPct / 100).toLocaleString()})` : ""}</span>
                      <span className="text-muted-foreground">Deposit Due Within</span>
                      <span className="font-medium">{depositDueDays || "—"} days</span>
                      <span className="text-muted-foreground">Balance Due</span>
                      <span className="font-medium capitalize">{balanceDue.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground">Pricing Status</span>
                      <span className={`font-medium ${pricingConfirmed === "estimate" ? "text-amber-600" : ""}`}>
                        {pricingConfirmed === "confirmed" ? "Confirmed" : "Estimate (subject to availability)"}
                      </span>
                    </div>
                  </div>

                  {/* Payment Schedule — derived from the deposit terms above */}
                  {typeof depositPct === "number" && depositPct > 0 && depositPct < 100 && (
                    <div className="rounded-lg border p-4 space-y-2">
                      <h3 className="text-xs font-semibold text-[#0a2225]/75 uppercase tracking-wider">Payment Schedule</h3>
                      <div className="space-y-1">
                        {[
                          { name: "Deposit", percentage: depositPct, due: typeof depositDueDays === "number" ? `within ${depositDueDays} days of acceptance` : "on acceptance" },
                          { name: "Balance", percentage: 100 - depositPct, due: "before departure" },
                        ].map((m, i) => (
                          <div key={i} className="flex justify-between text-[15px]">
                            <span>{m.name} <span className="text-[#0a2225]/60">({m.due})</span></span>
                            <span className="font-medium">{m.percentage}%{typeof priceFrom === "number" ? ` ($${Math.round(priceFrom * m.percentage / 100).toLocaleString()})` : ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cancellation Policy */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cancellation & Refund Policy</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Deposit</span>
                      <span className="font-medium capitalize">{depositRefundable.replace(/_/g, " ")}</span>
                    </div>
                    <div className="rounded bg-muted/50 p-3 space-y-1">
                      {cancellationWindows.map((w) => (
                        <div key={w.band} className="flex justify-between text-sm">
                          <span>{CANCELLATION_LABELS[w.band]}</span>
                          <span className="font-medium">{w.refund_pct}% refund</span>
                        </div>
                      ))}
                    </div>
                    {changeFee && (
                      <p className="text-sm"><span className="text-muted-foreground">Change fee:</span> <span className="font-medium">${Number(changeFee).toLocaleString()}</span></p>
                    )}
                    {supplierDependent && (
                      <p className="text-sm text-amber-600 flex items-start gap-1">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        Some components subject to supplier cancellation policies.
                        {supplierDependentNote && ` ${supplierDependentNote}`}
                      </p>
                    )}
                    {customCancellationTerms && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customCancellationTerms}</p>
                    )}
                  </div>

                  {/* Deliverables */}
                  <div className="rounded-lg border p-4 space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deliverables</h3>
                    <ul className="space-y-1 text-sm">
                      {delItinerary && <li className="flex items-start gap-2"><span className="text-[#0c4d47]">✓</span>Full Itinerary PDF</li>}
                      {delBookingMgmt && <li className="flex items-start gap-2"><span className="text-[#0c4d47]">✓</span>Booking Management — {bookingMgmtLevel === "full_service" ? "Full-service" : bookingMgmtLevel === "advisory" ? "Advisory" : "Hybrid"}</li>}
                      {delOnTripSupport && <li className="flex items-start gap-2"><span className="text-[#0c4d47]">✓</span>On-Trip Support — {onTripSupportLevel === "24_7" ? "24/7 emergency" : onTripSupportLevel === "business_hours" ? "Business hours" : "Email only"}</li>}
                      <li className="flex items-start gap-2"><span className="text-[#0c4d47]">✓</span>Revisions — {revisionCount === "unlimited" ? "Unlimited within scope" : `${revisionCount} revision${revisionCount !== "1" ? "s" : ""}`}</li>
                      {delConcierge && conciergeDetails && <li className="flex items-start gap-2"><span className="text-[#0c4d47]">✓</span>Concierge — {conciergeDetails}</li>}
                    </ul>
                  </div>

                  {/* Attachments */}
                  {(uploadedFiles.length > 0 || externalLinks.some((l) => l.trim())) && (
                    <div className="rounded-lg border p-4 space-y-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attachments</h3>
                      {uploadedFiles.map((f) => (
                        <div key={f.path} className="flex items-center gap-2 text-sm">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{f.name}</span>
                        </div>
                      ))}
                      {externalLinks.filter((l) => l.trim()).map((link, i) => (
                        <p key={i} className="text-sm text-[#0c4d47] truncate">{link}</p>
                      ))}
                    </div>
                  )}

                  {/* Legal checkboxes */}
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terms & Acknowledgements</h3>

                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <Checkbox id="ack-terms" checked={ackTerms} onCheckedChange={(c) => setAckTerms(!!c)} className="mt-0.5" />
                      <Label htmlFor="ack-terms" className={`${labelClasses} text-sm cursor-pointer leading-relaxed`}>
                        I agree to Goldsainte's <a href="/terms" className="underline decoration-[#C7A962] underline-offset-2 hover:text-[#0c4d47]" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>marketplace terms and conditions</a>
                      </Label>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <Checkbox id="ack-deposit" checked={ackDeposit} onCheckedChange={(c) => setAckDeposit(!!c)} className="mt-0.5" />
                      <Label htmlFor="ack-deposit" className={`${labelClasses} text-sm cursor-pointer leading-relaxed`}>
                        I understand the <a href="/terms" className="underline decoration-[#C7A962] underline-offset-2 hover:text-[#0c4d47]" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>deposit handling rules and payment processing terms</a>
                      </Label>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <Checkbox id="ack-cancel" checked={ackCancellation} onCheckedChange={(c) => setAckCancellation(!!c)} className="mt-0.5" />
                      <Label htmlFor="ack-cancel" className={`${labelClasses} text-sm cursor-pointer leading-relaxed`}>
                        I acknowledge that the <a href="/cancellation-refund-policy" className="underline decoration-[#C7A962] underline-offset-2 hover:text-[#0c4d47]" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>cancellation policy and refund terms</a> stated above are binding commitments
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            <Card className="rounded-2xl border-0 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
              <CardContent className="p-5 space-y-4">
                <h3 className={eyebrowClasses}>Bid Context</h3>

                <div className="space-y-3">
                  <div className="flex items-baseline justify-between border-b border-[#0a2225]/8 pb-2.5">
                    <span className="text-[12.5px] text-[#0a2225]/55">Proposals</span>
                    <span className="font-secondary text-[15px] text-[#0a2225]">{proposalCount}</span>
                  </div>

                  {(tripData.budget_min || tripData.budget_max) && (
                    <div className="flex items-baseline justify-between border-b border-[#0a2225]/8 pb-2.5">
                      <span className="text-[12.5px] text-[#0a2225]/55">{isHire ? "Estimate" : "Budget"}</span>
                      <span className="font-secondary text-[15px] text-[#0a2225]">
                        {isHire && tripData.budget_max ? (
                          <>{"\u2248 "}${tripData.budget_max.toLocaleString()}</>
                        ) : (
                          <>
                            {tripData.budget_min ? `$${tripData.budget_min.toLocaleString()}` : ""}
                            {tripData.budget_min && tripData.budget_max ? " – " : ""}
                            {tripData.budget_max ? `$${tripData.budget_max.toLocaleString()}` : ""}
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between border-b border-[#0a2225]/8 pb-2.5">
                    <span className="text-[12.5px] text-[#0a2225]/55">Validity</span>
                    <span className="font-secondary text-[15px] text-[#0a2225]">14 days</span>
                  </div>

                  {isHire && Number(priceFrom) > 0 && (
                    <div className="pb-0.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12.5px] text-[#0a2225]/55">Your payout</span>
                        <span className="font-secondary text-[15px] text-[#8D6B2F]">${Math.round(Number(priceFrom) * 0.93).toLocaleString()}</span>
                      </div>
                      <p className="mt-0.5 text-right text-[10.5px] text-[#0a2225]/40">after the 7% platform fee</p>
                    </div>
                  )}
                  {!isHire && commissionCalc.agentPayout > 0 && (
                    <div className="flex items-baseline justify-between pb-0.5">
                      <span className="text-[12.5px] text-[#0a2225]/55">Est. payout</span>
                      <span className="font-secondary text-[15px] text-[#8D6B2F]">${commissionCalc.agentPayout.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Price vs budget indicator */}
                  {priceVsBudget && (
                    <div className={`rounded-xl px-3 py-2 text-[12px] leading-relaxed ${priceVsBudget === "within" ? "border border-[#0c4d47]/25 bg-[#0c4d47]/[0.06] text-[#0c4d47]" : "border border-[#C7A962]/40 bg-[#C7A962]/10 text-[#8D6B2F]"}`}>
                      {priceVsBudget === "within" ? "✓ Your price is within budget" : "Your price exceeds the stated budget"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current step indicator */}
            <div className="rounded-2xl bg-gradient-to-br from-[#0c4d47] to-[#0a2225] p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#C7A962]">
                Step {step + 1} of {STEPS.length}
              </p>
              <p className="mt-1 font-secondary text-[17px] text-[#fdfaf2]">{STEPS[step]}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <footer className="sticky bottom-0 border-t border-[#0a2225]/10 bg-[#fdfaf2]/95 backdrop-blur-sm pb-safe">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => { setStep((s) => Math.max(0, s - 1)); setAttempted(false); }}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#0a2225]/60 transition-colors hover:text-[#0a2225] disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>

          <div className="flex items-center gap-3">
            {attempted && !canAdvance() && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Fill in required fields to continue
              </p>
            )}
            {step < 6 ? (
              <button
                type="button"
                onClick={() => {
                  if (!canAdvance()) { setAttempted(true); return; }
                  setAttempted(false);
                  setStep((s) => s + 1);
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#0c4d47] px-7 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!canAdvance()) { setAttempted(true); return; }
                  handleSubmit();
                }}
                disabled={submitting}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#0c4d47] px-8 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:opacity-50"
              >
                {submitting ? (isEditing ? "Saving…" : "Submitting…") : isEditing ? "Save Changes" : "Submit Proposal"} <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
