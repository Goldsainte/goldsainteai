import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  MapPin,
  Image as ImageIcon,
  Video,
  Check,
  Wallet,
  Star,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CreatorAIMagic
 * Premium 4-scene looping animation that visually demonstrates how
 * Goldsainte AI turns uploaded travel media into a sellable itinerary.
 * Pure CSS + Tailwind. No external animation libs.
 */

const SCENE_MS = 2800;
const SCENES = 4;

const thumbColors = [
  "from-[#bcd3d0] to-[#0c4d47]", // beach
  "from-[#f3d9b1] to-[#c08457]", // food
  "from-[#dcc89a] to-[#8a6a2e]", // landmark
  "from-[#cfd9d6] to-[#384e4b]", // hotel
  "from-[#f6c9a8] to-[#b85c3a]", // sunset
  "from-[#d6e0d6] to-[#5b7a6a]", // reel
];

const metaChips = [
  { icon: MapPin, label: "Oia, Santorini" },
  { icon: Sparkles, label: "Sunset" },
  { icon: MapPin, label: "Catamaran" },
  { icon: Sparkles, label: "Winery" },
];

const itinerary = [
  { day: "01", title: "Santorini Sunset Dinner", sub: "Oia · Cliffside" },
  { day: "02", title: "Catamaran Cruise", sub: "Caldera · Half-day" },
  { day: "03", title: "Cliffside Winery Experience", sub: "Megalochori · Tasting" },
];

export const CreatorAIMagic: React.FC = () => {
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(true);
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced.current) {
        setStep(2);
        return;
      }
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced.current || !active) return;
    const id = setInterval(() => setStep((s) => (s + 1) % SCENES), SCENE_MS);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div
      ref={ref}
      className="relative w-full h-[280px] md:h-[420px] overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F8F1E0] to-[#F5EFE1]"
      aria-label="Goldsainte AI turning travel media into a curated itinerary"
    >
      {/* Soft ambient gold glow */}
      <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-[#C7A962]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#0c4d47]/10 blur-3xl" />

      {/* Scene 1 — Upload from phone */}
      <Scene visible={step === 0}>
        <PhoneFrame>
          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.18em] text-[#0a2225]/70">
              Camera Roll
            </span>
            <span className="flex items-center gap-1 text-[9px] text-[#0c4d47]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C7A962] animate-pulse" />
              Uploading
            </span>
          </div>
          <div className="px-3 grid grid-cols-3 gap-1.5">
            {thumbColors.map((c, i) => (
              <div
                key={i}
                className={cn(
                  "relative aspect-square rounded-md bg-gradient-to-br shadow-sm overflow-hidden",
                  c,
                  "opacity-0 animate-[gs-pop_500ms_ease-out_forwards]"
                )}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {i % 3 === 0 && (
                  <Video className="absolute bottom-1 right-1 w-2.5 h-2.5 text-white/90" />
                )}
                {i === 1 && (
                  <div className="absolute top-1 left-1 w-3 h-3 rounded-full bg-[#0c4d47] flex items-center justify-center">
                    <Check className="w-2 h-2 text-[#C7A962]" strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="px-3 pt-2.5 pb-3">
            <div className="h-1 rounded-full bg-[#E5DFC6] overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-[#C7A962] to-[#e7cf95] animate-[gs-progress_2.4s_ease-out_forwards]" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {["Santorini", "Sunset", "Dinner"].map((t, i) => (
                <span
                  key={t}
                  className="opacity-0 animate-[gs-rise_500ms_ease-out_forwards] inline-flex items-center gap-1 rounded-full bg-white/80 border border-[#E5DFC6] px-1.5 py-0.5 text-[8px] text-[#0a2225]"
                  style={{ animationDelay: `${600 + i * 120}ms` }}
                >
                  <MapPin className="w-2 h-2 text-[#C7A962]" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </PhoneFrame>
        <Caption text="Upload travel media" />
      </Scene>

      {/* Scene 2 — AI processing */}
      <Scene visible={step === 1}>
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Pulse rings */}
          <span className="absolute w-28 h-28 rounded-full border border-[#C7A962]/40 animate-[gs-ring_2.4s_ease-out_infinite]" />
          <span
            className="absolute w-28 h-28 rounded-full border border-[#C7A962]/40 animate-[gs-ring_2.4s_ease-out_infinite]"
            style={{ animationDelay: "0.8s" }}
          />
          {/* Orb */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#0c4d47] to-[#08332f] shadow-[0_10px_40px_rgba(12,77,71,0.4)] flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[#C7A962]" />
          </div>

          {/* Floating media tiles being absorbed */}
          {[
            { x: "-110px", y: "-70px", c: thumbColors[0], d: 0 },
            { x: "120px", y: "-60px", c: thumbColors[2], d: 150 },
            { x: "-120px", y: "60px", c: thumbColors[4], d: 300 },
            { x: "110px", y: "75px", c: thumbColors[1], d: 450 },
          ].map((t, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-9 h-9 rounded-md bg-gradient-to-br shadow-md",
                t.c,
                "opacity-0 animate-[gs-absorb_2.2s_ease-in-out_forwards]"
              )}
              style={{
                ["--tx" as any]: t.x,
                ["--ty" as any]: t.y,
                animationDelay: `${t.d}ms`,
              }}
            />
          ))}

          {/* Metadata chips */}
          {metaChips.map((m, i) => {
            const Icon = m.icon;
            const positions = [
              "top-4 left-4",
              "top-6 right-4",
              "bottom-6 left-6",
              "bottom-4 right-6",
            ];
            return (
              <span
                key={m.label}
                className={cn(
                  "absolute inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur border border-[#E5DFC6] px-2 py-1 text-[9px] text-[#0a2225] shadow-sm opacity-0",
                  positions[i],
                  "animate-[gs-rise_700ms_ease-out_forwards]"
                )}
                style={{ animationDelay: `${500 + i * 180}ms` }}
              >
                <Icon className="w-2.5 h-2.5 text-[#C7A962]" />
                {m.label}
              </span>
            );
          })}
        </div>
        <Caption text="AI reads & organizes" />
      </Scene>

      {/* Scene 3 — Itinerary assembles */}
      <Scene visible={step === 2}>
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="w-full max-w-[280px] rounded-2xl bg-white/95 border border-[#E5DFC6] shadow-[0_18px_44px_rgba(10,34,37,0.10)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F0E8D2]">
              <div className="flex items-center gap-1.5">
                <Wand2 className="w-3 h-3 text-[#C7A962]" />
                <span className="text-[9px] uppercase tracking-[0.18em] text-[#0a2225]/70">
                  Generated Itinerary
                </span>
              </div>
              <span className="font-secondary text-[10px] text-[#0c4d47]">
                Santorini · 3 days
              </span>
            </div>
            <ul className="divide-y divide-[#F0E8D2]">
              {itinerary.map((d, i) => (
                <li
                  key={d.day}
                  className="flex items-center gap-3 px-4 py-2.5 opacity-0 animate-[gs-rise_600ms_ease-out_forwards]"
                  style={{ animationDelay: `${150 + i * 220}ms` }}
                >
                  <span className="font-secondary text-[15px] text-[#C7A962] tracking-wide">
                    {d.day}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-secondary text-[12px] text-[#0a2225] leading-tight truncate">
                      {d.title}
                    </p>
                    <p className="text-[9px] text-[#6B7280] mt-0.5">{d.sub}</p>
                  </div>
                  <div
                    className={cn(
                      "w-7 h-7 rounded-md bg-gradient-to-br shrink-0",
                      thumbColors[i]
                    )}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Caption text="Itinerary auto-generated" />
      </Scene>

      {/* Scene 4 — Publish & monetize */}
      <Scene visible={step === 3}>
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="w-full max-w-[280px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_18px_44px_rgba(10,34,37,0.12)] overflow-hidden opacity-0 animate-[gs-rise_500ms_ease-out_forwards]">
            <div className="relative h-20 bg-gradient-to-br from-[#bcd3d0] via-[#7fa8a3] to-[#0c4d47]">
              <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] text-[#0a2225]">
                <Star className="w-2.5 h-2.5 text-[#C7A962] fill-[#C7A962]" />
                4.9
              </span>
            </div>
            <div className="px-4 pt-3 pb-3.5">
              <p className="font-secondary text-[13px] text-[#0a2225] leading-tight">
                Santorini in 3 Days
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#C7A962] to-[#8a6a2e]" />
                <span className="text-[9px] text-[#6B7280]">@elenaroams</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="font-secondary text-[16px] text-[#0a2225]">
                  $249
                </span>
                <button
                  type="button"
                  className="relative overflow-hidden rounded-full bg-[#0c4d47] px-3.5 py-1.5 text-[10px] font-medium text-[#FDFBF7]"
                >
                  <span className="relative z-10">Publish</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[gs-shimmer_1.8s_ease-in-out_infinite]" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-2.5 py-1 text-[10px] text-[#C7A962] opacity-0 animate-[gs-rise_600ms_ease-out_forwards]" style={{ animationDelay: "600ms" }}>
          <Wallet className="w-3 h-3" />
          +$249 earned
        </div>
        <Caption text="Listed on the marketplace" />
      </Scene>

      {/* Step indicator */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {Array.from({ length: SCENES }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-[3px] rounded-full transition-all duration-500",
              step === i ? "w-6 bg-[#C7A962]" : "w-2 bg-[#C7A962]/30"
            )}
          />
        ))}
      </div>

      <style>{`
        @keyframes gs-pop {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes gs-rise {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes gs-progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes gs-ring {
          0% { transform: scale(0.6); opacity: 0.7; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes gs-absorb {
          0% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(1); }
          25% { opacity: 1; }
          100% { opacity: 0; transform: translate(0, 0) scale(0.4); }
        }
        @keyframes gs-shimmer {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

const Scene: React.FC<{ visible: boolean; children: React.ReactNode }> = ({
  visible,
  children,
}) => (
  <div
    className={cn(
      "absolute inset-0 transition-opacity duration-700 ease-out",
      visible ? "opacity-100" : "opacity-0 pointer-events-none"
    )}
  >
    {children}
  </div>
);

const Caption: React.FC<{ text: string }> = ({ text }) => (
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur border border-[#E5DFC6] px-3 py-1 text-[10px] tracking-wide text-[#0a2225] shadow-sm">
    <Sparkles className="w-3 h-3 text-[#C7A962]" />
    {text}
  </div>
);

const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative w-[170px] md:w-[185px] h-[260px] md:h-[300px] rounded-[28px] bg-[#0a2225] p-1.5 shadow-[0_20px_50px_rgba(10,34,37,0.25)]">
      <div className="relative w-full h-full rounded-[22px] bg-gradient-to-b from-[#FDFBF7] to-[#F5EFE1] overflow-hidden">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-3 rounded-full bg-[#0a2225]" />
        <div className="pt-5">{children}</div>
      </div>
    </div>
  </div>
);

export default CreatorAIMagic;