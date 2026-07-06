// Trust & safety as engraved stationery: one framed plaque (double hairline
// gold border), three typographic columns, no icons.
const inter = { fontFamily: "Inter, sans-serif" } as const;

const columns = [
  {
    eyebrow: "Curation",
    title: "Reviewed before live",
    body: "Every listing is reviewed by the Goldsainte team before it appears in the marketplace.",
  },
  {
    eyebrow: "Payments",
    title: "Held by Stripe",
    body: "Checkout and payouts run on Stripe. Your card details never touch our servers.",
  },
  {
    eyebrow: "Support",
    title: "Never plan alone",
    body: "Message your specialist directly from booking to boarding — one thread, one place.",
  },
];

export function TrustPlaque() {
  return (
    <section className="border-t border-[#E5DFC6] bg-white py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7136]" style={inter}>
          Trust &amp; safety
        </span>
        <span aria-hidden="true" className="mx-auto mt-3.5 block h-px w-12 bg-[#C7A962]" />
        <h2 className="mt-5 mb-10 font-secondary text-[26px] md:text-[32px] text-[#0a2225]">
          Built to be trusted with your trip
        </h2>

        <div className="relative rounded-[4px] border border-[#C7A962] bg-[#FDF9F0] p-8 md:px-11 md:py-[52px]">
          {/* inner hairline — engraved-stationery detail */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-[7px] rounded-[2px] border border-[#C7A962]/40" />
          <div className="relative grid grid-cols-1 md:grid-cols-3">
            {columns.map((c, i) => (
              <div
                key={c.eyebrow}
                className={`px-1 py-5 text-left md:px-8 md:py-0 ${
                  i > 0
                    ? "border-t border-[#C7A962]/35 md:border-t-0 md:border-l"
                    : "md:pl-1"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8a7136]" style={inter}>
                  {c.eyebrow}
                </p>
                <span aria-hidden="true" className="mt-2 block h-px w-[30px] bg-[#C7A962]" />
                <h3 className="mt-3.5 mb-2 font-secondary text-[19px] md:text-[21px] text-[#0a2225]">{c.title}</h3>
                <p className="text-[14.5px] md:text-[15px] leading-relaxed text-[#4a4a4a]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
