import { useState } from "react";
import logomark from "@/assets/logomark-gold.webp";

// ============================================================================
// GoldsainteEquation — the three-sided marketplace stated once, in one
// diagram: Creators, Travelers, and Travel agents as three blending circles
// with the Goldsainte mark at their intersection. Structure follows the
// approved preview 1:1; palette, type, and logo are the house system.
// Copy is deliberately one line per side — this section replaces the
// repeated storefront pitches with a single statement.
// ============================================================================

const GRADS = {
  creators:
    "radial-gradient(circle at 45% 40%, rgba(199,169,98,0.60), rgba(199,169,98,0.42) 55%, rgba(199,169,98,0.34))",
  travelers:
    "radial-gradient(circle at 42% 42%, rgba(74,124,118,0.52), rgba(74,124,118,0.36) 55%, rgba(74,124,118,0.28))",
  agents:
    "radial-gradient(circle at 55% 42%, rgba(141,107,47,0.50), rgba(141,107,47,0.34) 55%, rgba(141,107,47,0.26))",
} as const;

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

function SideCard({
  side,
  active = true,
  onSelect,
  className = "",
  style,
}: {
  side: (typeof SIDES)[number];
  active?: boolean;
  onSelect?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      onMouseEnter={onSelect}
      onClick={onSelect}
      className={`rounded-[14px] border border-[#E5DFC6]/55 bg-[#fffdf8] px-5 py-[18px] shadow-[0_18px_44px_-22px_rgba(10,34,37,0.30)] transition-all duration-300 ${
        onSelect ? "cursor-pointer" : ""
      } ${active ? "opacity-100" : "opacity-55 hover:opacity-80"} ${className}`}
      style={style}
    >
      <h4 className="flex items-center gap-2.5 font-secondary text-[17px] text-[#0a2225]">
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-[3px]" style={{ backgroundColor: side.dot }} />
        {side.name}
      </h4>
      <p className="mt-1.5 text-sm leading-relaxed text-[#4a4a4a]">
        {side.body}
      </p>
    </div>
  );
}

const CIRCLE = (bg: string, size = 340): React.CSSProperties => ({
  position: "absolute",
  width: size,
  height: size,
  borderRadius: "50%",
  mixBlendMode: "multiply",
  background: bg,
});

export function GoldsainteEquation() {
  // Fora-style focus: one side is active — its circle rises to the top at
  // full strength while the other two circles and cards dim. Click any card
  // (or circle) to bring that side forward.
  const [active, setActive] = useState<(typeof SIDES)[number]["key"]>("creators");

  const circleState = (key: string): React.CSSProperties =>
    active === key
      ? { opacity: 1, zIndex: 2, filter: "saturate(1.08)", transform: "scale(1.07)" }
      : { opacity: 0.4, zIndex: 1, filter: "saturate(0.7)", transform: "scale(1)" };

  return (
    <section id="storefronts" className="scroll-mt-24 bg-[#f7f3ea] px-4 py-10 sm:px-6 md:py-14">
      {/* ── Desktop: framed panel containing the absolute composition ── */}
      <div
        className="relative mx-auto hidden min-h-[700px] max-w-[1240px] overflow-hidden rounded-[28px] border border-[#0a2225]/[0.08] lg:block"
        style={{
          background:
            "radial-gradient(90% 70% at 78% 30%, rgba(199,169,98,0.12), transparent 60%), #fbf8f1",
        }}
      >
        <div className="absolute left-[7%] top-1/2 max-w-[430px] -translate-y-[58%]">
          <h2 className="font-secondary text-[44px] font-medium leading-[1.15] text-[#0a2225]">
            Where travel comes together
          </h2>
          <p className="mt-5 max-w-[400px] text-sm leading-relaxed text-[#4a4a4a] md:text-base">
            Travelers get trips only people could plan. Creators turn expertise
            into income. Agents build businesses that last. Everyone is paid
            directly.
          </p>
        </div>

        <div className="absolute right-[6%] top-1/2 h-[540px] w-[620px] -translate-y-1/2">
          {/* The three circles — genuinely blending where they overlap */}
          <div
            onMouseEnter={() => setActive("creators")}
            onClick={() => setActive("creators")}
            className="cursor-pointer transition-all duration-500 ease-out"
            style={{
              ...circleState("creators"),
              ...CIRCLE(
                "radial-gradient(circle at 45% 40%, rgba(199,169,98,0.60), rgba(199,169,98,0.42) 55%, rgba(199,169,98,0.34))"
              ),
              left: 130,
              top: 0,
            }}
          />
          <div
            onMouseEnter={() => setActive("travelers")}
            onClick={() => setActive("travelers")}
            className="cursor-pointer transition-all duration-500 ease-out"
            style={{
              ...circleState("travelers"),
              ...CIRCLE(
                "radial-gradient(circle at 42% 42%, rgba(74,124,118,0.52), rgba(74,124,118,0.36) 55%, rgba(74,124,118,0.28))"
              ),
              left: 25,
              top: 182,
            }}
          />
          <div
            onMouseEnter={() => setActive("agents")}
            onClick={() => setActive("agents")}
            className="cursor-pointer transition-all duration-500 ease-out"
            style={{
              ...circleState("agents"),
              ...CIRCLE(
                "radial-gradient(circle at 55% 42%, rgba(141,107,47,0.50), rgba(141,107,47,0.34) 55%, rgba(141,107,47,0.26))"
              ),
              left: 235,
              top: 182,
            }}
          />

          {/* The Goldsainte mark at the three-way intersection */}
          <img
            src={logomark}
            alt="Goldsainte"
            loading="lazy"
            className="absolute z-[3] h-[58px] w-[58px] object-contain drop-shadow-[0_4px_12px_rgba(10,34,37,0.28)]"
            style={{ left: 271, top: 262, filter: "brightness(0) invert(1)", opacity: 0.96 }}
          />

          {/* Cards at the approved positions */}
          <SideCard side={SIDES[0]} active={active === "creators"} onSelect={() => setActive("creators")} className="absolute z-[4] w-[290px]" style={{ left: 84, top: 22 }} />
          <SideCard side={SIDES[1]} active={active === "travelers"} onSelect={() => setActive("travelers")} className="absolute z-[4] w-[290px]" style={{ left: -12, top: 356 }} />
          <SideCard side={SIDES[2]} active={active === "agents"} onSelect={() => setActive("agents")} className="absolute z-[4] w-[290px]" style={{ right: -8, top: 372 }} />
        </div>
      </div>

      {/* ── Mobile / tablet: headline above; panel holds the centered venn
          with the three cards stacked cleanly beneath it (the reference's
          mobile arrangement). ── */}
      <div className="lg:hidden">
        <h2 className="font-secondary text-[30px] font-medium leading-[1.15] text-[#0a2225]">
          Where travel comes together
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[#4a4a4a] md:text-base">
          Travelers get trips only people could plan. Creators turn expertise
          into income. Agents build businesses that last. Everyone is paid
          directly.
        </p>

        <div
          className="relative mt-7 overflow-hidden rounded-[24px] border border-[#0a2225]/[0.08] px-4 pb-5 pt-9"
          style={{
            background:
              "radial-gradient(120% 60% at 50% 0%, rgba(199,169,98,0.12), transparent 60%), #fbf8f1",
          }}
        >
          {/* the venn, centered */}
          <div className="relative mx-auto h-[330px] w-[310px]">
            <div
              onClick={() => setActive("creators")}
              className="cursor-pointer transition-all duration-500 ease-out"
              style={{ ...circleState("creators"), ...CIRCLE(GRADS.creators, 200), left: 55, top: 0 }}
            />
            <div
              onClick={() => setActive("travelers")}
              className="cursor-pointer transition-all duration-500 ease-out"
              style={{ ...circleState("travelers"), ...CIRCLE(GRADS.travelers, 200), left: 0, top: 128 }}
            />
            <div
              onClick={() => setActive("agents")}
              className="cursor-pointer transition-all duration-500 ease-out"
              style={{ ...circleState("agents"), ...CIRCLE(GRADS.agents, 200), left: 110, top: 128 }}
            />
            <img
              src={logomark}
              alt="Goldsainte"
              loading="lazy"
              className="absolute z-[3] h-[42px] w-[42px] object-contain drop-shadow-[0_4px_12px_rgba(10,34,37,0.28)]"
              style={{ left: 134, top: 164, filter: "brightness(0) invert(1)", opacity: 0.96 }}
            />
          </div>

          {/* the three cards, stacked full-width beneath the diagram */}
          <div className="mt-6 space-y-3">
            {SIDES.map((side) => (
              <SideCard key={side.key} side={side} active />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default GoldsainteEquation;
