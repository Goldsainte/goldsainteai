import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";

// ============================================================================
// AgentHandbookPage — "How Goldsainte works for specialists" (Jul 16).
// Mirrors the creator handbook's tutorial style, agent-flavored.
// Route: /agent-handbook, linked from Agent Settings.
// ============================================================================

const P = "mt-3 leading-relaxed text-[#0a2225]/85";

function Path({ steps }: { steps: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      <span className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#8D6B2F]">Find it:</span>
      {steps.map((s, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="rounded-full border border-[#C7B892]/60 bg-white px-3 py-1 text-[12px] text-[#0a2225]">{s}</span>
          {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-[#C7A962]" />}
        </span>
      ))}
    </div>
  );
}

function Flow() {
  const steps: [string, string][] = [
    ["Trip request", "Travelers find you, or post trips you can bid on"],
    ["Your proposal", "You design the itinerary and quote your price"],
    ["Direct pay", "They pay you — straight to your Stripe account at booking"],
    ["You're paid", "Deposit as working capital, balance on completion"],
  ];
  return (
    <div className="mt-8 grid gap-4 rounded-3xl bg-[#0c4d47]/[0.06] p-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-start">
      {steps.map(([t, d], i) => (
        <div key={t} className="contents">
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0c4d47] font-secondary text-lg text-[#E5DFC6]">
              {i + 1}
            </span>
            <p className="mt-2 text-[14px] font-semibold text-[#0a2225]">{t}</p>
            <p className="mt-1 text-[12px] leading-snug text-[#0a2225]/65">{d}</p>
          </div>
          {i < steps.length - 1 && <ArrowRight className="mt-3 hidden h-5 w-5 shrink-0 text-[#C7A962] sm:block" />}
        </div>
      ))}
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
      <p className="font-secondary text-[15px] tracking-[0.28em] text-[#8D6B2F]">
        {String(n).padStart(2, "0")}
      </p>
      <h2 className="mt-2 font-secondary text-2xl text-[#0a2225]">{title}</h2>
      {children}
    </section>
  );
}

export default function AgentHandbookPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-24">
      <Helmet><title>Specialist Handbook · Goldsainte</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 pt-14">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8D6B2F]">Specialist handbook</p>
        <h1 className="mt-3 font-secondary text-[34px] leading-tight text-[#0a2225] md:text-5xl">How Goldsainte works for you</h1>
        <p className="mt-5 text-[18px] leading-relaxed text-[#0a2225]/80">
          You design extraordinary trips — Goldsainte brings you the travelers, holds the money
          safely, and pays you in milestones. The whole machine, in five minutes.
        </p>

        <Flow />
        <p className="mt-3 text-center text-[13px] text-[#0a2225]/60">
          Goldsainte's fee is a flat 3.5% of your quoted price (travelers pay their own 3.5% on top),
          collected automatically. You're the merchant of record: deposits and balances are charged
          directly on your own Stripe account the moment your traveler pays, and settle to your bank
          on your Stripe payout schedule. Standard card processing applies.
        </p>

        <Section n={1} title="Your profile — the magazine">
          <p className={P}>
            Your public page reads like a feature story: your business as the headline, your story and
            travel style, reviews with real trip context, and your guides. Every element is edited in
            one hub — and complete profiles rank higher in the specialists directory.
          </p>
          <Path steps={["Avatar menu", "Account Settings"]} />
        </Section>

        <Section n={2} title="Travel guides — expertise on display">
          <p className={P}>
            Editorial destination guides with an AI writer trained on <strong>your</strong> travel
            style — real places, real photos (swap in your own), a hotel carousel with your
            recommendations. Guides carry live view counts and ring your bell at milestones. They're
            how travelers decide you're the one.
          </p>
          <Path steps={["Account Settings", "Travel guides", "New guide", "Write it with AI"]} />
        </Section>

        <Section n={3} title="Trips & tours">
          <p className={P}>
            Your published marketplace packages appear on your profile under <strong>My trips &
            tours</strong> — bookable, paid direct to you. Build them from your dashboard; they double as
            proof of work for every traveler who lands on your page.
          </p>
        </Section>

        <Section n={4} title="Proposals & messages">
          <p className={P}>
            Trip requests land in your pipeline; you respond with proposals. Conversations stay in
            your Goldsainte inbox — on-platform is what keeps payment records, disputes, and support protections real, for you and
            the traveler.
          </p>
        </Section>

        <Section n={5} title="The rhythm">
          <p className={P}>
            Keep your profile complete, publish a guide when you have a destination worth an opinion,
            respond to requests fast, and share confirmed reservations promptly — that's what releases
            your deposit. Reviews compound from there.
          </p>
        </Section>

        <div className="mt-12 rounded-3xl bg-[#0c4d47]/[0.06] p-8 text-center">
          <p className="font-secondary text-2xl text-[#0a2225]">Ready?</p>
          <button type="button" onClick={() => navigate("/agent-settings")}
            className="mt-5 rounded-full bg-[#0c4d47] px-9 py-4 text-[15px] font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225]">
            Open your Agent Settings
          </button>
        </div>
      </div>
    </div>
  );
}
