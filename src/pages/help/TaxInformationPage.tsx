import { SimpleHelpArticle } from "./SimpleHelpArticle";

export default function TaxInformationPage() {
  return (
    <SimpleHelpArticle eyebrow="For Creators" title="Tax information">
      <p>
        Goldsainte processes payouts through Stripe Connect. Stripe issues annual tax documents to creators based on your country of residence and local thresholds (for example, 1099-K forms in the United States).
      </p>
      <p>
        Your tax forms appear in your Stripe Express dashboard each January for the previous calendar year. Keep your tax details up to date in Stripe — incorrect tax information can delay payouts.
      </p>
      <p>
        Goldsainte is not a tax advisor. We recommend consulting a local accountant about how marketplace earnings should be reported in your country.
      </p>
    </SimpleHelpArticle>
  );
}