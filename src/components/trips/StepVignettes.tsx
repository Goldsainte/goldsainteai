/**
 * Pure CSS/SVG animated vignettes for the PostTrip intro screen.
 * Each vignette is ~80×60px and appears on hover with a scale+fade transition.
 */

/** 1. Destination — animated globe with pulsing pin */
export function DestinationVignette() {
  return (
    <div className="w-20 h-[60px] flex items-center justify-center">
      <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
        {/* Globe */}
        <circle cx="36" cy="30" r="18" stroke="#0c4d47" strokeWidth="1.5" opacity="0.3" />
        <ellipse cx="36" cy="30" rx="10" ry="18" stroke="#0c4d47" strokeWidth="1" opacity="0.25" />
        <line x1="18" y1="30" x2="54" y2="30" stroke="#0c4d47" strokeWidth="1" opacity="0.2" />
        <line x1="36" y1="12" x2="36" y2="48" stroke="#0c4d47" strokeWidth="1" opacity="0.2" />
        {/* Dotted arc path */}
        <path
          d="M 36 18 Q 56 14, 62 30"
          stroke="#C7A962"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          fill="none"
          opacity="0.6"
        >
          <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.5s" repeatCount="indefinite" />
        </path>
        {/* Pin */}
        <g>
          <circle cx="62" cy="30" r="5" fill="#C7A962" opacity="0.9">
            <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="62" cy="30" r="2" fill="#0c4d47" />
        </g>
      </svg>
    </div>
  );
}

/** 2. Travelers — overlapping avatar circles that slide in */
export function TravelersVignette() {
  const colors = ["#0c4d47", "#C7A962", "#6B7280"];
  return (
    <div className="w-20 h-[60px] flex items-center justify-center">
      <div className="flex -space-x-3">
        {colors.map((color, i) => (
          <div
            key={i}
            className="w-9 h-9 rounded-full border-2 border-[#f7f3ea] flex items-center justify-center"
            style={{
              backgroundColor: color,
              opacity: 0,
              animation: `slide-avatar 0.4s ease-out ${i * 120}ms forwards`,
            }}
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="#f7f3ea">
              <circle cx="10" cy="7" r="3.5" />
              <path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" />
            </svg>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slide-avatar {
          0% { opacity: 0; transform: translateX(12px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

/** 3. Style & Pace — color swatches fanning out */
export function StyleVignette() {
  const swatches = [
    { color: "#0c4d47", rotate: -12 },
    { color: "#C7A962", rotate: -4 },
    { color: "#6B7280", rotate: 4 },
    { color: "#E5DFC6", rotate: 12 },
  ];
  return (
    <div className="w-20 h-[60px] flex items-center justify-center">
      <div className="relative w-12 h-10">
        {swatches.map((s, i) => (
          <div
            key={i}
            className="absolute bottom-0 left-1/2 w-5 h-8 rounded-sm shadow-sm"
            style={{
              backgroundColor: s.color,
              transformOrigin: "bottom center",
              opacity: 0,
              animation: `fan-swatch 0.5s ease-out ${i * 80}ms forwards`,
              ['--rotate' as string]: `${s.rotate}deg`,
              marginLeft: "-10px",
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes fan-swatch {
          0% { opacity: 0; transform: rotate(0deg) scale(0.7); }
          100% { opacity: 1; transform: rotate(var(--rotate)) scale(1); }
        }
      `}</style>
    </div>
  );
}

/** 4. Storyboard — mini polaroid stack that shuffles */
export function StoryboardVignette() {
  const cards = [
    { rotate: -8, delay: 0 },
    { rotate: 3, delay: 100 },
    { rotate: -2, delay: 200 },
  ];
  return (
    <div className="w-20 h-[60px] flex items-center justify-center">
      <div className="relative w-12 h-12">
        {cards.map((c, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-sm bg-white shadow-md border border-[#E5DFC6]"
            style={{
              opacity: 0,
              animation: `polaroid-in 0.5s ease-out ${c.delay}ms forwards`,
              ['--rot' as string]: `${c.rotate}deg`,
            }}
          >
            <div className="m-1 mb-2.5 h-6 rounded-[1px] bg-gradient-to-br from-[#0c4d47]/20 to-[#C7A962]/30" />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes polaroid-in {
          0% { opacity: 0; transform: rotate(0deg) scale(0.6) translateY(8px); }
          100% { opacity: 1; transform: rotate(var(--rot)) scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/** 5. Pricing & Dates — mini calendar with price tag */
export function PricingVignette() {
  return (
    <div className="w-20 h-[60px] flex items-center justify-center">
      <div className="relative">
        {/* Mini calendar */}
        <div
          className="grid grid-cols-4 gap-[2px] p-1 rounded bg-white/80 shadow-sm border border-[#E5DFC6]"
          style={{ opacity: 0, animation: "fade-up 0.4s ease-out forwards" }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-[1px] ${i === 5 ? "bg-[#C7A962]" : "bg-[#0c4d47]/15"}`}
            />
          ))}
        </div>
        {/* Price tag */}
        <div
          className="absolute -top-1.5 -right-3 bg-[#C7A962] text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow"
          style={{ opacity: 0, animation: "fade-up 0.4s ease-out 300ms forwards" }}
        >
          $
        </div>
      </div>
    </div>
  );
}

/** 6. Review — miniature trip card that scales up */
export function ReviewVignette() {
  return (
    <div className="w-20 h-[60px] flex items-center justify-center">
      <div
        className="w-14 h-10 rounded-md bg-white shadow-md border border-[#E5DFC6] overflow-hidden"
        style={{ opacity: 0, animation: "card-scale 0.5s ease-out forwards" }}
      >
        <div className="h-5 bg-gradient-to-r from-[#0c4d47] to-[#0c4d47]/60" />
        <div className="px-1 pt-1 space-y-0.5">
          <div className="h-[2px] w-8 bg-[#0a2225]/30 rounded" />
          <div className="h-[2px] w-5 bg-[#C7A962]/50 rounded" />
        </div>
      </div>
      <style>{`
        @keyframes card-scale {
          0% { opacity: 0; transform: scale(0.3); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
