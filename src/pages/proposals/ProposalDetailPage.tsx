// src/pages/proposals/ProposalDetailPage.tsx
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Check,
  X,
  FileText,
  ExternalLink,
  Shield,
  Clock,
  AlertTriangle,
  Copy,
  Pencil,
  Ban,
  Info,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getProposalDetail,
  acceptProposal,
  declineProposal,
  type ProposalDetail,
} from "@/services/proposalsService";
import { withdrawProposal, markProposalViewed } from "@/services/proposalService";

const humanize = (v?: string | null) =>
  v ? v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : v;
import { TrustSafetyInline } from "@/components/trust/TrustSafetyInline";
import { TrustSafetyModal } from "@/components/trust/TrustSafetyModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicStorageUrl } from "@/lib/backendConfig";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type AccountType = "traveler" | "creator" | "agent" | "admin" | null;

function formatMoney(amount: number | null | undefined, currency = "USD") {
  if (amount == null) return "\u2014";
  // Cents matter at the money moment: a $2.50 deposit must never read "$3".
  const whole = Number.isInteger(amount);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(whole ? 0 : 2)}`;
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function humanStatus(status: string) {
  const map: Record<string, string> = {
    pending: "Awaiting Review",
    sent: "Awaiting Review",
    traveler_review: "Under Review",
    accepted: "Accepted",
    declined: "Declined",
    withdrawn: "Withdrawn",
    expired: "Expired",
  };
  return map[status] || status;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "accepted") return "default";
  if (status === "declined" || status === "withdrawn" || status === "expired") return "secondary";
  return "outline";
}

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function cancellationTierColor(label: string) {
  if (label.includes("60")) return "bg-emerald-50 border-emerald-200 text-emerald-800";
  if (label.includes("30")) return "bg-amber-50 border-amber-200 text-amber-800";
  if (label.includes("14")) return "bg-orange-50 border-orange-200 text-orange-800";
  return "bg-red-50 border-red-200 text-red-800";
}

export default function ProposalDetailPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [acceptedBooking, setAcceptedBooking] = useState<{ id: string; status: string | null } | null>(null);
  useEffect(() => {
    if (!proposalId) return;
    (async () => {
      try {
        const { data } = await (supabase
          .from("trip_bookings")
          .select("id, status" as any)
          .eq("proposal_id", proposalId)
          .limit(1) as any);
        const row: any = (data as any)?.[0];
        setAcceptedBooking(row ? { id: row.id, status: row.status ?? null } : null);
      } catch { /* CTA is an enhancement */ }
    })();
  }, [proposalId, proposal?.status]);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"accept" | "decline" | "withdraw" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!proposalId) return;
      try {
        const [{ data: authData }, detail] = await Promise.all([
          supabase.auth.getUser(),
          getProposalDetail(proposalId),
        ]);
        if (cancelled) return;
        const user = authData.user;
        if (user) {
          setCurrentUserId(user.id);
          const { data: profile } = await supabase
            .from("profiles")
            .select("account_type")
            .eq("id", user.id)
            .maybeSingle();
          setAccountType((profile?.account_type || "traveler") as AccountType);
        }
        setProposal(detail);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load proposal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [proposalId]);

  const isTraveler = proposal && currentUserId === proposal.traveler?.id;
  const isProposer = proposal && currentUserId === proposal.proposer?.id;

  // First genuine view by the trip owner flips sent → traveler_review, so the
  // proposer's Manage Proposal panel tells the truth ("currently reviewing")
  // instead of "hasn't reviewed this yet" forever. Server-side function
  // verifies ownership and only moves from 'sent'; fire-and-forget.
  const viewedMarkedRef = useRef(false);
  useEffect(() => {
    if (viewedMarkedRef.current) return;
    if (!proposal || !isTraveler || proposal.status !== "sent") return;
    viewedMarkedRef.current = true;
    void markProposalViewed(proposal.id);
  }, [proposal, isTraveler]);
  const isPending = proposal?.status === "pending" || proposal?.status === "sent" || proposal?.status === "traveler_review";

  async function handleAccept() {
    if (!proposalId || !proposal) return;
    setActionError(null);
    setActionLoading("accept");
    try {
      const result = await acceptProposal(proposalId);
      const bookingId = result?.booking_id;
      if (bookingId) {
        navigate(`/bookings/${bookingId}`);
      } else {
        const refreshed = await getProposalDetail(proposalId);
        setProposal(refreshed);
      }
    } catch (err: any) {
      setActionError(err.message || "We couldn't accept this proposal.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecline() {
    if (!proposalId || !proposal) return;
    setActionError(null);
    setActionLoading("decline");
    try {
      await declineProposal(proposalId);
      const refreshed = await getProposalDetail(proposalId);
      setProposal(refreshed);
    } catch (err: any) {
      setActionError(err.message || "We couldn't update this proposal.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleWithdraw() {
    if (!proposalId) return;
    setActionError(null);
    setActionLoading("withdraw");
    try {
      await withdrawProposal(proposalId);
      const refreshed = await getProposalDetail(proposalId);
      setProposal(refreshed);
    } catch (err: any) {
      setActionError(err.message || "We couldn't withdraw this proposal.");
    } finally {
      setActionLoading(null);
    }
  }

  const trip = proposal?.trip_request;
  const title = proposal?.headline || trip?.title || trip?.destination || "Trip Proposal";
  const pb = proposal?.price_breakdown;
  const hireInfo: any = (pb as any)?.hire ?? null;
  const isHireProposal = Boolean(hireInfo);
  const hirePartnerFirst = (proposal?.proposer?.display_name || "your host").split(" ")[0];
  const depositAmount = proposal?.price_from && proposal?.deposit_percentage
    ? Math.round(proposal.price_from * proposal.deposit_percentage / 100)
    : null;
  const validDays = daysUntil(proposal?.valid_until);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-[15px] text-muted-foreground animate-pulse">Loading proposal…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-destructive">{error}</p>
        <Button variant="link" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/marketplace/trip-requests'))}>Go back</Button>
      </div>
    );
  }

  if (!proposal)
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FDF9F0] px-6">
        <div className="max-w-md rounded-[20px] border border-[#E5DFC6] bg-white p-8 text-center">
          <p className="text-[12px] uppercase tracking-[0.28em] text-[#0c4d47]/70">Proposal</p>
          <h2 className="mt-2 font-secondary text-2xl text-[#0a2225]">
            This proposal isn't available
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#0a2225]/60">
            It may have been withdrawn, or your account may not have access to
            it. If you arrived from an email, make sure you're signed in with
            the address the trip request was posted under.
          </p>
          <button
            onClick={() => navigate("/my-bookings")}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0c4d47] px-6 py-2.5 text-[15px] font-medium text-[#f7f3ea] hover:bg-[#0a2225] transition-colors"
          >
            Go to my journeys
          </button>
        </div>
      </div>
    );

  const inclusionsList = proposal.inclusions?.split("\n").filter(Boolean) ?? [];
  const exclusionsList = proposal.exclusions?.split("\n").filter(Boolean) ?? [];

  return (
    <main className="min-h-screen bg-muted/30 text-foreground">
      {/* ═══════════════════════════════════════════════
          SECTION 1: OFFER OVERVIEW
          ═══════════════════════════════════════════════ */}
      <section className="bg-card border-b">
        <div className="mx-auto max-w-5xl px-4 pt-8 pb-6 md:pt-12 md:pb-8">
          <Link
            to={isTraveler ? "/my-trips" : "/marketplace/trip-requests"}
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to trips
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-[13px] uppercase tracking-[0.18em] text-primary font-semibold">
                  Trip Proposal
                </p>
                <Badge variant={statusVariant(proposal.status)}>
                  {humanStatus(proposal.status)}
                </Badge>
              </div>
              <h1 className="font-secondary text-2xl md:text-3xl leading-tight text-foreground font-semibold">
                {title}
              </h1>
              <div className="flex flex-wrap gap-3 text-[15px] text-muted-foreground">
                {trip?.destination && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {trip.destination}
                  </span>
                )}
                {trip?.start_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(trip.start_date)}
                    {trip.end_date && ` – ${formatDate(trip.end_date)}`}
                  </span>
                )}
                {proposal.nights && (
                  <span>{proposal.nights} night{proposal.nights === 1 ? "" : "s"}</span>
                )}
              </div>
            </div>

            {/* Pricing summary */}
            <Card className="md:min-w-[280px] border-primary/20 bg-primary/5">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] uppercase tracking-wide text-muted-foreground font-medium">Total Price</span>
                  {pb?.pricing_confirmed ? (
                    <Badge variant="default" className="text-[12px]">Confirmed</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[12px]">Estimate</Badge>
                  )}
                </div>
                <p className="font-secondary text-3xl font-bold text-foreground">
                  {formatMoney(proposal.price_from, proposal.currency || "USD")}
                </p>
                {pb?.pricing_type && (
                  <p className="text-[14px] text-[#0a2225]/70">{humanize(pb.pricing_type)}</p>
                )}
                <div className="border-t pt-3 space-y-1.5">
                  {depositAmount && (
                    <div className="flex justify-between text-[15px]">
                      <span className="text-muted-foreground">Deposit Due</span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(depositAmount, proposal.currency || "USD")}
                        <span className="text-[13px] text-muted-foreground ml-1">({proposal.deposit_percentage}%)</span>
                      </span>
                    </div>
                  )}
                  {pb?.balance_due && (
                    <div className="flex justify-between text-[15px]">
                      <span className="text-muted-foreground">Balance Due</span>
                      <span className="text-foreground">{humanize(pb.balance_due)}</span>
                    </div>
                  )}
                  {proposal.valid_until && isPending && (
                    <div className="flex justify-between text-[15px]">
                      <span className="text-muted-foreground">Valid Until</span>
                      <span className={`font-medium ${validDays !== null && validDays <= 3 ? "text-destructive" : "text-foreground"}`}>
                        {formatDate(proposal.valid_until)}
                        {validDays !== null && validDays <= 3 && (
                          <span className="text-[13px] ml-1">({validDays}d left)</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Left Column */}
          <div className="min-w-0 space-y-6">

            {/* ── SECTION 2: THE PITCH ── */}
            {(proposal.message || proposal.itinerary_summary) && (
              <Card>
                <CardContent className="p-6 md:p-8">
                  {proposal.message && (
                    <div className="border-l-4 border-primary pl-5">
                      <p className="text-[13px] uppercase tracking-[0.16em] text-primary font-semibold mb-3">The Pitch</p>
                      <p className="text-[16px] leading-relaxed text-foreground whitespace-pre-line">
                        {proposal.message}
                      </p>
                    </div>
                  )}
                  {proposal.itinerary_summary && (
                    <div className={proposal.message ? "mt-6 pt-6 border-t" : ""}>
                      <p className="text-[13px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-3">Trip Overview</p>
                      <p className="text-[16px] leading-relaxed text-foreground whitespace-pre-line">
                        {proposal.itinerary_summary}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── SECTION 3: SCOPE OF SERVICES ── */}
            {(inclusionsList.length > 0 || exclusionsList.length > 0 || pb?.service_level) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Scope of Services</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-5">
                  <div className="grid md:grid-cols-2 gap-6">
                    {inclusionsList.length > 0 && (
                      <div>
                        <p className="text-[13px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">Included</p>
                        <ul className="space-y-2">
                          {inclusionsList.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[15px] text-foreground">
                              <Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {exclusionsList.length > 0 && (
                      <div>
                        <p className="text-[13px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">Not Included</p>
                        <ul className="space-y-2">
                          {exclusionsList.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[15px] text-muted-foreground">
                              <X className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Service details row */}
                  {(pb?.service_level || pb?.support_level || pb?.revision_count !== undefined) && (
                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                      {pb?.service_level && (
                        <Badge variant="outline" className="text-[13px]">
                          {pb.service_level}
                        </Badge>
                      )}
                      {pb?.support_level && (
                        <Badge variant="outline" className="text-[13px]">
                          Support: {pb.support_level}
                        </Badge>
                      )}
                      {pb?.revision_count !== undefined && pb.revision_count !== null && (
                        <Badge variant="outline" className="text-[13px]">
                          {pb.revision_count} revision{pb.revision_count === 1 ? "" : "s"} included
                        </Badge>
                      )}
                      {pb?.handles_supplier_payments && (
                        <Badge variant="outline" className="text-[13px]">
                          Supplier payments handled
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── SECTION 4: PAYMENT & CANCELLATION TERMS ── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Payment & Cancellation Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-6">

                {/* Pricing Breakdown */}
                <div className="space-y-3">
                  <p className="text-[13px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">Pricing Breakdown</p>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    {pb?.pricing_type && (
                      <div className="flex justify-between text-[16px]">
                        <span className="text-[#0a2225]/75">Pricing Type</span>
                        <span className="font-medium text-foreground">{humanize(pb.pricing_type)}</span>
                      </div>
                    )}
                    {proposal.price_from && (
                      <div className="flex justify-between text-[16px]">
                        <span className="text-[#0a2225]/75">Trip Cost</span>
                        <span className="font-semibold text-foreground">
                          {formatMoney(proposal.price_from, proposal.currency || "USD")}
                        </span>
                      </div>
                    )}

                    {/* Commission Structure */}
                    {pb?.commission_model && (
                      <div className="border-t pt-2 mt-2 space-y-1.5">
                        <p className="text-[13px] font-semibold text-[#0a2225]/75 uppercase tracking-wide">Commission Structure</p>
                        {pb.commission_model === "percentage" && (
                          <div className="flex justify-between text-[16px]">
                            <span className="text-[#0a2225]/75">Commission</span>
                            <span className="font-medium text-foreground">{pb.commission_pct}% on total trip value</span>
                          </div>
                        )}
                        {pb.commission_model === "flat_fee" && (
                          <div className="flex justify-between text-[16px]">
                            <span className="text-[#0a2225]/75">Service Fee</span>
                            <span className="font-medium text-foreground">
                              {formatMoney(pb.flat_fee_amount, proposal.currency || "USD")}
                              <span className="text-[13px] text-[#0a2225]/75 ml-1">
                                ({pb.flat_fee_covers === "planning" ? "Planning only" : pb.flat_fee_covers === "execution" ? "Planning + Execution" : "Full service"})
                              </span>
                            </span>
                          </div>
                        )}
                        {pb.commission_model === "hybrid" && (
                          <div className="flex justify-between text-[16px]">
                            <span className="text-[#0a2225]/75">Service Fee + Commission</span>
                            <span className="font-medium text-foreground">
                              {formatMoney(pb.hybrid_flat_fee, proposal.currency || "USD")} + {pb.hybrid_commission_pct}%
                            </span>
                          </div>
                        )}
                        {pb.commission_tiered && pb.commission_tiers && Array.isArray(pb.commission_tiers) && (
                          <div className="pl-2 space-y-1">
                            {(pb.commission_tiers as Array<{threshold: number; pct: number}>).map((tier, i) => (
                              <p key={i} className="text-[13px] text-[#0a2225]/75">
                                {tier.threshold === Infinity || !tier.threshold
                                  ? `Above previous tier`
                                  : i === 0
                                    ? `First ${formatMoney(tier.threshold, proposal.currency || "USD")}`
                                    : `Above ${formatMoney((pb.commission_tiers as Array<{threshold: number}>)[i - 1]?.threshold, proposal.currency || "USD")}`
                                } at {tier.pct}%
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Traveler-facing fee rows */}
                    {pb?.guest_service_fee_estimate && proposal.price_from && (
                      <div className="border-t pt-2 mt-2 space-y-1.5">
                        <div className="flex justify-between text-[16px]">
                          <span className="text-[#0a2225]/75 flex items-center gap-1">
                            Service Fee (3.5%)
                            <span title="Covers Goldsainte traveler protection, support, and secure payment processing." className="cursor-help">
                              <Info className="h-3 w-3 text-[#0a2225]/75" />
                            </span>
                          </span>
                          <span className="text-foreground">+{formatMoney(pb.guest_service_fee_estimate, proposal.currency || "USD")}</span>
                        </div>
                        <div className="flex justify-between text-[16px] font-semibold">
                          <span className="text-foreground">Traveler Total</span>
                          <span className="text-foreground">{formatMoney(pb.traveler_total_estimate, proposal.currency || "USD")}</span>
                        </div>
                      </div>
                    )}

                    {/* Agent-facing rows (only for proposer) */}
                    {isProposer && pb?.agent_commission_estimate != null && (
                      <div className="border-t pt-2 mt-2 space-y-1.5">
                        <p className="text-[13px] font-semibold text-[#0a2225]/75 uppercase tracking-wide">Your Earnings</p>
                        <div className="flex justify-between text-[16px]">
                          <span className="text-[#0a2225]/75">Your Commission</span>
                          <span className="font-medium text-foreground">{formatMoney(pb.agent_commission_estimate, proposal.currency || "USD")}</span>
                        </div>
                        <div className="flex justify-between text-[16px]">
                          <span className="text-[#0a2225]/75">Platform Fee (3.5%)</span>
                          <span className="text-destructive">-{formatMoney(Math.round((proposal.price_from || 0) * 0.035), proposal.currency || "USD")}</span>
                        </div>
                        <div className="flex justify-between text-[16px] font-semibold">
                          <span className="text-emerald-700">Your Payout</span>
                          <span className="text-emerald-700">{formatMoney(pb.agent_payout_estimate, proposal.currency || "USD")}</span>
                        </div>
                      </div>
                    )}

                    {pb?.planning_fee && (
                      <div className="flex justify-between text-[16px]">
                        <span className="text-[#0a2225]/75">
                          Planning Fee
                          {pb.planning_fee_refundable !== undefined && (
                            <Badge variant={pb.planning_fee_refundable ? "default" : "secondary"} className="text-[12px] ml-2">
                              {pb.planning_fee_refundable ? "Refundable" : "Non-refundable"}
                            </Badge>
                          )}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatMoney(pb.planning_fee, proposal.currency || "USD")}
                        </span>
                      </div>
                    )}
                    {depositAmount && (
                      <div className="flex justify-between text-[16px]">
                        <span className="text-[#0a2225]/75">Deposit ({proposal.deposit_percentage}%)</span>
                        <span className="font-medium text-foreground">
                          {formatMoney(depositAmount, proposal.currency || "USD")}
                          {proposal.deposit_due_days && (
                            <span className="text-[13px] text-[#0a2225]/75 ml-1">
                              due within {proposal.deposit_due_days} day{proposal.deposit_due_days === 1 ? "" : "s"}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {pb?.balance_due && (
                      <div className="flex justify-between text-[16px]">
                        <span className="text-[#0a2225]/75">Balance Due</span>
                        <span className="text-foreground">{humanize(pb.balance_due)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] uppercase tracking-[0.14em] text-[#0a2225]/75 font-semibold">Cancellation Policy</p>
                    {pb?.deposit_refundable && (
                      <Badge variant={pb.deposit_refundable === "fully" ? "default" : pb.deposit_refundable === "partial" ? "outline" : "secondary"} className="text-[12px]">
                        Deposit: {pb.deposit_refundable === "fully" ? "Fully Refundable" : pb.deposit_refundable === "partial" ? "Partially Refundable" : "Non-refundable"}
                      </Badge>
                    )}
                  </div>

                  {pb?.cancellation_windows && pb.cancellation_windows.length > 0 ? (
                    <div className="rounded-lg border overflow-hidden">
                      {pb.cancellation_windows.map((window: any, i: number) => {
                        const label = window.label || window.band || `Window ${i + 1}`;
                        const refund = window.refund_percent ?? window.refund_pct ?? 0;
                        return (
                          <div
                            key={i}
                            className={`flex items-center justify-between px-4 py-3 text-[15px] border-b last:border-0 ${cancellationTierColor(label)}`}
                          >
                            <span className="font-medium">{label}</span>
                            <span className="font-semibold">{refund}% refund</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-[15px] text-[#0a2225]/75">
                        Standard Goldsainte cancellation policy applies. Contact your partner for specific terms.
                      </p>
                    </div>
                  )}

                  {pb?.change_fee && (
                    <p className="text-[15px] text-[#0a2225]/75 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      Change fee: {formatMoney(pb.change_fee, proposal.currency || "USD")} per revision after approval
                    </p>
                  )}

                  {pb?.supplier_dependent && (
                    <p className="text-[15px] text-[#0a2225]/75 flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 text-[#0a2225]/75" />
                      {pb.supplier_dependent_note || "Supplier cancellation policies may also apply."}
                    </p>
                  )}

                  {proposal.custom_cancellation_terms && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-[13px] uppercase tracking-wide text-[#0a2225]/75 font-semibold mb-1">Additional Terms</p>
                      <p className="text-[15px] text-foreground whitespace-pre-line">{proposal.custom_cancellation_terms}</p>
                    </div>
                  )}
                </div>

                {/* Payment Schedule */}
                <div className="space-y-3">
                  <p className="text-[13px] uppercase tracking-[0.14em] text-[#0a2225]/75 font-semibold">Payment Schedule</p>
                  {(() => {
                    // Heal proposals saved with the old bogus "Full Payment
                    // 100%" default: when the stored schedule contradicts the
                    // deposit terms, derive the true one for display.
                    const stored = proposal.payment_schedule;
                    const dep = Number(proposal.deposit_percentage ?? 0);
                    const isBogusDefault =
                      Array.isArray(stored) && stored.length === 1 &&
                      Number(stored[0]?.percentage) === 100 && dep > 0 && dep < 100;
                    const schedule = (!stored || stored.length === 0 || isBogusDefault) && dep > 0 && dep < 100
                      ? [
                          { name: "Deposit", percentage: dep, due: (proposal as any).deposit_due_days ? `Within ${(proposal as any).deposit_due_days} days of acceptance` : "On acceptance" },
                          { name: "Balance", percentage: 100 - dep, due: "Before departure" },
                        ]
                      : stored;
                    return schedule && schedule.length > 0 ? (
                    <div className="rounded-lg border overflow-hidden">
                      <div className="overflow-x-auto"><table className="w-full text-[15px]">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-4 py-2.5 font-medium text-[#0a2225]/75">Milestone</th>
                            <th className="text-left px-4 py-2.5 font-medium text-[#0a2225]/75">Due</th>
                            <th className="text-right px-4 py-2.5 font-medium text-[#0a2225]/75">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedule.map((item: any, idx: number) => {
                            const milestoneLabel = item.label || item.name || `Payment ${idx + 1}`;
                            const milestoneAmount = item.amount
                              ? formatMoney(item.amount, proposal.currency || "USD")
                              : item.percentage != null
                                ? `${item.percentage}%`
                                : "—";
                            return (
                              <tr key={`${milestoneLabel}-${idx}`} className="border-t">
                                <td className="px-4 py-3 font-medium text-foreground">{milestoneLabel}</td>
                                <td className="px-4 py-3 text-[#0a2225]/75">{item.due || (item.due_on ? formatDate(item.due_on) : "—")}</td>
                                <td className="px-4 py-3 text-right font-semibold text-foreground">
                                  {milestoneAmount}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table></div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-[15px] text-[#0a2225]/75">
                        Payment schedule hasn't been specified yet. Confirm the deposit and balance structure with your partner before proceeding.
                      </p>
                    </div>
                  );
                  })()}
                </div>

                <p className="text-[13px] text-[#0a2225]/75 pt-2 border-t">
                  All payments are handled through Goldsainte's secure flow so your booking and any eligible refunds stay protected.
                </p>
              </CardContent>
            </Card>

            {/* ── SECTION 5: ATTACHMENTS ── */}
            {(proposal.attachments.length > 0 || (pb?.external_links && pb.external_links.length > 0)) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Attachments & Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-3">
                  {proposal.attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                      <div className="flex items-center gap-3 text-[15px] min-w-0">
                        <FileText className="h-4 w-4 text-[#0a2225]/75 shrink-0" />
                        <span className="text-foreground font-medium break-all min-w-0">{att.file_name}</span>
                        {att.file_type && (
                          <Badge variant="outline" className="text-[12px]">{att.file_type}</Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="xs" asChild>
                        <a href={getPublicStorageUrl("proposal-attachments", att.file_path)} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                  {pb?.external_links?.map((link: any, i: number) => {
                    const url = typeof link === "string" ? link : link?.url || "";
                    const label = typeof link === "string" ? link : (link?.label || link?.url || "Link");
                    return (
                    <div key={i} className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0 min-w-0">
                      <div className="flex items-start gap-3 text-[15px] min-w-0">
                        <ExternalLink className="h-4 w-4 mt-0.5 text-[#0a2225]/75 shrink-0" />
                        <span className="text-foreground break-all min-w-0">{label}</span>
                      </div>
                      <Button variant="ghost" size="xs" asChild className="shrink-0">
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* ── SECTION 6: WHAT HAPPENS NEXT ── */}
            {isPending && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    What Happens Next
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <p className="text-[15px] text-muted-foreground mb-3">If the traveler accepts this proposal:</p>
                  <ol className="space-y-2.5">
                    {(isProposer
                      ? isHireProposal
                        ? [
                            "The proposal becomes an active booking \u2014 no contract step for hires; the scope you sent is the agreement.",
                            `The traveler pays the ${depositAmount ? formatMoney(depositAmount, proposal.currency || "USD") + " " : ""}deposit \u2014 held in escrow from day one.`,
                            "Coordinate the days in Messages; the balance lands in escrow before departure.",
                            "Travel with them and deliver everything in your scope.",
                            "When the traveler confirms the trip went as agreed, your payout is released \u2014 your total minus the 7% platform fee.",
                          ]
                        : [
                          "The proposal becomes an active booking — and the first move is YOURS: open the booking and hit Create contract (Goldsainte AI can draft it for you), then send it. Both of you sign; nothing moves until it's fully executed.",
                          `Once both signatures are in, the traveler pays the ${depositAmount ? formatMoney(depositAmount, proposal.currency || "USD") + " " : ""}deposit. It's held in escrow — not released to you yet.`,
                          "You secure the reservations and share the confirmations with the traveler in Messages.",
                          "The traveler reviews the confirmations and releases the deposit to you as working capital (minus the platform fee).",
                          "The traveler pays the balance before departure; it stays in escrow through the trip.",
                          "After the trip, the traveler confirms completion and your final payout is released.",
                        ]
                      : isHireProposal
                        ? [
                            "Accepting creates your booking. The scope above is what you've both agreed to \u2014 no separate contract step for hires.",
                            `You pay the ${depositAmount ? formatMoney(depositAmount, proposal.currency || "USD") + " " : ""}deposit. It's held in escrow and stays protected until after the trip.`,
                            `${hirePartnerFirst} plans around your dates and stays in touch in Messages.`,
                            "The balance is due before departure and stays in escrow through your trip.",
                            `${hirePartnerFirst} joins your trip and delivers everything in the scope.`,
                            `When you confirm the trip went as agreed, the payout is released to ${hirePartnerFirst}.`,
                          ]
                        : [
                          "Accepting creates your booking. Your specialist prepares and sends the contract for both of you to sign — nothing is owed until it's fully executed.",
                          `Once both signatures are in, you pay the ${depositAmount ? formatMoney(depositAmount, proposal.currency || "USD") + " " : ""}deposit. It's held in escrow and stays under your control.`,
                          "Your specialist secures the reservations and shares the confirmations with you in Messages.",
                          "Only after you've reviewed them do you release the deposit so your specialist can lock everything in.",
                          "The balance is due before departure and stays in escrow through your trip.",
                          "When you confirm the trip went as agreed, the final payment is released to your specialist.",
                        ]
                    ).map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px] text-foreground">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[12.5px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* No content fallback */}
            {!proposal.message && !proposal.inclusions && !proposal.exclusions && (
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <p className="text-[15px] text-muted-foreground">
                    This proposal doesn't have detailed notes yet. Ask your {proposal.proposer?.role || "partner"} for more information via chat.
                  </p>
                </CardContent>
              </Card>
            )}

            <TrustSafetyInline />
          </div>

          {/* ═══════════════════════════════════════════════
              RIGHT SIDEBAR
              ═══════════════════════════════════════════════ */}
          <div className="min-w-0 space-y-5">
            <div className="lg:sticky lg:top-24 space-y-5">

              {/* Proposer info */}
              <Card className="bg-muted/50">
                <CardContent className="p-5">
                  <p className="text-[13px] uppercase tracking-[0.14em] text-primary font-semibold mb-3">Your Goldsainte Partner</p>
                  {proposal.proposer && (
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">
                        {proposal.proposer.display_name}
                      </p>
                      <p className="text-[15px] text-muted-foreground capitalize">
                        {proposal.proposer.role === "creator" ? "TikTok Creator" : "Travel Agent"}
                      </p>
                    </div>
                  )}
                  {proposal.traveler && (
                    <p className="text-[13px] text-muted-foreground mt-3">
                      Prepared for <span className="font-medium">{proposal.traveler.display_name}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Proposal metadata */}
              <Card>
                <CardContent className="p-5 space-y-2">
                  <p className="text-[13px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2">Proposal Details</p>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="text-foreground">{formatDate(proposal.created_at)}</span>
                  </div>
                  {proposal.valid_until && (
                    <div className="flex justify-between text-[15px]">
                      <span className="text-muted-foreground">Valid Until</span>
                      <span className={`font-medium ${validDays !== null && validDays <= 3 ? "text-destructive" : "text-foreground"}`}>
                        {formatDate(proposal.valid_until)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[15px]">
                    <span className="text-muted-foreground">Proposal ID</span>
                    <span className="text-foreground font-mono text-[13px]">{proposal.id.slice(0, 8)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions card */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <p className="text-[13px] uppercase tracking-[0.14em] text-primary font-semibold">
                    {isProposer ? "Manage Proposal" : "Next Steps"}
                  </p>

                  {actionError && <p className="text-[15px] text-destructive">{actionError}</p>}

                  {/* ── AGENT/CREATOR ACTIONS ── */}
                  {isProposer ? (
                    <div className="space-y-3">
                      {/* Status messaging */}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-[15px] text-muted-foreground">
                          {proposal.status === "sent" && "The traveler hasn't reviewed this yet. You can withdraw or edit while it's pending — and you'll get an email the moment they respond."}
                          {proposal.status === "traveler_review" && "The traveler is currently reviewing your proposal. You'll get an email when they decide — no need to keep checking."}
                          {proposal.status === "accepted" && "This proposal has been accepted. A booking has been created."}
                          {proposal.status === "declined" && "This proposal was declined by the traveler."}
                          {proposal.status === "withdrawn" && "You withdrew this proposal."}
                          {proposal.status === "expired" && "This proposal has expired."}
                          {proposal.status === "pending" && "This proposal is in draft. Send it when ready."}
                        </p>
                      </div>

                      {isPending && (
                        <>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => navigate(`/proposals/new?tripId=${trip?.id}&edit=${proposal.id}`)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Proposal
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-destructive hover:text-destructive"
                                disabled={actionLoading === "withdraw"}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                {actionLoading === "withdraw" ? "Withdrawing…" : "Withdraw Proposal"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Withdraw this proposal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  The traveler will no longer be able to accept this proposal. You can submit a new one later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleWithdraw}>Withdraw</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => navigate(`/proposals/new?tripId=${trip?.id}&duplicate=${proposal.id}`)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate Proposal
                          </Button>
                        </>
                      )}
                    </div>
                  ) : isTraveler ? (
                    <>
                      {isPending && (
                        <div className="space-y-4">
                          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <p className="text-[15px] font-semibold text-foreground">Before you confirm</p>
                            <p className="text-[15px] text-muted-foreground leading-relaxed">
                              Make sure you're comfortable with the itinerary, total price, and cancellation terms. Keep all changes and payments inside Goldsainte for protection.
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowSafetyModal(true)}
                              className="text-[13px] font-semibold text-primary hover:underline underline-offset-4"
                            >
                              Review safety & liability details →
                            </button>
                          </div>

                          <Button
                            onClick={handleAccept}
                            disabled={actionLoading === "accept"}
                            className="w-full"
                            size="lg"
                          >
                            {actionLoading === "accept" ? "Accepting…" : "Accept & Continue to Booking"}
                            <CheckCircle2 className="h-4 w-4 ml-2" />
                          </Button>

                          <Button
                            variant="outline"
                            onClick={handleDecline}
                            disabled={actionLoading === "decline"}
                            className="w-full"
                          >
                            {actionLoading === "decline" ? "Updating…" : "Decline This Proposal"}
                            <XCircle className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}

                      {proposal.status === "accepted" && (
                        <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                          <p className="text-[15px] font-semibold text-primary">
                            {acceptedBooking?.status === "deposit_pending"
                              ? "Accepted \u2014 your deposit locks it in"
                              : "Your booking is confirmed"}
                          </p>
                          <p className="text-[15px] text-muted-foreground">
                            All future changes, questions, and approvals should be handled inside Goldsainte to keep your trip protected.
                          </p>
                          {acceptedBooking && (
                            <Link
                              to={`/bookings/${acceptedBooking.id}`}
                              className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0c4d47] underline underline-offset-4 decoration-[#0a2225]/25 transition-colors hover:decoration-[#C7A962]"
                            >
                              {acceptedBooking.status === "deposit_pending" ? "Continue to your booking \u2014 pay the deposit" : "View your booking"}
                              <span className="font-secondary">{"\u2192"}</span>
                            </Link>
                          )}
                        </div>
                      )}

                      {!isPending && proposal.status !== "accepted" && (
                        <p className="text-[15px] text-muted-foreground">
                          This proposal is <span className="font-semibold">{humanStatus(proposal.status)}</span>.
                          You can post a new trip or review other proposals from your trip view.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[15px] text-muted-foreground">
                      This is how the traveler will see your proposal. You can send clarifications via the trip chat.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <TrustSafetyModal
        open={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        context="booking"
      />
    </main>
  );
}
