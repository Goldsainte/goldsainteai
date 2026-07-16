// Trust-facts strip. Replaces the pre-launch stats ("50+ Countries /
// Launching Summer 2026") with claims Goldsainte can stand behind from
// day one. Layout and rhythm intentionally identical to the old strip.
export function StatsStrip() {
  const facts = [
    { value: "Escrow-protected", label: "Every dollar held until you travel" },
    { value: "Secured by Stripe", label: "Payments & payouts" },
    { value: "Team-reviewed", label: "Every listing, before it goes live" },
  ];

  return (
    <section className="bg-[#f7f3ea] border-y border-[#E5DFC6]">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 text-center">
          {facts.map((f, i) => (
            <div
              key={f.value}
              className={`flex flex-col items-center justify-center px-6 ${
                i > 0 ? "md:border-l md:border-[#C7A962]/40" : ""
              }`}
            >
              <span className="font-secondary text-xl md:text-[26px] text-[#0c4d47] leading-none">
                {f.value}
              </span>
              <span className="mt-3 text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-[#0a2225]/70" style={{ fontFamily: "Inter, sans-serif" }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
