import { useState, useEffect, useMemo, useRef } from "react";
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
  Clock, Users, ChevronLeft, Upload, X, FileText, Plus, Trash2, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

type TripRequestData = {
  id: string;
  title: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  user_id: string;
};

type Milestone = { name: string; percentage: number };
type CancellationWindow = { band: string; refund_pct: number };
type UploadedFile = { name: string; path: string; size: number; type: string };

const STEPS = [
  "Your Pitch",
  "Scope of Services",
  "Pricing & Payment",
  "Cancellation Policy",
  "Deliverables",
  "Attachments",
  "Review & Submit",
];

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [tripData, setTripData] = useState<TripRequestData | null>(null);
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
  const [paymentScheduleType, setPaymentScheduleType] = useState("full_on_acceptance");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { name: "Deposit", percentage: 50 },
    { name: "Final Payment", percentage: 50 },
  ]);
  const [deliveryDays, setDeliveryDays] = useState<number | "">(7);

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

  // Step 5 — Attachments
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [externalLinks, setExternalLinks] = useState<string[]>([""]);
  const [uploading, setUploading] = useState(false);

  // Step 6 — Legal
  const [ackTerms, setAckTerms] = useState(false);
  const [ackDeposit, setAckDeposit] = useState(false);
  const [ackCancellation, setAckCancellation] = useState(false);

  const estimatedEarnings = useMemo(() => {
    if (!priceFrom || typeof priceFrom !== "number") return 0;
    return Math.round(priceFrom * 0.85);
  }, [priceFrom]);

  useEffect(() => {
    if (!tripId) return;
    (async () => {
      setLoading(true);
      const [{ data: trip }, { count }] = await Promise.all([
        supabase.from("trip_requests").select("id, title, destination, start_date, end_date, budget_min, budget_max, user_id").eq("id", tripId).maybeSingle(),
        supabase.from("trip_proposals").select("id", { count: "exact", head: true }).eq("trip_request_id", tripId),
      ]);
      setTripData(trip);
      setProposalCount(count ?? 0);
      setLoading(false);
    })();
  }, [tripId]);

  const canAdvance = () => {
    if (step === 0) return headline.trim().length > 0 && message.trim().length > 10;
    if (step === 1) return inclusionsText.trim().length > 0;
    if (step === 2) return typeof priceFrom === "number" && priceFrom > 0;
    if (step === 6) return ackTerms && ackDeposit && ackCancellation;
    return true;
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
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      const path = `${user.id}/${tripId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("proposal-attachments").upload(path, file);
      if (error) {
        toast.error(`Failed to upload ${file.name}`);
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
      cancellation_windows: cancellationWindows,
      ...(hasPlanningFee && planningFee ? { planning_fee: planningFee, planning_fee_refundable: planningFeeRefundable } : {}),
      ...(changeFee ? { change_fee: changeFee } : {}),
      ...(supplierDependent ? { supplier_dependent: true, supplier_dependent_note: supplierDependentNote } : {}),
      external_links: externalLinks.filter((l) => l.trim()),
    };

    const paymentSchedule = paymentScheduleType === "milestone" || paymentScheduleType === "custom"
      ? milestones
      : paymentScheduleType === "50_50"
        ? [{ name: "Deposit", percentage: 50 }, { name: "Final Payment", percentage: 50 }]
        : [{ name: "Full Payment", percentage: 100 }];

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

    const { data: insertedData, error } = await supabase.from("trip_proposals").insert(payload as any).select("id").single();

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

    // Notify traveler (non-blocking)
    supabase.functions.invoke("notify-trip-proposal", {
      body: { tripRequestId: tripId },
    }).catch((err) => console.error("Notification error:", err));

    setSubmitting(false);
    toast.success("Proposal submitted successfully!");
    navigate(`/proposals/${insertedData.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading trip details…</div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Trip request not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{tripData.title || "Trip Request"}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {tripData.destination && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
                  <MapPin className="h-3 w-3" />{tripData.destination}
                </span>
              )}
              {tripData.start_date && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
                  <Calendar className="h-3 w-3" />{format(new Date(tripData.start_date), "MMM d")}
                  {tripData.end_date && ` – ${format(new Date(tripData.end_date), "MMM d")}`}
                </span>
              )}
              {(tripData.budget_min || tripData.budget_max) && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
                  <DollarSign className="h-3 w-3" />
                  {tripData.budget_min && `$${tripData.budget_min.toLocaleString()}`}
                  {tripData.budget_min && tripData.budget_max && " – "}
                  {tripData.budget_max && `$${tripData.budget_max.toLocaleString()}`}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Step indicator */}
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1 w-full rounded-full transition-colors ${i <= step ? "bg-[#0c4d47]" : "bg-muted"}`} />
                <span className={`text-[10px] font-medium hidden sm:block ${i <= step ? "text-[#0c4d47]" : "text-muted-foreground"}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">

            {/* STEP 0: Pitch */}
            {step === 0 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Your Pitch</h2>
                    <p className="text-sm text-muted-foreground mt-1">Describe your proposed itinerary and why you're the best fit.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Your Role</Label>
                    <div className="flex gap-3">
                      {(["agent", "creator"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setProposerRole(role)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                            proposerRole === role
                              ? "border-[#0c4d47] bg-[#0c4d47]/5 text-[#0c4d47]"
                              : "border-muted bg-background text-muted-foreground hover:border-border"
                          }`}
                        >
                          {role === "agent" ? "Travel Agent" : "Creator"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headline">Headline</Label>
                    <Input
                      id="headline"
                      placeholder="e.g. 7-Night Luxury Safari with Private Guide"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Your Proposal</Label>
                    <Textarea
                      id="message"
                      placeholder="Describe your proposed itinerary, unique experiences, and why you're the best fit for this trip…"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[180px]"
                    />
                    <p className="text-xs text-muted-foreground text-right">{message.length} characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itinerary-summary">Itinerary Summary <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Textarea
                      id="itinerary-summary"
                      placeholder={"Day 1: Arrival & transfer to hotel\nDay 2: Guided city tour\nDay 3: Safari excursion\n..."}
                      value={itinerarySummary}
                      onChange={(e) => setItinerarySummary(e.target.value)}
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">Brief day-by-day overview of the proposed trip structure.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 1: Scope of Services */}
            {step === 1 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Scope of Services</h2>
                    <p className="text-sm text-muted-foreground mt-1">Define exactly what is and isn't included in your proposal.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inclusions">What's Included <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="inclusions"
                      placeholder={"Airport transfers\nHotel bookings (4-star+)\n2 guided excursions\nTravel insurance coordination\nRestaurant reservations"}
                      value={inclusionsText}
                      onChange={(e) => setInclusionsText(e.target.value)}
                      className="min-h-[140px]"
                    />
                    <p className="text-xs text-muted-foreground">One item per line. Be specific about what the traveler will receive.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exclusions">What's Not Included</Label>
                    <Textarea
                      id="exclusions"
                      placeholder={"International flights\nMeals not specified in itinerary\nPersonal expenses\nVisa fees\nTravel insurance premiums"}
                      value={exclusionsText}
                      onChange={(e) => setExclusionsText(e.target.value)}
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">One item per line. Setting clear exclusions prevents disputes.</p>
                  </div>

                  <div className="space-y-3">
                    <Label>Service Level</Label>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Itinerary Revisions Included</Label>
                      <Select value={revisionCount} onValueChange={setRevisionCount}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 revision</SelectItem>
                          <SelectItem value="2">2 revisions</SelectItem>
                          <SelectItem value="3">3 revisions</SelectItem>
                          <SelectItem value="unlimited">Unlimited within scope</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Support Level</Label>
                      <Select value={supportLevel} onValueChange={setSupportLevel}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <div>
                      <Label htmlFor="supplier-payments" className="cursor-pointer font-medium">I handle payments to suppliers</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">I will process payments to hotels, tours, and other suppliers on behalf of the traveler.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 2: Pricing & Payment */}
            {step === 2 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Pricing & Payment</h2>
                    <p className="text-sm text-muted-foreground mt-1">Define your pricing structure and payment terms.</p>
                  </div>

                  <div className="space-y-3">
                    <Label>Pricing Type</Label>
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
                    <Label htmlFor="price">Trip Cost ({pricingType === "per_person" ? "per person" : "total"}) <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        min={0}
                        placeholder="0"
                        className="pl-9"
                        value={priceFrom}
                        onChange={(e) => setPriceFrom(e.target.value ? Number(e.target.value) : "")}
                      />
                    </div>
                  </div>

                  {/* Planning fee */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <Checkbox
                        id="planning-fee"
                        checked={hasPlanningFee}
                        onCheckedChange={(c) => setHasPlanningFee(!!c)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="planning-fee" className="cursor-pointer font-medium">Includes separate planning fee</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">A fee charged for trip planning, separate from booking costs.</p>
                      </div>
                    </div>
                    {hasPlanningFee && (
                      <div className="pl-4 space-y-3">
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min={0}
                            placeholder="Planning fee amount"
                            className="pl-9"
                            value={planningFee}
                            onChange={(e) => setPlanningFee(e.target.value ? Number(e.target.value) : "")}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="planning-refundable"
                            checked={planningFeeRefundable}
                            onCheckedChange={(c) => setPlanningFeeRefundable(!!c)}
                          />
                          <Label htmlFor="planning-refundable" className="text-sm cursor-pointer">Planning fee is refundable</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Deposit: {depositPct}%</Label>
                    <Slider value={[depositPct]} onValueChange={([v]) => setDepositPct(v)} min={10} max={100} step={5} className="w-full" />
                    {typeof priceFrom === "number" && priceFrom > 0 && (
                      <p className="text-xs text-muted-foreground">Deposit: ${Math.round(priceFrom * depositPct / 100).toLocaleString()}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deposit-due">Deposit Due Within (days)</Label>
                      <Input
                        id="deposit-due"
                        type="number"
                        min={1}
                        value={depositDueDays}
                        onChange={(e) => setDepositDueDays(e.target.value ? Number(e.target.value) : "")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery-days">Deliver Itinerary (days)</Label>
                      <Input
                        id="delivery-days"
                        type="number"
                        min={1}
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value ? Number(e.target.value) : "")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Remaining Balance Due</Label>
                    <Select value={balanceDue} onValueChange={setBalanceDue}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before_departure">Before departure</SelectItem>
                        <SelectItem value="upon_delivery">Upon itinerary delivery</SelectItem>
                        <SelectItem value="custom">Custom date (specified in terms)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Is Pricing Confirmed?</Label>
                    <RadioGroup value={pricingConfirmed} onValueChange={setPricingConfirmed} className="flex gap-3">
                      <label className={`flex-1 flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${pricingConfirmed === "confirmed" ? "border-[#0c4d47] bg-[#0c4d47]/5" : "hover:bg-muted/30"}`}>
                        <RadioGroupItem value="confirmed" />
                        <span className="text-sm font-medium">Confirmed</span>
                      </label>
                      <label className={`flex-1 flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${pricingConfirmed === "estimate" ? "border-[#0c4d47] bg-[#0c4d47]/5" : "hover:bg-muted/30"}`}>
                        <RadioGroupItem value="estimate" />
                        <span className="text-sm font-medium">Estimate</span>
                      </label>
                    </RadioGroup>
                    {pricingConfirmed === "estimate" && (
                      <p className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Pricing is subject to availability and may change.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Payment Schedule</Label>
                    <Select value={paymentScheduleType} onValueChange={setPaymentScheduleType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_on_acceptance">Full payment on acceptance</SelectItem>
                        <SelectItem value="50_50">50/50 split</SelectItem>
                        <SelectItem value="milestone">Milestone-based</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {(paymentScheduleType === "milestone" || paymentScheduleType === "custom") && (
                      <div className="space-y-2 pl-1">
                        {milestones.map((m, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              placeholder="Milestone name"
                              value={m.name}
                              onChange={(e) => {
                                const next = [...milestones];
                                next[i] = { ...m, name: e.target.value };
                                setMilestones(next);
                              }}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              placeholder="%"
                              value={m.percentage}
                              onChange={(e) => {
                                const next = [...milestones];
                                next[i] = { ...m, percentage: Number(e.target.value) || 0 };
                                setMilestones(next);
                              }}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                            {milestones.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMilestones((prev) => prev.filter((_, j) => j !== i))}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setMilestones((prev) => [...prev, { name: "", percentage: 0 }])}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Milestone
                        </Button>
                        {milestones.reduce((sum, m) => sum + m.percentage, 0) !== 100 && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Milestones must total 100% (currently {milestones.reduce((sum, m) => sum + m.percentage, 0)}%)
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {estimatedEarnings > 0 && (
                    <div className="rounded-lg bg-[#0c4d47]/5 border border-[#0c4d47]/20 p-4">
                      <p className="text-sm font-medium text-[#0c4d47]">Estimated Earnings: ${estimatedEarnings.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">After 15% platform fee</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* STEP 3: Cancellation Policy */}
            {step === 3 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Cancellation & Refund Policy</h2>
                    <p className="text-sm text-muted-foreground mt-1">Define your cancellation terms. These are binding commitments shown to the traveler.</p>
                  </div>

                  <div className="space-y-3">
                    <Label>Is Deposit Refundable?</Label>
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
                    <Label>Cancellation Windows</Label>
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
                    <Label htmlFor="change-fee">Change Fee After Acceptance <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="change-fee"
                        type="number"
                        min={0}
                        placeholder="0"
                        className="pl-9"
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
                        <Label htmlFor="supplier-clause" className="cursor-pointer font-medium">Supplier-dependent cancellation clause</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Some components are subject to third-party supplier cancellation policies.</p>
                      </div>
                    </div>
                    {supplierDependent && (
                      <Textarea
                        placeholder="Specify which components are subject to supplier policies (e.g., safari bookings, boutique hotels with non-refundable rates)…"
                        value={supplierDependentNote}
                        onChange={(e) => setSupplierDependentNote(e.target.value)}
                        className="min-h-[80px]"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-terms">Additional Cancellation Terms <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Textarea
                      id="custom-terms"
                      placeholder="Any additional cancellation or refund terms not covered above…"
                      value={customCancellationTerms}
                      onChange={(e) => setCustomCancellationTerms(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 4: Deliverables */}
            {step === 4 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Deliverables</h2>
                    <p className="text-sm text-muted-foreground mt-1">Select and configure what the traveler will receive.</p>
                  </div>

                  {/* Full Itinerary PDF */}
                  <div className={`rounded-lg border p-4 space-y-3 transition-colors ${delItinerary ? "border-[#0c4d47] bg-[#0c4d47]/5" : ""}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox id="del-itinerary" checked={delItinerary} onCheckedChange={(c) => setDelItinerary(!!c)} className="mt-0.5" />
                      <div>
                        <Label htmlFor="del-itinerary" className="cursor-pointer font-medium">Full Itinerary PDF</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Day-by-day PDF with booking confirmations, maps, and contact details.</p>
                      </div>
                    </div>
                  </div>

                  {/* Booking Management */}
                  <div className={`rounded-lg border p-4 space-y-3 transition-colors ${delBookingMgmt ? "border-[#0c4d47] bg-[#0c4d47]/5" : ""}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox id="del-booking" checked={delBookingMgmt} onCheckedChange={(c) => setDelBookingMgmt(!!c)} className="mt-0.5" />
                      <div>
                        <Label htmlFor="del-booking" className="cursor-pointer font-medium">Booking Management</Label>
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
                        <Label htmlFor="del-support" className="cursor-pointer font-medium">On-Trip Support</Label>
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
                        <Label htmlFor="del-concierge" className="cursor-pointer font-medium">Concierge Services</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Restaurant reservations, spa bookings, event tickets, etc.</p>
                      </div>
                    </div>
                    {delConcierge && (
                      <Input
                        placeholder="Specify what's included (e.g., restaurant reservations, spa bookings, event tickets)"
                        value={conciergeDetails}
                        onChange={(e) => setConciergeDetails(e.target.value)}
                        className="ml-8"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 5: Attachments */}
            {step === 5 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Attachments</h2>
                    <p className="text-sm text-muted-foreground mt-1">Upload supporting documents or add external links to strengthen your proposal.</p>
                  </div>

                  {/* File uploads */}
                  <div className="space-y-3">
                    <Label>Upload Files <span className="text-muted-foreground font-normal">(max 5 files, 10MB each)</span></Label>
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
                    <Label>External Links <span className="text-muted-foreground font-normal">(optional)</span></Label>
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
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Review & Submit</h2>
                    <p className="text-sm text-muted-foreground mt-1">Review your contract proposal before submitting.</p>
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

                  {/* Payment Schedule */}
                  {paymentScheduleType !== "full_on_acceptance" && (
                    <div className="rounded-lg border p-4 space-y-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Schedule</h3>
                      <div className="space-y-1">
                        {(paymentScheduleType === "50_50"
                          ? [{ name: "Deposit", percentage: 50 }, { name: "Final Payment", percentage: 50 }]
                          : milestones
                        ).map((m, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{m.name}</span>
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
                      <Label htmlFor="ack-terms" className="text-sm cursor-pointer leading-relaxed">
                        I agree to Goldsainte's marketplace terms and conditions
                      </Label>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <Checkbox id="ack-deposit" checked={ackDeposit} onCheckedChange={(c) => setAckDeposit(!!c)} className="mt-0.5" />
                      <Label htmlFor="ack-deposit" className="text-sm cursor-pointer leading-relaxed">
                        I understand deposit handling rules and payment processing terms
                      </Label>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <Checkbox id="ack-cancel" checked={ackCancellation} onCheckedChange={(c) => setAckCancellation(!!c)} className="mt-0.5" />
                      <Label htmlFor="ack-cancel" className="text-sm cursor-pointer leading-relaxed">
                        I acknowledge that the cancellation policy and refund terms stated above are binding commitments
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            <Card className="border-0 shadow-md bg-[#0c4d47]/[0.03]">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Bid Context</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#0c4d47]" />
                    <span>{proposalCount} proposal{proposalCount !== 1 ? "s" : ""} submitted</span>
                  </div>

                  {(tripData.budget_min || tripData.budget_max) && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#0c4d47]" />
                      <span>
                        Budget: {tripData.budget_min ? `$${tripData.budget_min.toLocaleString()}` : ""}
                        {tripData.budget_min && tripData.budget_max ? " – " : ""}
                        {tripData.budget_max ? `$${tripData.budget_max.toLocaleString()}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Price vs budget indicator */}
                  {priceVsBudget && (
                    <div className={`rounded-lg p-2 text-xs font-medium ${priceVsBudget === "within" ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                      {priceVsBudget === "within" ? "✓ Your price is within budget" : "⚠ Your price exceeds the stated budget"}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#0c4d47]" />
                    <span>Proposal valid for 14 days</span>
                  </div>

                  {estimatedEarnings > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#0c4d47]" />
                      <span className="font-medium text-[#0c4d47]">
                        Est. earnings: ${estimatedEarnings.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current step indicator */}
            <div className="rounded-lg border border-[#0c4d47]/20 bg-[#0c4d47]/5 p-4 text-center">
              <p className="text-xs font-semibold text-[#0c4d47] uppercase tracking-wider">
                Step {step + 1} of {STEPS.length}: {STEPS[step]}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          {step < 6 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="bg-[#0c4d47] hover:bg-[#0a3f3a] text-white"
            >
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canAdvance()}
              className="bg-[#0c4d47] hover:bg-[#0a3f3a] text-white px-8"
              size="lg"
            >
              {submitting ? "Submitting…" : "Submit Proposal"} <Send className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
