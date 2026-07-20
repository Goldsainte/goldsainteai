// Trust & safety as engraved stationery: one framed plaque (double hairline
// gold border), four typographic pillars, no icons. Every claim below is
// already made elsewhere on the site (Trust & Safety page) — this is the
// homepage distillation, not new promises.
import { Link } from "react-router-dom";

const inter = { fontFamily: "Inter, sans-serif" } as const;

const columns = [
  {
    eyebrow: "Curation",
    title: "Reviewed before it goes live",
    body: "Every trip, guide, and profile is reviewed by the Goldsainte team before it reaches the marketplace. Nothing goes live unseen.",
  },
  {
    eyebrow: "Identity",
    title: "Verified, every account",
    body: "Travelers, creators, and travel agents complete Stripe Identity verification before they can transact. No exceptions.",
  },
  {
    eyebrow: "Payments",
    title: "Secured by Stripe",
    body: "Checkout runs on Stripe and pays your travel agent directly \u2014 they\u2019re your seller of record. Card details never touch our servers.",
  },
  {
    eyebrow: "Support",
    title: "With you to boarding",
    body: "One thread with your specialist from booking to boarding \u2014 and Goldsainte support behind every trip.",
  },
];

// Divider logic: 1-col stacks (top borders), 2-col grid on md (left border on
// odd items, top border on the second row), 4-col row on lg (left borders only).
function dividers(i: number): string {
  const parts: string[] = [];
  if (i > 0) parts.push("border-t border-[#C7A962]/35");
  if (i % 2 === 1) parts.push("md:border-l");
  if (i >= 2) parts.push("md:border-t");
  else parts.push("md:border-t-0");
  if (i > 0) parts.push("lg:border-l");
  parts.push("lg:border-t-0");
  return parts.join(" ");
}

export function TrustPlaque() {
  return (
    <section className="border-t border-[#E5DFC6] bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span
          className="text-[12px] font-medium uppercase tracking-[0.2em] text-[#8a7136]"
          style={inter}
        >
          Trust &amp; safety
        </span>
        <span aria-hidden="true" className="mx-auto mt-3.5 block h-px w-12 bg-[#C7A962]" />
        <h2 className="mt-5 font-secondary text-[26px] text-[#0a2225] md:text-[34px]">
          Built to be trusted with your trip
        </h2>
        <p className="mx-auto mt-3 mb-10 max-w-xl text-[15px] leading-relaxed text-[#4a4a4a] md:mb-12">
          Four commitments behind every booking &mdash; reviewed, verified, secured, and
          supported, start to finish.
        </p>

        <div className="relative rounded-[4px] border border-[#C7A962] bg-[#FDF9F0] p-8 md:px-10 md:py-12 lg:py-[52px]">
          {/* inner hairline — engraved-stationery detail */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[7px] rounded-[2px] border border-[#C7A962]/40"
          />
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {columns.map((c, i) => (
              <div key={c.eyebrow} className={`px-1 py-6 text-left md:px-7 md:py-5 lg:py-0 ${dividers(i)}`}>
                <p
                  className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8a7136]"
                  style={inter}
                >
                  {c.eyebrow}
                </p>
                <span aria-hidden="true" className="mt-2 block h-px w-[30px] bg-[#C7A962]" />
                <h3 className="mt-3.5 mb-2 font-secondary text-[19px] text-[#0a2225] md:text-[20px]">
                  {c.title}
                </h3>
                <p className="text-[14.5px] leading-relaxed text-[#4a4a4a]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-7 text-[13px] text-[#7A7151]" style={inter}>
          Read the full standards on our{" "}
          <Link
            to="/trust-safety"
            className="text-[#0C4D47] underline decoration-[#C7A962]/60 underline-offset-4 transition-colors hover:text-[#0a2225]"
          >
            Trust &amp; Safety page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
