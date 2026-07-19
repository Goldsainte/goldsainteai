import { SimpleHelpArticle } from "./SimpleHelpArticle";

export default function PaymentsAndFeesPage() {
  return (
    <SimpleHelpArticle eyebrow="Payments" title="Payments and fees">
      <p>
        Goldsainte charges a 7% platform fee on every booking: 3.5% is deducted from the specialist's earnings and 3.5% is added to the traveler's price. Stripe processing fees are billed separately at standard rates.
      </p>
      <p>
        All payments run through Goldsainte's secure Stripe checkout and are charged directly to your specialist — your seller of record. Travelers and specialists never exchange payment information directly.
      </p>
      <p>
        Travelers see prices in USD by default. Specialists can list in any major currency — Stripe handles automatic FX conversion at competitive rates, with a 1% fee on cross-currency settlements (Stripe's fee, not Goldsainte's).
      </p>
      <p>
        Payouts arrive in your linked bank account on a rolling 2-day basis after each milestone clears.
      </p>
    </SimpleHelpArticle>
  );
}
