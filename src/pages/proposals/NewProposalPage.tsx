import { useState, useEffect, useMemo } from "react";
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
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Send, MapPin, Calendar, DollarSign, Clock, Users, ChevronLeft } from "lucide-react";
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

const DELIVERABLES = [
  { key: "full_itinerary_pdf", label: "Full Itinerary PDF" },
  { key: "booking_management", label: "Booking Management Included" },
  { key: "on_trip_support", label: "On-Trip Support" },
  { key: "revisions_included", label: "Revisions Included" },
  { key: "concierge_services", label: "Concierge Services" },
] as const;

const STEPS = ["Your Pitch", "Pricing", "Deliverables", "Review & Submit"];

export default function NewProposalPage() {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get("tripId") || "";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [tripData, setTripData] = useState<TripRequestData | null>(null);
  const [proposalCount, setProposalCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Step 1 — Pitch
  const [headline, setHeadline] = useState("");
  const [message, setMessage] = useState("");
  const [proposerRole, setProposerRole] = useState<"agent" | "creator">("agent");

  // Step 2 — Pricing
  const [priceFrom, setPriceFrom] = useState<number | "">("");
  const [depositPct, setDepositPct] = useState(25);
  const [deliveryDays, setDeliveryDays] = useState<number | "">(7);
  const [bookingDays, setBookingDays] = useState<number | "">(14);

  // Step 3 — Deliverables
  const [selectedDeliverables, setSelectedDeliverables] = useState<Record<string, boolean>>({});
  const [deliverableNotes, setDeliverableNotes] = useState<Record<string, string>>({});

  const estimatedEarnings = useMemo(() => {
    if (!priceFrom || typeof priceFrom !== "number") return 0;
    return Math.round(priceFrom * 0.85);
  }, [priceFrom]);

  // Fetch trip request data + proposal count
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
    if (step === 1) return typeof priceFrom === "number" && priceFrom > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!user || !tripData) return;
    setSubmitting(true);

    const inclusions = DELIVERABLES.filter((d) => selectedDeliverables[d.key]).map((d) => {
      const note = deliverableNotes[d.key];
      return note ? `${d.label}: ${note}` : d.label;
    });

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 14);

    const payload = {
      trip_request_id: tripId,
      proposer_id: user.id,
      proposer_role: proposerRole,
      headline,
      message,
      price_from: typeof priceFrom === "number" ? priceFrom : null,
      currency: "USD",
      deposit_percentage: depositPct,
      nights: typeof deliveryDays === "number" ? deliveryDays : null,
      inclusions: inclusions.length > 0 ? inclusions : null,
      valid_until: validUntil.toISOString(),
      status: "sent",
      ...(proposerRole === "agent" ? { agent_id: user.id } : { creator_id: user.id }),
    };

    const { data: insertedData, error } = await supabase.from("trip_proposals").insert(payload).select("id").single();
    setSubmitting(false);

    if (error || !insertedData) {
      console.error("Proposal submit error", error);
      toast.error("Failed to submit proposal. Please try again.");
      return;
    }

    // Fire notification to traveler (non-blocking)
    supabase.functions.invoke("notify-trip-proposal", {
      body: { tripRequestId: tripId },
    }).catch((err) => console.error("Notification error:", err));

    toast.success("Proposal submitted successfully!");
    navigate(`/proposals/${insertedData.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading trip details…</div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Trip request not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
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
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1 w-full rounded-full transition-colors ${i <= step ? "bg-[#0c4d47]" : "bg-muted"}`} />
                <span className={`text-[10px] font-medium ${i <= step ? "text-[#0c4d47]" : "text-muted-foreground"}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
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
                      className="min-h-[200px]"
                    />
                    <p className="text-xs text-muted-foreground text-right">{message.length} characters</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 1: Pricing */}
            {step === 1 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Pricing</h2>
                    <p className="text-sm text-muted-foreground mt-1">Set your price, deposit, and delivery timelines.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Total Trip Price (per person)</Label>
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

                  <div className="space-y-3">
                    <Label>Deposit Percentage: {depositPct}%</Label>
                    <Slider
                      value={[depositPct]}
                      onValueChange={([v]) => setDepositPct(v)}
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    {typeof priceFrom === "number" && priceFrom > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Deposit: ${Math.round(priceFrom * depositPct / 100).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery">Deliver Itinerary (days)</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="delivery"
                          type="number"
                          min={1}
                          className="pl-9"
                          value={deliveryDays}
                          onChange={(e) => setDeliveryDays(e.target.value ? Number(e.target.value) : "")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking">Confirm Bookings (days)</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="booking"
                          type="number"
                          min={1}
                          className="pl-9"
                          value={bookingDays}
                          onChange={(e) => setBookingDays(e.target.value ? Number(e.target.value) : "")}
                        />
                      </div>
                    </div>
                  </div>

                  {estimatedEarnings > 0 && (
                    <div className="rounded-lg bg-[#0c4d47]/5 border border-[#0c4d47]/20 p-4">
                      <p className="text-sm font-medium text-[#0c4d47]">
                        Estimated Earnings: ${estimatedEarnings.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">After 15% platform fee</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* STEP 2: Deliverables */}
            {step === 2 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Deliverables</h2>
                    <p className="text-sm text-muted-foreground mt-1">Select what's included in your proposal.</p>
                  </div>

                  <div className="space-y-4">
                    {DELIVERABLES.map((d) => (
                      <div key={d.key} className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30">
                        <Checkbox
                          id={d.key}
                          checked={!!selectedDeliverables[d.key]}
                          onCheckedChange={(checked) =>
                            setSelectedDeliverables((prev) => ({ ...prev, [d.key]: !!checked }))
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={d.key} className="cursor-pointer font-medium">{d.label}</Label>
                          {selectedDeliverables[d.key] && (
                            <Input
                              placeholder="Add a note (optional)"
                              value={deliverableNotes[d.key] || ""}
                              onChange={(e) =>
                                setDeliverableNotes((prev) => ({ ...prev, [d.key]: e.target.value }))
                              }
                              className="text-sm"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 3: Review */}
            {step === 3 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Review & Submit</h2>
                    <p className="text-sm text-muted-foreground mt-1">Verify everything looks good before submitting.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg border p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pitch</h3>
                      <p className="font-semibold">{headline}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message}</p>
                      <span className="inline-block text-xs bg-muted rounded-full px-2 py-0.5 capitalize">{proposerRole}</span>
                    </div>

                    <div className="rounded-lg border p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pricing</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Total Price</span>
                        <span className="font-medium">${typeof priceFrom === "number" ? priceFrom.toLocaleString() : "—"}</span>
                        <span className="text-muted-foreground">Deposit</span>
                        <span className="font-medium">{depositPct}%{typeof priceFrom === "number" ? ` ($${Math.round(priceFrom * depositPct / 100).toLocaleString()})` : ""}</span>
                        <span className="text-muted-foreground">Itinerary Delivery</span>
                        <span className="font-medium">{deliveryDays || "—"} days</span>
                        <span className="text-muted-foreground">Booking Confirmation</span>
                        <span className="font-medium">{bookingDays || "—"} days</span>
                      </div>
                    </div>

                    {Object.values(selectedDeliverables).some(Boolean) && (
                      <div className="rounded-lg border p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Deliverables</h3>
                        <ul className="space-y-1">
                          {DELIVERABLES.filter((d) => selectedDeliverables[d.key]).map((d) => (
                            <li key={d.key} className="text-sm flex items-start gap-2">
                              <span className="text-[#0c4d47] mt-0.5">✓</span>
                              <span>{d.label}{deliverableNotes[d.key] ? ` — ${deliverableNotes[d.key]}` : ""}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Competitive context sidebar */}
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

            <div className="rounded-lg border border-[#0c4d47]/20 bg-[#0c4d47]/5 p-4 text-center">
              <p className="text-xs font-semibold text-[#0c4d47] uppercase tracking-wider">You are bidding on this trip</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <footer className="sticky bottom-0 border-t bg-white/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          {step < 3 ? (
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
