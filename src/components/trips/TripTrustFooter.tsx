export function TripTrustFooter() {
  const trustPoints = [
    {
      title: "Identity Verified",
      description: "All hosts pass our verification process",
    },
    {
      title: "Secure Payments",
      description: "Paid securely to your specialist via Stripe",
    },
    {
      title: "24/7 Support",
      description: "Our team is here to help before, during, and after",
    },
    {
      title: "Clear Policies",
      description: "Transparent cancellation and refund terms",
    },
  ];

  return (
    <section className="mt-12 border-t border-[#E5DFC6] bg-[#FDF9F0] py-12">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C7A962]">
          Trust & Safety
        </p>
        <h3 className="mt-2 text-center font-secondary text-xl font-semibold text-[#0a2225]">
          Book with confidence
        </h3>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-[#E5DFC6] bg-white p-5 text-center shadow-sm"
            >
              <h4 className="font-secondary text-[15px] font-semibold text-[#0a2225]">
                {point.title}
              </h4>
              <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
