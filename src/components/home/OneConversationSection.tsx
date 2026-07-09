// Homepage differentiator section — the things big-tech travel doesn't do:
// negotiated-to-booked in chat, the contract gate, escrow-on-milestones,
// and on-platform protection. Traveler-framed, editorial style.
const POINTS = [
  {
    n: "01",
    title: "Tap to book. Right in the chat.",
    body:
      "Your specialist sends a proposal in your thread. One tap, deposit paid. No forms. No redirects.",
  },
  {
    n: "02",
    title: "Signed before a dollar moves.",
    body:
      "Real contracts, signed digitally in minutes. Payment stays locked until both parties sign.",
  },
  {
    n: "03",
    title: "Your money moves when work happens.",
    body:
      "Every payment is held in escrow and released to your specialist milestone by milestone. Never before.",
  },
  {
    n: "04",
    title: "Everything on the record.",
    body:
      "Messages, contracts, payments — one protected record. If anything goes off-plan, we step in with the full picture.",
  },
];

export function OneConversationSection() {
  return (
    <section className="bg-[#f7f3ea] border-t border-[#E5DFC6] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-[#8D6B2F]">
          Why Goldsainte
        </p>
        <h2 className="mt-3 max-w-xl font-secondary text-3xl leading-[1.08] text-[#0a2225] md:text-4xl">
          One thread. The whole trip.
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#0a2225]/60">
          Ask, negotiate, sign, and pay — without ever leaving your messages.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-9 sm:grid-cols-2">
          {POINTS.map((p) => (
            <div key={p.n}>
              <p className="font-secondary text-2xl text-[#c7a962]">{p.n}</p>
              <h3 className="mt-2 font-secondary text-xl text-[#0a2225]">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#0a2225]/65 md:text-[15px]">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 border-t border-[#0a2225]/10 pt-6 text-[15px] font-medium text-[#0a2225]">
          No other travel platform takes you from first message to fully
          booked — without leaving the chat.
        </p>
      </div>
    </section>
  );
}
