/* SpecialistsFoundingPage (31 Jul) — the velvet rope. Shown at /agents while
 * the specialist cohort is below FOUNDING_COHORT_THRESHOLD (see
 * AgentsDirectoryPage): instead of a directory grid with one test card
 * telling every prospective agent the platform is empty, the emptiness is
 * repositioned as curation and pointed at the application. The real grid
 * returns automatically the day the threshold is crossed.
 * Every claim on this page is true per product law: application-gated,
 * Stripe-Identity-verified, human-reviewed, agent as merchant of record at a
 * flat 3.5% platform fee. Approved from DRAFT_specialists_page.html. */
import { Link } from "react-router-dom";
import horizontalLogo from "@/assets/primary-horizontal-logo-green.svg";

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">{children}</p>
);

const NumRow = ({ n, children }: { n: string; children: React.ReactNode }) => (
  <div className="mt-7 flex gap-5">
    <span className="w-7 shrink-0 font-secondary text-[19px] italic text-[#8D6B2F]">{n}</span>
    <p className="text-[16px] leading-relaxed text-[#0a2225]/80">{children}</p>
  </div>
);

export default function SpecialistsFoundingPage() {
  return (
    <div className="flex-1 bg-[#FDF9F0] text-[#0a2225]">
      <div className="mx-auto w-full max-w-6xl px-5 pb-28 pt-20 md:pt-24">
        <Kicker>Specialists</Kicker>
        <h1 className="mt-4 font-secondary text-[44px] leading-[1.05] md:text-[62px]">
          Chosen, not listed.
        </h1>
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-[#0a2225]/55">
          Every specialist on Goldsainte joins by application — identity verified,
          credentials and insurance reviewed by our team before a single trip is
          sold. The founding cohort is being assembled now.
        </p>

        <hr className="my-16 border-0 border-t border-[#0a2225]/10" />

        <div className="grid grid-cols-1 gap-x-20 gap-y-16 md:grid-cols-2">
          <div>
            <Kicker>What a Goldsainte specialist does</Kicker>
            <NumRow n="i.">
              <strong className="font-medium text-[#0a2225]">Answers real briefs.</strong>{" "}
              Travelers post the journeys they want; specialists reply with tailored
              proposals — itinerary, price, and timeline.
            </NumRow>
            <NumRow n="ii.">
              <strong className="font-medium text-[#0a2225]">Publishes their own trips.</strong>{" "}
              Package the journeys you know by heart and list them under your name,
              at your price, bookable directly.
            </NumRow>
            <NumRow n="iii.">
              <strong className="font-medium text-[#0a2225]">Gets paid directly.</strong>{" "}
              Every payment is charged on your own Stripe account — you are the
              merchant of record.
            </NumRow>
          </div>
          <div>
            <Kicker>How the founding cohort is chosen</Kicker>
            <NumRow n="i.">A ten-minute application — your business, credentials, insurance, and expertise.</NumRow>
            <NumRow n="ii.">Identity verification through Stripe, in about two minutes.</NumRow>
            <NumRow n="iii.">Human review, with a decision emailed within one to two business days.</NumRow>
          </div>
        </div>

        {/* Fee flourish — the house "7%" device from the agent dashboard,
            filling the right column at width. 3.5% is the agent-side platform
            fee per product law. */}
        <hr className="my-16 border-0 border-t border-[#0a2225]/10" />
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_auto]">
          <p className="max-w-xl text-[16px] leading-relaxed text-[#0a2225]/80">
            You set your price — your costs and your margin are yours to build in.
            Goldsainte's platform fee is a flat 3.5% on what you sell, charged at
            booking. Everything else is yours, paid straight to your own Stripe
            account.
          </p>
          <div className="md:text-right">
            <p className="font-secondary text-[72px] leading-none text-[#0a2225] md:text-[88px]">3.5%</p>
            <p className="mt-2 text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">Flat · Your only fee</p>
          </div>
        </div>

        <div className="mt-20">
          <p className="max-w-2xl font-secondary text-[24px] leading-snug md:text-[26px]">
            The travelers are arriving. The cohort is small on purpose. If you
            sell travel with real expertise, this is the moment to be early.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              to="/apply/agent"
              className="rounded-full bg-[#0c4d47] px-9 py-3.5 text-[15px] text-[#E5DFC6] transition-colors hover:bg-[#073331]"
            >
              Apply to join
            </Link>
            <Link
              to="/marketplace"
              className="text-[15px] text-[#0c4d47] underline underline-offset-4"
            >
              Browse the trips travelers are booking →
            </Link>
          </div>
        </div>

        <p className="mt-16 max-w-xl text-[13px] leading-relaxed text-[#0a2225]/45">
          Already applied?{" "}
          <Link to="/application/status" className="underline underline-offset-2">
            Sign in any time to check your application status.
          </Link>{" "}
          Questions about becoming a specialist —{" "}
          <a href="mailto:support@goldsainte.com" className="underline underline-offset-2">
            support@goldsainte.com
          </a>.
        </p>

        {/* Colophon — the quiet signature. The global header already carries
            the wordmark, so the mark lives once more at the foot, small. */}
        <hr className="mb-10 mt-16 border-0 border-t border-[#0a2225]/10" />
        <img
          src={horizontalLogo}
          alt="Goldsainte"
          className="h-6 w-auto opacity-80 md:h-7"
        />
      </div>
    </div>
  );
}
