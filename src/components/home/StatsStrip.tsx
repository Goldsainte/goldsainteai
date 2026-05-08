export function StatsStrip() {
  const stats = [
    { value: "50+", label: "Countries" },
    { value: "500+", label: "Certified Travel Specialists" },
    { value: "Minutes", label: "Trips Planned in Minutes" },
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
              <span className="font-display text-3xl md:text-5xl text-[#0c4d47] leading-none">
                {s.value}
              </span>
              <span className="mt-3 text-[11px] md:text-xs uppercase tracking-[0.18em] text-[#0a2225]/70">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}