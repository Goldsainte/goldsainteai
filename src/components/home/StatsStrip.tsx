export function StatsStrip() {
  const stats = [
    { value: "50+", label: "Countries" },
    { value: "Launching", label: "Summer 2026" },
    { value: "Minutes", label: "To Your Itinerary" },
  ];

  return (
    <section className="bg-[#f7f3ea] border-y border-[#E5DFC6]">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 text-center">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center justify-center px-6 ${
                i > 0 ? "md:border-l md:border-[#C7A962]/40" : ""
              }`}
            >
              <span className="font-secondary text-2xl md:text-4xl text-[#0c4d47] leading-none">
                {s.value}
              </span>
              <span className="mt-3 text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-[#0a2225]/70">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}