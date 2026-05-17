export function CurrenciesAndPayouts() {
  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 mt-12">
      <h3 className="font-secondary text-2xl text-[#0a2225] mb-3">Currencies and payouts</h3>
      <p className="text-sm text-[#6B7280] leading-relaxed mb-3">
        Travelers see prices in USD by default. As a specialist, you can list in any major currency — your local payout currency is configured when you connect Stripe.
      </p>
      <p className="text-sm text-[#6B7280] leading-relaxed mb-3">
        Stripe handles automatic FX conversion at competitive rates if you accept payments in a currency different from your payout currency. A 1% FX fee applies on cross-currency settlements (this is Stripe's fee, not Goldsainte's).
      </p>
      <p className="text-sm text-[#6B7280] leading-relaxed">
        Payouts arrive in your linked bank account on a rolling 2-day basis after each booking milestone clears. Your country's tax documents are issued annually by Stripe.
      </p>
    </section>
  );
}