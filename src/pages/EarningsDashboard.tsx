import { useNavigate } from "react-router-dom";

// INTERIM honest page. The previous version read earnings_ledger/payouts —
// the OLD bookings-era money system that the live escrow rails
// (trip_payouts, written by release-trip-deposit) never touch, so it showed
// $0.00 regardless of real earnings, plus a "request payout" button that
// inserted into a ledger nothing processes. Until the real aggregate is
// built on trip_payouts (board: post-launch), this page tells the truth:
// earnings live on each booking, and payouts are automatic.
export default function EarningsDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-20">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#8D6B2F]">
          Financial overview
        </p>
        <h1 className="mt-2 font-secondary text-[36px] leading-[1.05] text-[#0a2225] md:text-5xl">
          Earnings &amp; Payouts
        </h1>

        <div className="mt-10 rounded-[24px] border border-[#E5DFC6] bg-white p-8 md:p-10">
          <h2 className="font-secondary text-[22px] text-[#0a2225]">
            Your payouts are automatic
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#0a2225]/70">
            Goldsainte transfers funds to your connected Stripe account as each
            milestone releases — the deposit when your traveler confirms the
            reservations, the balance before departure, and the final amount
            when the trip completes. There's nothing to request and nothing to
            withdraw.
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#0a2225]/70">
            Every payout, receipt, and milestone is tracked on the booking it
            belongs to.
          </p>
          <button
            onClick={() => navigate("/partner-bookings")}
            className="mt-7 inline-flex items-center justify-center rounded-full bg-[#0c4d47] px-7 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
          >
            View my bookings &amp; payouts
          </button>
        </div>
      </div>
    </div>
  );
}
