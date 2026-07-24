// Truth-only trust badges (Jul 24 2026): the previous version claimed
// "Thousands of Reviews", "handpicked Trip Operators", and a hardcoded
// 30,000-traveler count — none of which were true pre-launch. Every claim
// below is verifiable today.
export function TripTrustBadges() {
  const badges = [
    {
      title: "Payments by Stripe",
      description: "PCI Level 1 certified processing — your card details never touch our servers.",
    },
    {
      title: "Verified Professionals",
      description: "Every travel agent passes Stripe Identity verification — government ID checked — before they can sell.",
    },
    {
      title: "Flexible Payment Options",
      description: "Reserve your spot with just 25% down, pay in full, or apply for a payment plan at booking.",
    },
    {
      title: "Here When You Need Us",
      description: "Questions? We're just a tap away. Get support via Chat or our Help Center.",
    },
  ];

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-[#FDF9F0] p-6">
      {/* Header */}
      <div className="text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C7A962]">
          Book With Confidence
        </span>
        <p className="mt-2 font-secondary text-xl font-semibold text-[#0a2225]">
          Secure payments, verified professionals, real support.
        </p>
      </div>

      {/* Badges Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {badges.map((badge) => (
          <div
            key={badge.title}
            className="rounded-2xl border border-[#E5DFC6] bg-white p-5 text-center shadow-sm"
          >
            <h4 className="font-secondary text-[15px] font-semibold text-[#0a2225]">
              {badge.title}
            </h4>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
              {badge.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
