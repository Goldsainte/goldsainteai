import React from "react";

/**
 * Monochrome flag glyphs. Single-ink (currentColor) abstractions of national
 * flags — no national colors, no emoji. Frame: 24×16 with 0.5 inner stroke.
 * Glyphs hint at each flag's structure (stripes, cross, star, crescent, etc.)
 * while staying within the editorial design system.
 */

type GlyphProps = { className?: string };

const Frame: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>
    <rect x="0.5" y="0.5" width="23" height="15" fill="none" stroke="currentColor" strokeWidth="0.6" />
    {children}
  </>
);

const Stripes = ({ horizontal = true, count = 3 }: { horizontal?: boolean; count?: number }) => {
  const lines = [];
  for (let i = 1; i < count; i++) {
    if (horizontal) {
      const y = (16 / count) * i;
      lines.push(<line key={i} x1="0.5" y1={y} x2="23.5" y2={y} stroke="currentColor" strokeWidth="0.5" />);
    } else {
      const x = (24 / count) * i;
      lines.push(<line key={i} x1={x} y1="0.5" x2={x} y2="15.5" stroke="currentColor" strokeWidth="0.5" />);
    }
  }
  return <>{lines}</>;
};

const Star = ({ cx, cy, r = 1.4 }: { cx: number; cy: number; r?: number }) => {
  const points = [];
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
    points.push([cx + Math.cos(a) * r, cy - Math.sin(a) * r].join(","));
  }
  return <polygon points={points.join(" ")} fill="currentColor" />;
};

const glyphs: Record<string, React.ReactNode> = {
  // Americas
  "United States": (<><Frame /><rect x="0.5" y="0.5" width="10" height="7" fill="currentColor" opacity="0.18" /><Stripes count={7} /></>),
  "Canada": (<><Frame /><rect x="0.5" y="0.5" width="6" height="15" fill="currentColor" opacity="0.22" /><rect x="17.5" y="0.5" width="6" height="15" fill="currentColor" opacity="0.22" /><path d="M12 5 L13 7.5 L15.5 7 L13.7 9 L14.5 11.5 L12 10 L9.5 11.5 L10.3 9 L8.5 7 L11 7.5 Z" fill="currentColor" /></>),
  "Mexico": (<><Frame /><Stripes horizontal={false} /><circle cx="12" cy="8" r="1.6" fill="none" stroke="currentColor" strokeWidth="0.5" /></>),
  "Brazil": (<><Frame /><polygon points="12,2 22,8 12,14 2,8" fill="none" stroke="currentColor" strokeWidth="0.5" /><circle cx="12" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="0.5" /></>),
  // Europe — tricolors, crosses, single elements
  "Austria": (<><Frame /><Stripes count={3} /></>),
  "Belgium": (<><Frame /><Stripes horizontal={false} count={3} /></>),
  "Bulgaria": (<><Frame /><Stripes count={3} /></>),
  "Croatia": (<><Frame /><Stripes count={3} /><rect x="10" y="5" width="4" height="6" fill="none" stroke="currentColor" strokeWidth="0.5" /></>),
  "Cyprus": (<><Frame /><path d="M10 6 Q12 5 14 6 Q13 8 12 8 Q11 8 10 6 Z" fill="currentColor" opacity="0.4" /><line x1="9.5" y1="11" x2="14.5" y2="11" stroke="currentColor" strokeWidth="0.4" /></>),
  "Czechia": (<><Frame /><polygon points="0.5,0.5 12,8 0.5,15.5" fill="currentColor" opacity="0.18" /><line x1="0.5" y1="8" x2="23.5" y2="8" stroke="currentColor" strokeWidth="0.4" /></>),
  "Denmark": (<><Frame /><line x1="8" y1="0.5" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1" /><line x1="0.5" y1="7" x2="23.5" y2="7" stroke="currentColor" strokeWidth="1" /></>),
  "Estonia": (<><Frame /><Stripes count={3} /></>),
  "Finland": (<><Frame /><line x1="8" y1="0.5" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.2" /><line x1="0.5" y1="8" x2="23.5" y2="8" stroke="currentColor" strokeWidth="1.2" /></>),
  "France": (<><Frame /><Stripes horizontal={false} count={3} /></>),
  "Germany": (<><Frame /><Stripes count={3} /></>),
  "Greece": (<><Frame /><Stripes count={9} /><rect x="0.5" y="0.5" width="9" height="9" fill="currentColor" opacity="0.18" /><line x1="5" y1="0.5" x2="5" y2="9.5" stroke="currentColor" strokeWidth="0.4" /><line x1="0.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="0.4" /></>),
  "Hungary": (<><Frame /><Stripes count={3} /></>),
  "Ireland": (<><Frame /><Stripes horizontal={false} count={3} /></>),
  "Italy": (<><Frame /><Stripes horizontal={false} count={3} /></>),
  "Latvia": (<><Frame /><line x1="0.5" y1="5.5" x2="23.5" y2="5.5" stroke="currentColor" strokeWidth="0.4" /><line x1="0.5" y1="10.5" x2="23.5" y2="10.5" stroke="currentColor" strokeWidth="0.4" /></>),
  "Liechtenstein": (<><Frame /><line x1="0.5" y1="8" x2="23.5" y2="8" stroke="currentColor" strokeWidth="0.5" /><circle cx="6" cy="4.5" r="1.3" fill="none" stroke="currentColor" strokeWidth="0.4" /></>),
  "Lithuania": (<><Frame /><Stripes count={3} /></>),
  "Luxembourg": (<><Frame /><Stripes count={3} /></>),
  "Malta": (<><Frame /><line x1="12" y1="0.5" x2="12" y2="15.5" stroke="currentColor" strokeWidth="0.4" /><rect x="2.5" y="2.5" width="4" height="3" fill="none" stroke="currentColor" strokeWidth="0.4" /></>),
  "Netherlands": (<><Frame /><Stripes count={3} /></>),
  "Norway": (<><Frame /><line x1="8" y1="0.5" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.2" /><line x1="0.5" y1="8" x2="23.5" y2="8" stroke="currentColor" strokeWidth="1.2" /></>),
  "Poland": (<><Frame /><line x1="0.5" y1="8" x2="23.5" y2="8" stroke="currentColor" strokeWidth="0.4" /></>),
  "Portugal": (<><Frame /><line x1="9" y1="0.5" x2="9" y2="15.5" stroke="currentColor" strokeWidth="0.4" /><circle cx="9" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="0.4" /></>),
  "Romania": (<><Frame /><Stripes horizontal={false} count={3} /></>),
  "Slovakia": (<><Frame /><Stripes count={3} /><rect x="3" y="5" width="4" height="6" fill="none" stroke="currentColor" strokeWidth="0.4" /></>),
  "Slovenia": (<><Frame /><Stripes count={3} /><rect x="2.5" y="2" width="4" height="5" fill="none" stroke="currentColor" strokeWidth="0.4" /></>),
  "Spain": (<><Frame /><line x1="0.5" y1="4" x2="23.5" y2="4" stroke="currentColor" strokeWidth="0.4" /><line x1="0.5" y1="12" x2="23.5" y2="12" stroke="currentColor" strokeWidth="0.4" /><rect x="4" y="6" width="3" height="4" fill="none" stroke="currentColor" strokeWidth="0.4" /></>),
  "Sweden": (<><Frame /><line x1="8" y1="0.5" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.2" /><line x1="0.5" y1="8" x2="23.5" y2="8" stroke="currentColor" strokeWidth="1.2" /></>),
  "Switzerland": (<><Frame /><rect x="10.5" y="5.5" width="3" height="5" fill="currentColor" /><rect x="9" y="7" width="6" height="2" fill="currentColor" /></>),
  "United Kingdom": (<><Frame /><line x1="0.5" y1="0.5" x2="23.5" y2="15.5" stroke="currentColor" strokeWidth="0.5" /><line x1="23.5" y1="0.5" x2="0.5" y2="15.5" stroke="currentColor" strokeWidth="0.5" /><line x1="12" y1="0.5" x2="12" y2="15.5" stroke="currentColor" strokeWidth="1" /><line x1="0.5" y1="8" x2="23.5" y2="8" stroke="currentColor" strokeWidth="1" /></>),
  // Asia-Pacific
  "Australia": (<><Frame /><rect x="0.5" y="0.5" width="10" height="7" fill="currentColor" opacity="0.18" /><line x1="0.5" y1="0.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="0.4" /><line x1="10.5" y1="0.5" x2="0.5" y2="7.5" stroke="currentColor" strokeWidth="0.4" /><Star cx={17} cy={11} r={1.2} /></>),
  "Hong Kong": (<><Frame /><path d="M12 5 Q14 6 13.5 8 Q12.5 9.5 11 9 Q10 7.5 12 5 Z" fill="currentColor" opacity="0.5" /></>),
  "India": (<><Frame /><Stripes count={3} /><circle cx="12" cy="8" r="1.6" fill="none" stroke="currentColor" strokeWidth="0.4" /></>),
  "Indonesia": (<><Frame /><line x1="0.5" y1="8" x2="23.5" y2="8" stroke="currentColor" strokeWidth="0.5" /></>),
  "Japan": (<><Frame /><circle cx="12" cy="8" r="3" fill="currentColor" opacity="0.85" /></>),
  "Malaysia": (<><Frame /><Stripes count={7} /><rect x="0.5" y="0.5" width="10" height="7" fill="currentColor" opacity="0.18" /><Star cx={6.5} cy={4} r={1} /></>),
  "New Zealand": (<><Frame /><rect x="0.5" y="0.5" width="10" height="7" fill="currentColor" opacity="0.18" /><line x1="0.5" y1="0.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="0.4" /><line x1="10.5" y1="0.5" x2="0.5" y2="7.5" stroke="currentColor" strokeWidth="0.4" /><Star cx={16} cy={6} r={0.9} /><Star cx={19} cy={10} r={0.9} /></>),
  "Philippines": (<><Frame /><polygon points="0.5,0.5 12,8 0.5,15.5" fill="currentColor" opacity="0.18" /><circle cx="4" cy="8" r="0.9" fill="none" stroke="currentColor" strokeWidth="0.4" /></>),
  "Singapore": (<><Frame /><line x1="0.5" y1="8" x2="23.5" y2="8" stroke="currentColor" strokeWidth="0.4" /><path d="M5 4.5 a2 2 0 1 0 0.1 0.1 Z" fill="none" stroke="currentColor" strokeWidth="0.4" /></>),
  "Thailand": (<><Frame /><Stripes count={5} /></>),
  // Middle East / Africa
  "South Africa": (<><Frame /><polygon points="0.5,0.5 9,8 0.5,15.5" fill="currentColor" opacity="0.18" /><line x1="0.5" y1="5" x2="23.5" y2="5" stroke="currentColor" strokeWidth="0.4" /><line x1="0.5" y1="11" x2="23.5" y2="11" stroke="currentColor" strokeWidth="0.4" /></>),
  "United Arab Emirates": (<><Frame /><rect x="0.5" y="0.5" width="6" height="15" fill="currentColor" opacity="0.22" /><Stripes count={3} /></>),
};

export function FlagGlyph({ country, className = "" }: { country: string; className?: string }) {
  const glyph = glyphs[country];
  return (
    <svg
      viewBox="0 0 24 16"
      className={`text-[#0a2225] ${className}`}
      width="24"
      height="16"
      aria-hidden="true"
    >
      {glyph ?? <Frame />}
    </svg>
  );
}