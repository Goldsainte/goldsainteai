import { SimpleHelpArticle } from "./SimpleHelpArticle";

export default function AgentRequirementsPage() {
  return (
    <SimpleHelpArticle eyebrow="For Agents" title="Tax and credentials requirements">
      <p>
        Agent credential and tax requirements vary by country. Most jurisdictions require some form of seller-of-travel registration, insurance, or professional accreditation (IATA, CLIA, ASTA, ABTA, etc.).
      </p>
      <p>
        At application time we ask for any credentials that apply to your country. If you operate from multiple jurisdictions, list the credentials that authorise you to sell in each.
      </p>
      <p>
        Tax documents are issued by Stripe based on your country of residence. Keep your Stripe Connect profile current to ensure timely payouts and accurate end-of-year forms. Goldsainte is not a tax advisor — consult a local accountant for filing guidance.
      </p>
    </SimpleHelpArticle>
  );
}