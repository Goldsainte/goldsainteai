import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import SignaturePad from "react-signature-canvas";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Save,
  Send,
  Sparkles,
  Loader2,
  Upload,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Lock,
} from "lucide-react";

type ContractSection = {
  id: string;
  title: string;
  content: string;
  fields?: { name: string; value: string; required?: boolean }[];
};

const DEFAULT_SECTIONS: ContractSection[] = [
    {
      id: "parties",
      title: "Parties to the Agreement",
      content: "This Travel Services Agreement is entered into between the Agent and the Traveler.",
      fields: [
        { name: "agentName", value: "", required: true },
        { name: "agentAgency", value: "", required: true },
        { name: "agentLicense", value: "", required: false },
      ],
    },
    {
      id: "services",
      title: "Services Provided",
      content: "The Agent agrees to provide comprehensive travel planning and booking services including but not limited to:",
      fields: [
        { name: "servicesDescription", value: "Flight arrangements, hotel accommodations, activities booking, transportation coordination", required: true },
      ],
    },
    {
      id: "payment",
      title: "Payment Terms",
      content: "Payment schedule and terms for the services provided.",
      fields: [
        { name: "totalCost", value: "", required: true },
        { name: "depositAmount", value: "", required: true },
        { name: "depositDueDate", value: "", required: true },
        { name: "finalPaymentDate", value: "", required: true },
      ],
    },
    {
      id: "cancellation",
      title: "Cancellation Policy",
      content: "Terms and conditions for cancellation by either party.",
      fields: [
        { name: "cancellationTerms", value: "90+ days: full refund minus $500 admin fee. 60-89 days: 50% refund. 30-59 days: 25% refund. Less than 30 days: no refund.", required: true },
      ],
    },
    {
      id: "liability",
      title: "Liability and Insurance",
      content: "The Agent recommends travel insurance and limits liability as follows:",
      fields: [
        { name: "insuranceRecommendation", value: "Travel insurance strongly recommended", required: true },
        { name: "liabilityLimit", value: "Agent liability limited to total amount paid for services", required: true },
      ],
    },
    {
      id: "modifications",
      title: "Trip Modifications",
      content: "Terms for changes to the itinerary after booking.",
      fields: [
        { name: "modificationPolicy", value: "Changes subject to supplier penalties and $150 modification fee per change", required: true },
      ],
    },
    {
      id: "force_majeure",
      title: "Force Majeure",
      content: "Neither party shall be liable for failure to perform obligations due to circumstances beyond reasonable control.",
      fields: [],
    },
    {
      id: "dispute_resolution",
      title: "Dispute Resolution",
      content: "Any disputes shall be resolved through mediation before legal action.",
      fields: [
        { name: "governingLaw", value: "This agreement shall be governed by the laws of [State/Country]", required: true },
      ],
    },
    {
      id: "data_privacy",
      title: "Data Privacy",
      content: "Personal information will be used solely for trip planning and in accordance with applicable privacy laws.",
      fields: [],
    },
    {
      id: "responsibilities",
      title: "Traveler Responsibilities",
      content: "The Traveler agrees to:",
      fields: [
        { name: "travelerDuties", value: "Provide accurate information, obtain necessary travel documents, arrive on time for bookings, comply with supplier terms", required: true },
      ],
    },
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const PROTECTS: Record<string, string> = {
  parties: "Names exactly who is bound by this agreement.",
  services: "Defines the scope you're accountable for — nothing more.",
  payment: "Locks in the price and payment schedule you're owed.",
  cancellation: "Sets exactly what you keep if plans change.",
  liability: "Caps your exposure and puts insurance on the record.",
  modifications: "Shields you from unpaid change requests.",
  force_majeure: "Protects both parties when events beyond control intervene.",
  dispute_resolution: "Keeps disagreements in mediation before court.",
  data_privacy: "Commits both parties to lawful handling of personal data.",
  responsibilities: "Places key obligations squarely on the traveler.",
};

const labelCls = "text-sm font-medium text-[#0a2225]";
const inputCls =
  "h-11 w-full rounded-xl border border-[#E5DFC6] bg-white px-4 text-[15px] text-[#0a2225] outline-none transition-colors focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/30";
const textareaCls =
  "w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#0a2225] outline-none transition-colors focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/30";

const isMultiline = (name: string) =>
  /Description|Terms|Policy|Duties|Recommendation|Limit/i.test(name);
const fieldLabel = (name: string) =>
  name.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();

export default function AgentContractBuilder() {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams] = useSearchParams();
  const linkedBookingId = searchParams.get("bookingId");
  const navigate = useNavigate();
  const { toast } = useToast();
  const sigPadRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [tripData, setTripData] = useState<any>(null);
  const [travelerData, setTravelerData] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);

  const [contractId, setContractId] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<"template" | "uploaded">("template");
  const [uploadedPdfPath, setUploadedPdfPath] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [agentSignature, setAgentSignature] = useState<string>("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function load() {
    if (!tripId) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*, profiles!trips_traveler_id_fkey(full_name, email, id)")
        .eq("id", tripId)
        .single();
      if (tripError) throw tripError;
      setTripData(trip);
      let traveler: any = (trip as any).profiles ?? null;
      if (!traveler && trip.traveler_id) {
        const { data: tp } = await supabase
          .from("profiles")
          .select("full_name, email, id")
          .eq("id", trip.traveler_id)
          .maybeSingle();
        traveler = tp ?? null;
      }
      setTravelerData(traveler);

      // Real booking figures beat guesses
      let booking: any = null;
      if (linkedBookingId) {
        const { data: b } = await supabase
          .from("trip_bookings")
          .select("id, total_price, deposit_amount, currency")
          .eq("id", linkedBookingId)
          .maybeSingle();
        booking = b;
        setBookingData(b);
      }

      // Agent identity prefills
      const [{ data: prof }, { data: agentRec }] = await Promise.all([
        supabase.from("profiles").select("full_name, display_name").eq("id", user.id).maybeSingle(),
        supabase.from("travel_agents").select("agency_name, license_number").eq("user_id", user.id).maybeSingle(),
      ]);

      // Existing contract for this trip?
      const { data: existing } = await supabase
        .from("trip_contracts")
        .select("id, field_values, agent_signature, source_type, uploaded_pdf_path")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const values: Record<string, string> = existing?.field_values
        ? { ...(existing.field_values as Record<string, string>) }
        : {};

      if (existing) {
        setContractId(existing.id);
        if (existing.agent_signature) setAgentSignature(existing.agent_signature);
        if ((existing as any).source_type === "uploaded") {
          setSourceType("uploaded");
          const path = (existing as any).uploaded_pdf_path ?? null;
          setUploadedPdfPath(path);
          setUploadedFileName(path ? String(path).split("/").pop() ?? null : null);
        }
      }

      // Deterministic prefills — fill blanks only, never clobber edits
      const def = (k: string, v: string | null | undefined) => {
        if (!values[k] && v) values[k] = String(v);
      };
      def("agentName", prof?.full_name || prof?.display_name);
      def("agentAgency", agentRec?.agency_name);
      def("agentLicense", agentRec?.license_number);
      if (booking?.total_price) def("totalCost", String(booking.total_price));
      if (booking?.deposit_amount) def("depositAmount", String(booking.deposit_amount));
      if (!values.totalCost) {
        const budgetStr = trip.budget_range?.match(/\d+/)?.[0];
        if (budgetStr) {
          values.totalCost = budgetStr;
          def("depositAmount", String(Math.round(Number(budgetStr) * 0.25)));
        }
      }
      def("depositDueDate", format(new Date(Date.now() + 7 * 86400000), "M/d/yyyy"));
      if (trip.start_date) {
        def(
          "finalPaymentDate",
          format(new Date(new Date(trip.start_date).getTime() - 30 * 86400000), "M/d/yyyy"),
        );
      }

      setFieldValues(values);
    } catch (e: any) {
      console.error("Contract load failed:", e);
      toast({
        variant: "destructive",
        title: "Couldn't load trip details",
        description: e.message || "Please go back and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const setField = (name: string, value: string) =>
    setFieldValues((prev) => ({ ...prev, [name]: value }));

  // ── Goldsainte AI: draft every clause ──
  async function handleAiDraft() {
    setAiDrafting(true);
    try {
      const dates = tripData?.start_date
        ? `${format(new Date(tripData.start_date), "MMM d")}${
            tripData?.end_date ? ` – ${format(new Date(tripData.end_date), "MMM d, yyyy")}` : ""
          }`
        : undefined;
      const { data, error } = await supabase.functions.invoke("ai-proposal-polish", {
        body: {
          mode: "contract_draft",
          destination: tripData?.destination ?? undefined,
          dates,
          trip_title: tripData?.title ?? undefined,
          traveler_name: travelerData?.full_name ?? undefined,
          agency: fieldValues.agentAgency ?? undefined,
          total_cost: Number(fieldValues.totalCost) || bookingData?.total_price || undefined,
          deposit_amount:
            Number(fieldValues.depositAmount) || bookingData?.deposit_amount || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFieldValues((prev) => ({
        ...prev,
        ...(data.services_description ? { servicesDescription: data.services_description } : {}),
        ...(data.cancellation_terms ? { cancellationTerms: data.cancellation_terms } : {}),
        ...(data.modification_policy ? { modificationPolicy: data.modification_policy } : {}),
        ...(data.traveler_duties ? { travelerDuties: data.traveler_duties } : {}),
        ...(data.insurance_recommendation
          ? { insuranceRecommendation: data.insurance_recommendation }
          : {}),
        ...(data.liability_limit ? { liabilityLimit: data.liability_limit } : {}),
      }));
      toast({
        title: "Contract drafted",
        description: "Every clause is editable — review each section before sending.",
      });
    } catch (e: any) {
      console.error("AI contract draft failed:", e);
      toast({
        variant: "destructive",
        title: "Couldn't draft right now",
        description: "Your fields are untouched — try again in a moment.",
      });
    } finally {
      setAiDrafting(false);
    }
  }

  // ── Bring-your-own contract ──
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ variant: "destructive", title: "PDF only", description: "Upload your contract as a PDF file." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Keep contract PDFs under 10 MB." });
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from("contracts")
        .upload(path, file, { contentType: "application/pdf" });
      if (error) throw error;
      setUploadedPdfPath(path);
      setUploadedFileName(file.name);
      toast({ title: "Contract uploaded", description: "Sign below, then send it to your traveler." });
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast({ variant: "destructive", title: "Upload failed", description: err.message || "Try again." });
    } finally {
      setUploading(false);
    }
  }

  // ── Save (returns the contract id — never trust stale state) ──
  async function handleSaveDraft(): Promise<string | null> {
    if (!tripId || !tripData || !travelerData) {
      toast({
        variant: "destructive",
        title: "Trip details incomplete",
        description: !travelerData
          ? "Couldn't find this trip's traveler — go back to the booking and open the contract again."
          : "The page is still loading — give it a second and try again.",
      });
      return null;
    }
    if (sourceType === "uploaded" && !uploadedPdfPath) {
      toast({
        variant: "destructive",
        title: "No contract file yet",
        description: "Upload your contract PDF before saving.",
      });
      return null;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const contractData: Record<string, unknown> = {
        trip_id: tripId,
        agent_id: user.id,
        traveler_id: travelerData.id,
        source_type: sourceType,
        contract_sections: sourceType === "template" ? DEFAULT_SECTIONS : [],
        field_values: sourceType === "template" ? fieldValues : {},
        uploaded_pdf_path: sourceType === "uploaded" ? uploadedPdfPath : null,
        traveler_info: {
          firstName: travelerData.full_name?.split(" ")[0] || "",
          lastName: travelerData.full_name?.split(" ").slice(1).join(" ") || "",
          email: travelerData.email,
        },
        trip_info: {
          destination: tripData.destination,
          startDate: tripData.start_date,
          endDate: tripData.end_date,
          duration: tripData.duration_days,
          totalCost: fieldValues.totalCost,
        },
        agent_signature: agentSignature || null,
        status: "draft",
      };
      if (linkedBookingId) contractData.booking_id = linkedBookingId;

      let savedId: string | null = contractId;
      if (contractId) {
        const { error } = await supabase
          .from("trip_contracts")
          .update(contractData)
          .eq("id", contractId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("trip_contracts")
          .insert(contractData)
          .select()
          .single();
        if (error) throw error;
        savedId = data?.id ?? null;
        if (data) setContractId(data.id);
      }

      toast({ title: "Draft saved", description: "Your contract draft has been saved." });
      return savedId;
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Failed to save draft",
      });
      return null;
    } finally {
      setSaving(false);
    }
  }

  // ── Send: save fresh, then notify by email + DM ──
  async function handleSendToTraveler() {
    if (!agentSignature) {
      toast({
        variant: "destructive",
        title: "Signature required",
        description: "Sign at the bottom of the page before sending.",
      });
      return;
    }
    const savedId = await handleSaveDraft();
    if (!savedId) return;
    if (!travelerData?.email) {
      toast({
        variant: "destructive",
        title: "Traveler email missing",
        description: "This traveler's profile has no email on file, so the contract can't be sent.",
      });
      return;
    }
    try {
      const { error: updateError } = await supabase
        .from("trip_contracts")
        .update({
          status: "pending_signatures",
          agent_signed_at: new Date().toISOString(),
        })
        .eq("id", savedId);
      if (updateError) throw updateError;

      // Email the signing link (best-effort — the DM below is the reliable channel)
      let emailOk = false;
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          "send-contract-notification",
          {
            body: {
              contractId: savedId,
              tripId,
              recipientEmail: travelerData.email,
              recipientType: "traveler",
            },
          },
        );
        if (emailError) throw emailError;
        emailOk = emailData?.emailDelivered !== false;
      } catch (emailErr) {
        console.error("Contract email failed (non-fatal):", emailErr);
      }

      // Auto-DM the signing link
      let dmOk = false;
      try {
        const signLink = `${window.location.origin}/contract/${savedId}/sign?type=traveler`;
        await supabase.functions.invoke("send-direct-message", {
          body: {
            recipientId: travelerData.id,
            message: `I've prepared your trip contract${
              tripData?.destination ? ` for ${tripData.destination}` : ""
            }. Please review and sign here: ${signLink}`,
            tripTitle: tripData?.title || tripData?.destination || "Trip contract",
          },
        });
        dmOk = true;
      } catch (dmErr) {
        console.error("Contract DM failed (non-fatal):", dmErr);
      }

      if (!emailOk && !dmOk) {
        throw new Error(
          "Couldn't reach the traveler by email or message — check the edge function logs.",
        );
      }

      toast({
        title: "Contract sent",
        description: `Signing link delivered${
          emailOk && dmOk ? " by email and message" : emailOk ? " by email" : " by message"
        }.`,
      });
      navigate("/partner-bookings");
    } catch (error: any) {
      console.error("Error sending contract:", error);
      toast({
        variant: "destructive",
        title: "Send failed",
        description: error.message || "Failed to send contract",
      });
    }
  }

  const requiredStatus = DEFAULT_SECTIONS.map((sec) => ({
    id: sec.id,
    missing: (sec.fields ?? []).filter((f) => {
      if (!f.required) return false;
      const v = (fieldValues[f.name] ?? f.value ?? "").trim();
      if (!v) return true;
      if (f.name === "governingLaw" && v.includes("[State/Country]")) return true;
      return false;
    }).length,
  }));
  const missingCount = requiredStatus.reduce((n, r) => n + r.missing, 0);

  const sendDisabled =
    saving ||
    !agentSignature ||
    (sourceType === "uploaded" && !uploadedPdfPath) ||
    (sourceType === "template" && missingCount > 0);
  const sendHint =
    sourceType === "template" && missingCount > 0
      ? `${missingCount} required field${missingCount === 1 ? "" : "s"} to complete`
      : !agentSignature
        ? "Sign at the bottom to enable sending"
        : sourceType === "uploaded" && !uploadedPdfPath
          ? "Upload your contract PDF first"
          : "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C7A962]" />
      </div>
    );
  }

  const dates =
    tripData?.start_date &&
    `${format(new Date(tripData.start_date), "M/d/yyyy")}${
      tripData?.end_date ? ` – ${format(new Date(tripData.end_date), "M/d/yyyy")}` : ""
    }`;

  const pill =
    "rounded-full border border-[#E5DFC6]/30 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#E5DFC6]";

  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      {/* Letterhead */}
      <div className="bg-gradient-to-br from-[#0c4d47] to-[#0a2225]">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-[#E5DFC6]/70 transition-colors hover:text-[#E5DFC6]"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C7A962]">
            Trip Service Agreement
          </p>
          <h1 className="mt-2 font-secondary text-3xl leading-tight text-[#fdfaf2] md:text-4xl">
            {tripData?.title || tripData?.destination || "Contract"}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {tripData?.destination && <span className={pill}>{tripData.destination}</span>}
            {dates && <span className={pill}>{dates}</span>}
            {travelerData?.full_name && (
              <span className={pill}>Traveler · {travelerData.full_name}</span>
            )}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6]/50 px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save draft
            </button>
            <button
              type="button"
              onClick={handleSendToTraveler}
              disabled={sendDisabled}
              className="inline-flex items-center gap-2 rounded-full bg-[#C7A962] px-6 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#0a2225] transition-colors hover:bg-[#d9bd7d] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Send to traveler
            </button>
            {sendHint && <span className="text-[11px] text-[#E5DFC6]/60">{sendHint}</span>}
            {!sendDisabled && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#C7A962]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ready to send
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
        {/* Source toggle */}
        <div className="rounded-2xl bg-white p-2 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setSourceType("template")}
              className={`flex-1 rounded-xl px-4 py-3 text-[14.5px] font-medium transition-colors ${
                sourceType === "template"
                  ? "bg-[#0c4d47] text-white"
                  : "text-[#0a2225]/60 hover:bg-[#f7f3ea]"
              }`}
            >
              Goldsainte template
            </button>
            <button
              type="button"
              onClick={() => setSourceType("uploaded")}
              className={`flex-1 rounded-xl px-4 py-3 text-[14.5px] font-medium transition-colors ${
                sourceType === "uploaded"
                  ? "bg-[#0c4d47] text-white"
                  : "text-[#0a2225]/60 hover:bg-[#f7f3ea]"
              }`}
            >
              Upload your own
            </button>
          </div>
          <p className="px-3 pb-2 pt-2.5 text-[13.5px] leading-relaxed text-[#0a2225]/50">
            {sourceType === "template"
              ? "A structured agreement your traveler signs online — draft it with AI or fill it by hand."
              : "Already have a contract your business uses? Upload the PDF — your traveler reviews and signs that exact document."}
          </p>
        </div>

        {sourceType === "template" ? (
          <>
            {/* Goldsainte AI */}
            <div className="rounded-2xl border border-[#C7A962]/40 bg-[#C7A962]/[0.07] p-4">
              <button
                type="button"
                onClick={handleAiDraft}
                disabled={aiDrafting}
                className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:opacity-50"
              >
                {aiDrafting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-[#C7A962]" />
                )}
                {aiDrafting ? "Drafting your contract…" : "Draft contract with Goldsainte AI"}
              </button>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#0a2225]/55">
                Fills every clause from this trip and booking — names, real amounts, dates, and
                plain-language terms. You review and edit each section before anything is sent.
              </p>
            </div>

            {/* Why this protects you */}
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, text: "Timestamped e-signatures from both parties" },
                { icon: Lock, text: "Traveler funds held in escrow until milestones" },
                { icon: FileText, text: "Executed PDF delivered to both parties" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-start gap-2.5 rounded-xl bg-white px-3.5 py-3 shadow-[0_2px_16px_rgba(0,0,0,0.05)]"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0c4d47]" />
                  <span className="text-[12.5px] leading-snug text-[#0a2225]/70">{text}</span>
                </div>
              ))}
            </div>

            {/* Sections */}
            {DEFAULT_SECTIONS.map((section, i) => (
              <div
                key={section.id}
                className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)] md:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                    Section {ROMAN[i] ?? i + 1}
                  </p>
                  {(section.fields?.some((f) => f.required) ?? false) &&
                    ((requiredStatus.find((r) => r.id === section.id)?.missing ?? 0) === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0c4d47]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-[0.14em] text-[#8D6B2F]">
                        {requiredStatus.find((r) => r.id === section.id)?.missing} required
                      </span>
                    ))}
                </div>
                <h2 className="mt-1.5 font-secondary text-[24px] leading-snug text-[#0a2225]">
                  {section.title}
                </h2>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[#0a2225]/55">
                  {section.content}
                </p>
                {PROTECTS[section.id] && (
                  <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47]/[0.06] px-3 py-1.5 text-[12px] text-[#0c4d47]">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    {PROTECTS[section.id]}
                  </p>
                )}
                {section.fields && section.fields.length > 0 && (
                  <div className="mt-5 space-y-4">
                    {section.fields.map((field) => {
                      const value = fieldValues[field.name] ?? field.value ?? "";
                      const isPlaceholder =
                        field.name === "governingLaw" && value.includes("[State/Country]");
                      return (
                        <div key={field.name} className="space-y-1.5">
                          <label htmlFor={field.name} className={labelCls}>
                            {fieldLabel(field.name)}
                            {field.required && <span className="ml-0.5 text-red-500">*</span>}
                          </label>
                          {isMultiline(field.name) ? (
                            <textarea
                              id={field.name}
                              rows={3}
                              value={value}
                              onChange={(e) => setField(field.name, e.target.value)}
                              className={textareaCls}
                            />
                          ) : (
                            <input
                              id={field.name}
                              type="text"
                              value={value}
                              onChange={(e) => setField(field.name, e.target.value)}
                              className={inputCls}
                            />
                          )}
                          {isPlaceholder && (
                            <p className="text-[12px] text-[#8D6B2F]">
                              Replace the placeholder with your governing state or country — this can't be sent until it's real.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          /* Upload your own */
          <div className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)] md:p-7">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Your document</p>
            <h2 className="mt-1.5 font-secondary text-[24px] leading-snug text-[#0a2225]">
              Upload your contract
            </h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#0a2225]/55">
              Your traveler reviews this exact document and signs it electronically. The final
              download includes a Goldsainte signature certificate appended to your PDF.
            </p>

            {uploadedPdfPath ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#0c4d47]/25 bg-[#0c4d47]/[0.05] px-4 py-3.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <FileText className="h-5 w-5 shrink-0 text-[#0c4d47]" />
                  <span className="truncate text-[15px] font-medium text-[#0a2225]">
                    {uploadedFileName || "Contract.pdf"}
                  </span>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0c4d47]" />
                </span>
                <label className="cursor-pointer rounded-full border border-[#C7A962]/60 bg-[#C7A962]/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#8D6B2F] transition-colors hover:bg-[#C7A962]/20">
                  Replace
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            ) : (
              <label className="mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#C7A962]/50 bg-[#fdfaf2] px-6 py-10 text-center transition-colors hover:border-[#C7A962] hover:bg-[#C7A962]/[0.06]">
                {uploading ? (
                  <Loader2 className="h-7 w-7 animate-spin text-[#C7A962]" />
                ) : (
                  <Upload className="h-7 w-7 text-[#C7A962]" />
                )}
                <span className="text-[15px] font-medium text-[#0a2225]">
                  {uploading ? "Uploading…" : "Choose your contract PDF"}
                </span>
                <span className="text-[12px] text-[#0a2225]/45">PDF only · up to 10 MB</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        )}

        {/* Agent signature */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)] md:p-7">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Execution</p>
          <h2 className="mt-1.5 font-secondary text-[24px] leading-snug text-[#0a2225]">
            Agent signature
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[#0a2225]/55">
            By signing, you confirm the information is accurate and you agree to the terms.
          </p>
          <div className="mt-5 rounded-xl border-2 border-dashed border-[#E5DFC6] p-4">
            {agentSignature ? (
              <div className="space-y-3">
                <img src={agentSignature} alt="Signature" className="max-h-28" loading="lazy" />
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0c4d47]">
                    <CheckCircle2 className="h-4 w-4" /> Signed
                  </span>
                  <button
                    type="button"
                    onClick={() => setAgentSignature("")}
                    className="rounded-full border border-[#0a2225]/20 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#0a2225]/60 transition-colors hover:bg-[#f7f3ea]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <SignaturePad
                ref={sigPadRef}
                canvasProps={{ className: "w-full h-32 bg-[#fdfaf2] rounded" }}
                onEnd={() => {
                  const pad = sigPadRef.current;
                  if (pad && !pad.isEmpty()) setAgentSignature(pad.toDataURL());
                }}
              />
            )}
          </div>
        </div>

        <p className="pb-6 text-center text-[11px] leading-relaxed text-[#0a2225]/40">
          Templates and AI-drafted language are provided for convenience and do not constitute
          legal advice.
        </p>
      </div>
    </div>
  );
}
