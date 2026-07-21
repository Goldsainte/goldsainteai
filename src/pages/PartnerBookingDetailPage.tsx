import { useEffect, useState } from "react";
import { getTripRequestImageUrl } from "@/utils/tripImages";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContractStatusCard } from "@/components/contracts/ContractStatusCard";
import { toast } from "sonner";
import { ChevronLeft, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import {
  buildDeliverables,
  deliverablesHeading,
  buildJourneyCopy,
  DELIVERABLES_FALLBACK,
} from "@/lib/bookingDeliverables";

type BookingRow = {
  id: string;
  status: string;
  partner_role: string | null;
  traveler_id: string;
  partner_id: string;
  total_price: number | null;
  deposit_amount: number | null;
  partner_payout: number | null;
  currency: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
  trip_requests: {
    id: string;
    title: string | null;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    travelers_adults: number | null;
    travelers_children: number | null;
  } | null;
};

export default function PartnerBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [isHireBooking, setIsHireBooking] = useState(false);
  const [travelerName, setTravelerName] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hireCapabilities, setHireCapabilities] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate(`/auth?returnTo=/booking/${id}`, { replace: true });
          return;
        }
        const { data, error } = await supabase
          .from("trip_bookings")
          .select(
            `
            id, status, partner_role, traveler_id, partner_id,
            total_price, proposal_id, deposit_amount, partner_payout, currency,
            created_at, metadata,
            trip_requests:trip_request_id (
              id, title, destination, start_date, end_date,
              travelers_adults, travelers_children
            )
          `
          )
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Booking not found.");

        // Partners only — travelers get their own page.
        if (data.partner_id !== user.id) {
          navigate(
            data.traveler_id === user.id ? `/bookings/${id}` : "/partner-bookings",
            { replace: true }
          );
          return;
        }
        if (!alive) return;
        setBooking(data as BookingRow);
        try {
          const pid = ((data as BookingRow) as any)?.proposal_id;
          if (pid) {
            const { data: pr } = await (supabase
              .from("trip_proposals")
              .select("price_breakdown, trip_request_id" as any)
              .eq("id", pid)
              .maybeSingle() as any);
            setIsHireBooking(Boolean((pr as any)?.price_breakdown?.hire));
            const reqId = (pr as any)?.trip_request_id;
            if (reqId) {
              const { data: req } = await (supabase
                .from("trip_requests")
                .select("source_metadata" as any)
                .eq("id", reqId)
                .maybeSingle() as any);
              const caps = (req as any)?.source_metadata?.hire_capabilities;
              if (Array.isArray(caps)) {
                setHireCapabilities(caps.filter((c: any) => typeof c === "string"));
              }
            }
          }
        } catch { /* hire detection is cosmetic */ }

        // Non-fatal enrichments
        const [{ data: prof }, coverRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name, full_name")
            .eq("id", data.traveler_id)
            .maybeSingle(),
          (data.metadata as any)?.trip_id
            ? supabase
                .from("packaged_trips")
                .select("cover_image_url")
                .eq("id", (data.metadata as any).trip_id)
                .maybeSingle()
            : Promise.resolve({ data: null } as any),
        ]);
        if (!alive) return;
        setTravelerName(prof?.display_name || prof?.full_name || null);
        setCover((coverRes.data as any)?.cover_image_url ?? null);
      } catch (e: any) {
        console.error("Booking load failed:", e);
        toast.error(e.message || "Couldn't load this booking.");
        navigate("/partner-bookings", { replace: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, navigate]);

  if (loading || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C7A962]" />
      </div>
    );
  }
  const trip = booking.trip_requests;
  const title =
    trip?.title ||
    (booking.metadata as any)?.trip_title ||
    trip?.destination ||
    "Goldsainte Trip";
  const clientName = travelerName || "your client";
  const clientFirst = clientName.split(/\s+/)[0];
  const initial = (travelerName || "T").trim().charAt(0).toUpperCase();
  const reference = `GS-${booking.id.slice(0, 8).toUpperCase()}`;
  const money = (v: number | null | undefined) =>
    v != null
      ? `$${(Number(v) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "—";
  const payoutValue =
    booking.partner_payout && booking.partner_payout > 0
      ? Number(booking.partner_payout) / 100
      : Math.round((Number(booking.total_price || 0) / 100) * 96.5) / 100;
  const payoutLabel =
    booking.partner_payout && booking.partner_payout > 0
      ? "Your payout"
      : "Est. payout (96.5%)";
  const balance = Math.max(
    0,
    Number(booking.total_price || 0) - Number(booking.deposit_amount || 0)
  );

  const depositPaid = ["confirmed", "paid_in_full", "completed"].includes(booking.status);
  const balancePaid = ["paid_in_full", "completed"].includes(booking.status);
  const tripComplete = booking.status === "completed";

  const heroImage = cover || (trip?.destination ? getTripRequestImageUrl(trip.destination) : null);

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
  const dates =
    trip?.start_date && trip?.end_date
      ? `${fmt(trip.start_date)} – ${fmt(trip.end_date)}`
      : fmt(trip?.start_date) || null;

  const humanStatus = tripComplete
    ? "Complete"
    : balancePaid
      ? "Paid in full"
      : depositPaid
        ? "Deposit secured"
        : booking.status.replace(/_/g, " ");

  // Progress %, partner-framed (their delivery arc, not money release).
  const engagementPct = tripComplete
    ? 100
    : balancePaid
      ? 80
      : depositPaid
        ? 50
        : 20;

  // Persona-aware step copy (photographer vs trip specialist vs …), keyed off
  // the same hire_capabilities the deliverables use. Lifecycle STATE is
  // computed here from booking status; wording comes from the shared table.
  const partnerJourney = buildJourneyCopy(hireCapabilities, "partner", clientFirst);

  type TL = { title: string; sub: string; state: "done" | "cur" | "next"; when?: string };
  const partnerStates: Array<{ state: TL["state"]; when?: string }> = [
    { state: depositPaid ? "done" : "cur" },
    { state: balancePaid ? "done" : depositPaid ? "cur" : "next" },
    { state: tripComplete ? "done" : balancePaid ? "cur" : "next" },
    {
      state: tripComplete ? "done" : balancePaid ? "cur" : "next",
      when: balancePaid && !tripComplete ? "You're here" : undefined,
    },
    { state: tripComplete ? "done" : "next" },
    { state: tripComplete ? "cur" : "next" },
  ];
  const timeline: TL[] = partnerJourney.steps.map((s, i) => ({
    title: s.title,
    sub: s.sub,
    state: partnerStates[i].state,
    when: partnerStates[i].when,
  }));
  const currentStep = timeline.find((t) => t.state === "cur") || timeline[0];

  const deliverables = buildDeliverables(hireCapabilities);
  const deliverablesHead = deliverablesHeading(hireCapabilities, clientFirst, "partner");

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-[860px] px-8 pt-8 pb-2">
        <button
          type="button"
          onClick={() => navigate("/partner-bookings")}
          className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.22em] text-[#0a2225]/50 transition-colors hover:text-[#0a2225]"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to bookings
        </button>
      </section>

      <article className="mx-auto max-w-[860px] px-8 pb-28 pt-2">
        {/* Minimal hero */}
        <div className="relative h-[96px] overflow-hidden rounded-2xl">
          {heroImage && (
            <img
              src={heroImage}
              alt={trip?.destination || title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#061418]/40 to-[#061418]/[0.03]" />
        </div>

        <div className="mt-10 text-center">
          <p className="text-[12px] uppercase tracking-[0.24em] text-[#8D6B2F]">
            Your engagement · {reference}
          </p>
          <h1 className="mt-3.5 font-secondary text-[30px] leading-[1.06] text-[#0a2225] md:text-4xl">
            {title}
          </h1>
          <p className="mt-3.5 text-[16px] text-[#0a2225]/60">
            For {clientName}
            {dates ? ` · ${dates}` : ""}
          </p>
          <span className="mt-5 inline-block rounded-full bg-[#0c4d47] px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#E5DFC6]">
            {humanStatus}
          </span>
        </div>

        <hr className="mx-auto mt-20 h-[2px] w-12 border-none bg-[#C7A962]" />

        {/* Engagement tracker */}
        <section className="mt-14">
          <div className="text-center">
            <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
              {partnerJourney.trackerEyebrow}
            </p>
            <div className="mt-6 font-secondary text-[36px] leading-none text-[#0a2225]">
              {engagementPct}%
            </div>
            <p className="mt-2 text-[13px] uppercase tracking-[0.16em] text-[#0a2225]/50">
              {partnerJourney.progressLabel}
            </p>
            <div className="mx-auto mt-6 h-1 w-[280px] overflow-hidden rounded-full bg-[#EDE6D3]">
              <div
                className="h-full rounded-full bg-[#C7A962] transition-[width] duration-1000"
                style={{ width: `${engagementPct}%` }}
              />
            </div>
          </div>

          <div className="relative mx-auto mt-14 max-w-[520px] pl-1">
            <div className="absolute bottom-2 left-[17px] top-2 w-[2px] bg-[#0a2225]/10" />
            {timeline.map((t, i) => (
              <div key={i} className="relative pb-8 pl-14 last:pb-0">
                <span
                  className={
                    "absolute left-[5px] top-0.5 flex h-[25px] w-[25px] items-center justify-center rounded-full text-[12px] " +
                    (t.state === "done"
                      ? "bg-[#0c4d47] text-[#E5DFC6]"
                      : t.state === "cur"
                        ? "border-2 border-[#C7A962] bg-white font-medium text-[#8D6B2F] shadow-[0_0_0_7px_rgba(199,169,98,0.14)]"
                        : "border border-[#0a2225]/20 bg-white text-[#0a2225]/40")
                  }
                >
                  {t.state === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <h3
                  className={
                    "font-secondary text-[19px] " +
                    (t.state === "next" ? "text-[#0a2225]/40" : "text-[#0a2225]")
                  }
                >
                  {t.title}
                </h3>
                <p className="mt-1 max-w-[400px] text-[15px] text-[#0a2225]/60">{t.sub}</p>
                {t.when && (
                  <p className="mt-1.5 text-[12px] uppercase tracking-[0.12em] text-[#0a2225]/40">
                    {t.when}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Happening now */}
          <div className="mx-auto mt-14 max-w-[520px] rounded-[20px] bg-white p-9 text-center shadow-[0_24px_64px_-40px_rgba(10,34,37,0.35)]">
            <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
              Your next step
            </p>
            <h3 className="mt-4 font-secondary text-[21px] text-[#0a2225]">{currentStep.title}.</h3>
            <p className="mx-auto mt-2 max-w-[420px] text-[15px] text-[#0a2225]/65">
              {currentStep.sub}
            </p>
          </div>

          {/* Client chip */}
          <div className="mx-auto mt-6 flex max-w-[520px] items-center justify-center gap-4">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#C7A962] text-[17px] font-medium text-[#0a2225]">
              {initial}
            </div>
            <div className="text-left">
              <small className="block text-[12px] uppercase tracking-[0.16em] text-[#0a2225]/50">
                Your client
              </small>
              <span className="font-secondary text-[20px] text-[#0a2225]">{clientName}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="mx-auto mt-6 flex max-w-[520px] flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/messages")}
              className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-7 py-3.5 text-[13px] font-medium text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
            >
              <MessageCircle className="h-4 w-4" />
              Message {clientFirst}
            </button>
          </div>
        </section>

        <hr className="mx-auto mt-20 h-[2px] w-12 border-none bg-[#C7A962]" />

        {/* Deliverables — what the partner is delivering */}
        <section className="mt-14">
          <div className="text-center">
            <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
              The engagement
            </p>
            <h2 className="mt-4 font-secondary text-[22px] text-[#0a2225]">{deliverablesHead}</h2>
          </div>
          <div className="mx-auto mt-6 max-w-[520px]">
            {deliverables ? (
              deliverables.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-[#0a2225]/10 py-5"
                >
                  <span className="font-secondary text-[18px] text-[#0a2225]">{d.label}</span>
                  <span
                    className={
                      "text-[12px] uppercase tracking-[0.14em] " +
                      (d.state === "active" ? "text-[#8D6B2F]" : "text-[#0a2225]/35")
                    }
                  >
                    {d.state === "active" ? "In progress" : "Upcoming"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-[15px] text-[#0a2225]/60">{DELIVERABLES_FALLBACK}.</p>
            )}
          </div>
        </section>

        {/* Payment — partner economics, direct-charge */}
        <section className="mt-20">
          <div className="text-center">
            <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">Payment</p>
          </div>
          <div className="mx-auto mt-6 max-w-[520px]">
            <div className="divide-y divide-[#0a2225]/[0.08]">
              <div className="flex items-baseline justify-between py-4">
                <span className="text-[15px] text-[#0a2225]/65">Trip total</span>
                <span className="font-secondary text-[19px] text-[#0a2225]">
                  {money(booking.total_price)}
                </span>
              </div>
              <div className="flex items-baseline justify-between py-4">
                <span className="text-[15px] text-[#0a2225]/65">Deposit</span>
                <span className="font-secondary text-[19px] text-[#0a2225]">
                  {money(booking.deposit_amount)}
                </span>
              </div>
              <div className="flex items-baseline justify-between py-4">
                <span className="text-[15px] text-[#0a2225]/65">Balance</span>
                <span className="font-secondary text-[19px] text-[#0a2225]">{money(balance)}</span>
              </div>
              <div className="flex items-baseline justify-between py-4">
                <span className="text-[15px] text-[#0a2225]/65">{payoutLabel}</span>
                <span className="font-secondary text-[22px] text-[#0c4d47]">
                  $
                  {payoutValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-[#0a2225]/50">
              You are the seller of record. Traveler payments are charged directly
              to your own Stripe account at checkout — deposit and balance alike —
              and you keep 96.5%. Goldsainte's flat 3.5% applies on each side.
            </p>
          </div>
        </section>

        {/* Contract */}
        {!isHireBooking && (
          <section className="mt-20">
            <div className="text-center">
              <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">Agreement</p>
              <h2 className="mt-4 font-secondary text-[22px] text-[#0a2225]">Trip contract</h2>
            </div>
            <div className="mx-auto mt-6 max-w-[520px]">
              <ContractStatusCard
                variant="agent"
                bookingId={booking.id}
                travelerId={booking.traveler_id}
                partnerRole={booking.partner_role ?? null}
                tripTitle={trip?.title || (booking.metadata as any)?.trip_title || null}
                destination={trip?.destination ?? null}
                startDate={trip?.start_date ?? null}
                endDate={trip?.end_date ?? null}
              />
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
