import logomark from "@/assets/logomark-gold.webp";

// ============================================================================
// GoldsainteEquation — the three-sided marketplace stated once, in one
// diagram: Creators, Travelers, and Travel agents as three blending circles
// with the Goldsainte mark at their intersection. Structure follows the
// approved preview 1:1; palette, type, and logo are the house system.
// Copy is deliberately one line per side — this section replaces the
// repeated storefront pitches with a single statement.
// ============================================================================

const inter = { fontFamily: "Inter, sans-serif" } as const;

const SIDES = [
  {
    key: "creators",
    name: "Creators",
    dot: "#C7A962",
    body: "A storefront under your own name — travel guides, on-trip services, and tips from the travelers you inspire. Paid directly.",
  },
  {
    key: "travelers",
    name: "Travelers",
    dot: "#4a7c76",
    body: "Trips designed by real experts who compete for your brief — with someone to message from first idea to home again.",
  },
  {
    key: "agents",
    name: "Travel agents",
    dot: "#8D6B2F",
    body: "Matched trip requests, winning proposals, and clients for life. You are the seller of record, paid directly.",
  },
] as const;

function SideCard({ side, className = "", style }: { side: (typeof SIDES)[number]; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-[14px] border border-[#E5DFC6]/55 bg-[#fffdf8] p-6 shadow-[0_22px_55px_-24px_rgba(10,34,37,0.32)] ${className}`}
      style={style}
    >
      <h4 className="flex items-center gap-2.5 text-[16px] font-semibold text-[#0a2225]" style={inter}>
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-[3px]" style={{ backgroundColor: side.dot }} />
        {side.name}
      </h4>
      <p className="mt-2 text-[15px] leading-relaxed text-[#0a2225]/60" style={inter}>
        {side.body}
      </p>
    </div>
  );
}

const CIRCLE = (bg: string): React.CSSProperties => ({
  position: "absolute",
  width: 430,
  height: 430,
  borderRadius: "50%",
  mixBlendMode: "multiply",
  background: bg,
});

export function GoldsainteEquation() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(90% 70% at 78% 30%, rgba(199,169,98,0.10), transparent 60%), #f7f3ea",
      }}
    >
      {/* ── Desktop: absolute composition, Fora-structure geometry ── */}
      <div className="relative mx-auto hidden min-h-[820px] max-w-[1240px] lg:block">
        <div className="absolute left-[7%] top-1/2 max-w-[430px] -translate-y-[58%]">
          <h2 className="font-secondary text-[44px] font-medium leading-[1.15] text-[#0a2225]">
            The Goldsainte equation
          </h2>
          <p className="mt-5 max-w-[400px] text-[16.5px] leading-[1.7] text-[#0a2225]/65" style={inter}>
            Creators and agents build real businesses. Travelers get trips no
            search bar could plan. Everyone is paid — and treated — directly.
          </p>
        </div>

        <div className="absolute right-[4%] top-1/2 h-[740px] w-[760px] -translate-y-1/2">
          {/* The three circles — genuinely blending where they overlap */}
          <div
            style={{
              ...CIRCLE(
                "radial-gradient(circle at 45% 40%, rgba(199,169,98,0.60), rgba(199,169,98,0.42) 55%, rgba(199,169,98,0.34))"
              ),
              left: 165,
              top: 10,
            }}
          />
          <div
            style={{
              ...CIRCLE(
                "radial-gradient(circle at 42% 42%, rgba(74,124,118,0.52), rgba(74,124,118,0.36) 55%, rgba(74,124,118,0.28))"
              ),
              left: 12,
              top: 288,
            }}
          />
          <div
            style={{
              ...CIRCLE(
                "radial-gradient(circle at 55% 42%, rgba(141,107,47,0.50), rgba(141,107,47,0.34) 55%, rgba(141,107,47,0.26))"
              ),
              left: 318,
              top: 288,
            }}
          />

          {/* The Goldsainte mark at the three-way intersection */}
          <img
            src={logomark}
            alt="Goldsainte"
            loading="lazy"
            className="absolute h-[74px] w-[74px] object-contain drop-shadow-[0_6px_18px_rgba(10,34,37,0.25)]"
            style={{ left: 344, top: 350 }}
          />

          {/* Cards at the approved positions */}
          <SideCard side={SIDES[0]} className="absolute w-[308px]" style={{ left: 62, top: 36 }} />
          <SideCard side={SIDES[1]} className="absolute w-[308px]" style={{ left: -58, top: 472 }} />
          <SideCard side={SIDES[2]} className="absolute w-[308px]" style={{ right: -40, top: 492 }} />
        </div>
      </div>

      {/* ── Mobile / tablet: headline then stacked cards ── */}
      <div className="px-5 py-14 lg:hidden">
        <h2 className="font-secondary text-[30px] font-medium leading-[1.15] text-[#0a2225]">
          The Goldsainte equation
        </h2>
        <p className="mt-4 text-[15.5px] leading-[1.7] text-[#0a2225]/65" style={inter}>
          Creators and agents build real businesses. Travelers get trips no
          search bar could plan. Everyone is paid — and treated — directly.
        </p>
        <div className="mt-8 space-y-3.5">
          {SIDES.map((s) => (
            <SideCard key={s.key} side={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default GoldsainteEquation;
