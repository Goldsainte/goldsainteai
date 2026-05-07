import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  MapPin,
  Video,
  Heart,
  Wallet,
  Star,
  Clock,
  Utensils,
  Wand2,
  Calendar,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CreatorAIMagic — premium 4-scene loop:
 *   1. Camera roll selection
 *   2. AI understanding the journey (chronology + smart tags)
 *   3. Condé-Nast-style itinerary product
 *   4. Marketplace-ready monetization moment
 */

const SCENE_MS = 3600;
const SCENES = 4;

const memories = [
  { c: "from-[#bcd3d0] to-[#0c4d47]", place: "Oia, Santorini", meta: "5:42 PM · Sunset", icon: MapPin },
  { c: "from-[#f3d9b1] to-[#c08457]", place: "Ammoudi Taverna", meta: "Day 1 · Dinner", icon: Utensils },
  { c: "from-[#dcc89a] to-[#8a6a2e]", place: "Caldera Viewpoint", meta: "Day 2 · Morning", icon: MapPin },
  { c: "from-[#cfd9d6] to-[#384e4b]", place: "Canaves Suite", meta: "Day 2 · Stay", icon: MapPin },
  { c: "from-[#f6c9a8] to-[#b85c3a]", place: "Sunset Catamaran", meta: "Day 2 · Cruise", icon: Video },
  { c: "from-[#d6e0d6] to-[#5b7a6a]", place: "Megalochori", meta: "Day 3 · Tasting", icon: MapPin },
];

const itinerary = [
  { day: "01", title: "Arrival & Cliffside Dinner", sub: "Canaves Oia · Ammoudi Taverna" },
  { day: "02", title: "Private Catamaran Cruise", sub: "Caldera · Half-day with sommelier" },
  { day: "03", title: "Winery & Sunset Tasting", sub: "Megalochori · Cliffside Estate" },
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
      className="relative w-full h-[300px] md:h-[460px] overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F8F1E0] to-[#F5EFE1]"
      aria-label="Goldsainte AI turning travel media into a curated, sellable itinerary"
    >
      <div className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full bg-[#C7A962]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-[#0c4d47]/10 blur-3xl" />

      {/* Scene 1 — Camera Roll */}
      <Scene visible={step === 0}>
        <PhoneFrame label="Camera Roll" status="6 selected">
          <div className="px-3 grid grid-cols-3 gap-1.5">
            {memories.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "relative aspect-square rounded-md bg-gradient-to-br shadow-sm overflow-hidden opacity-0 animate-[gs-pop_500ms_ease-out_forwards]",
                  m.c
                )}
                style={{ animationDelay: `${i * 110}ms` }}
              >
                {i % 4 === 0 && (
                  <Video className="absolute bottom-1 right-1 w-2.5 h-2.5 text-white/90" />
                )}
                {i !== 5 && (
                  <div
                    className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-[#C7A962] flex items-center justify-center opacity-0 animate-[gs-pop_400ms_ease-out_forwards]"
                    style={{ animationDelay: `${750 + i * 110}ms` }}
                  >
                    <Check className="w-2.5 h-2.5 text-[#0a2225]" strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="px-3 pt-2">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-[#E5DFC6] px-2 py-0.5 text-[8px] text-[#0a2225]">
              <MapPin className="w-2 h-2 text-[#C7A962]" />
              Captured in Santorini · Jun 12–14
            </div>
          </div>
          <div className="px-3 pt-2">
            <button className="w-full rounded-full bg-[#0c4d47] text-[#FDFBF7] text-[10px] font-medium py-1.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-2.5 h-2.5 text-[#C7A962]" />
              Generate with Goldsainte AI
            </button>
          </div>
        </PhoneFrame>
        <Caption text="Pick your travel memories" />
      </Scene>

      {/* Scene 2 — AI Understanding */}
      <Scene visible={step === 1}>
        <div className="absolute inset-0">
          {/* Ambient AI glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(199,169,98,0.25)_0%,rgba(199,169,98,0)_70%)] animate-[gs-glow_3.6s_ease-in-out_infinite]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="absolute w-24 h-24 rounded-full border border-[#C7A962]/30 animate-[gs-ring_3s_ease-out_infinite]" />
            <span
              className="absolute w-24 h-24 rounded-full border border-[#C7A962]/30 animate-[gs-ring_3s_ease-out_infinite]"
              style={{ animationDelay: "1.2s" }}
            />
            <Sparkles className="w-5 h-5 text-[#C7A962]/60" />
          </div>

          {/* Chronology line connecting 3 cards */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 400 460"
            preserveAspectRatio="none"
          >
            <path
              d="M 80 110 Q 200 200 320 130 T 200 360"
              fill="none"
              stroke="#C7A962"
              strokeWidth="1"
              strokeDasharray="3 4"
              style={{
                strokeDashoffset: 600,
                animation: "gs-draw 2.4s ease-out forwards",
                animationDelay: "0.6s",
              }}
            />
          </svg>

          {/* Floating photo cards with rich captions */}
          {memories.slice(0, 5).map((m, i) => {
            const Icon = m.icon;
            const positions = [
              { t: "8%", l: "6%", r: "-6deg" },
              { t: "14%", l: "60%", r: "5deg" },
              { t: "46%", l: "20%", r: "3deg" },
              { t: "42%", l: "62%", r: "-4deg" },
              { t: "66%", l: "38%", r: "-2deg" },
            ][i];
            return (
              <div
                key={i}
                className="absolute opacity-0 animate-[gs-card-in_700ms_ease-out_forwards]"
                style={{
                  top: positions.t,
                  left: positions.l,
                  ["--rot" as any]: positions.r,
                  animationDelay: `${i * 160}ms`,
                }}
              >
                <div
                  className={cn(
                    "w-[88px] h-[64px] md:w-[108px] md:h-[78px] rounded-lg bg-gradient-to-br shadow-[0_10px_24px_rgba(10,34,37,0.18)] border border-white/60 overflow-hidden",
                    m.c
                  )}
                />
                <div
                  className="mt-1.5 max-w-[120px] rounded-md bg-white/95 backdrop-blur border border-[#E5DFC6] px-1.5 py-1 shadow-sm opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
                  style={{ animationDelay: `${550 + i * 160}ms` }}
                >
                  <div className="flex items-center gap-1">
                    <Icon className="w-2 h-2 text-[#C7A962] shrink-0" />
                    <span className="font-secondary italic text-[9px] md:text-[10px] text-[#0a2225] leading-tight truncate">
                      {m.place}
                    </span>
                  </div>
                  <div className="text-[7px] uppercase tracking-[0.12em] text-[#6B7280] mt-0.5">
                    {m.meta}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Caption text="Goldsainte recognizes your journey" />
      </Scene>

      {/* Scene 3 — Premium Itinerary Output */}
      <Scene visible={step === 2}>
        <div className="absolute inset-0 flex items-center justify-center px-5">
          <div className="w-full max-w-[320px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_24px_56px_rgba(10,34,37,0.14)] overflow-hidden opacity-0 animate-[gs-rise_600ms_ease-out_forwards]">
            {/* Hero strip */}
            <div className="relative h-20 bg-gradient-to-br from-[#bcd3d0] via-[#7fa8a3] to-[#0c4d47] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/55 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="font-secondary italic text-[15px] text-white leading-tight">
                  Santorini, in 3 Days
                </p>
                <p className="text-[8px] uppercase tracking-[0.2em] text-[#C7A962] mt-0.5">
                  Curated by AI · Reviewed by Elena
                </p>
              </div>
              <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-[#0c4d47]">
                <Wand2 className="w-2.5 h-2.5 text-[#C7A962]" /> Itinerary
              </span>
            </div>

            {/* Days with route line */}
            <div className="relative">
              {/* vertical dotted route on the right */}
              <svg
                className="absolute right-[26px] top-3 bottom-3 w-px h-[calc(100%-24px)] pointer-events-none"
                viewBox="0 0 1 100"
                preserveAspectRatio="none"
              >
                <line
                  x1="0.5" y1="0" x2="0.5" y2="100"
                  stroke="#C7A962" strokeWidth="0.5" strokeDasharray="2 3"
                  style={{ strokeDashoffset: 100, animation: "gs-draw 1.4s ease-out forwards", animationDelay: "1100ms" }}
                />
              </svg>

              <ul className="divide-y divide-[#F0E8D2]">
                {itinerary.map((d, i) => (
                  <li
                    key={d.day}
                    className="relative flex items-center gap-3 px-4 py-3 opacity-0 animate-[gs-rise_700ms_ease-out_forwards]"
                    style={{ animationDelay: `${250 + i * 320}ms` }}
                  >
                    <div className="flex flex-col items-center w-7 shrink-0">
                      <span className="font-secondary italic text-[18px] text-[#C7A962] leading-none">
                        {d.day}
                      </span>
                      <span className="text-[7px] uppercase tracking-widest text-[#6B7280] mt-0.5">Day</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-secondary text-[12px] text-[#0a2225] leading-tight truncate">
                        {d.title}
                      </p>
                      <p className="font-secondary italic text-[9px] text-[#6B7280] mt-0.5 truncate">
                        {d.sub}
                      </p>
                    </div>
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-md bg-gradient-to-br shadow-sm",
                          memories[i].c
                        )}
                      />
                      {/* pin node on the route */}
                      <span className="absolute -right-[6px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#C7A962] ring-2 ring-white" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Highlight chips */}
            <div className="px-4 py-2 flex items-center gap-1 flex-wrap border-t border-[#F0E8D2]">
              {["Private Cruise", "Cliffside Dining", "Winery Tasting"].map((h, i) => (
                <span
                  key={h}
                  className="inline-flex items-center rounded-full border border-[#E5DFC6] bg-[#FBF7EC] px-2 py-0.5 text-[8px] text-[#0a2225] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
                  style={{ animationDelay: `${1300 + i * 130}ms` }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Footer meta */}
            <div className="grid grid-cols-4 gap-1 px-3 py-2 bg-[#FBF7EC] border-t border-[#F0E8D2]">
              <Meta icon={Calendar} label="3 days" />
              <Meta icon={MapPin} label="4 stops" />
              <Meta icon={Star} label="Curated" />
              <Meta icon={Clock} label="12 sec" />
            </div>
          </div>
        </div>
        <Caption text="A premium itinerary, written by AI" />
      </Scene>

      {/* Scene 4 — Marketplace Monetization */}
      <Scene visible={step === 3}>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 gap-2.5 pt-2">
          <div className="w-full max-w-[300px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_22px_50px_rgba(10,34,37,0.14)] overflow-hidden opacity-0 animate-[gs-rise_600ms_ease-out_forwards]">
            <div className="relative h-24 bg-gradient-to-br from-[#bcd3d0] via-[#7fa8a3] to-[#0c4d47]">
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#0c4d47] px-2 py-0.5 text-[8px] uppercase tracking-wider text-[#C7A962]">
                <span className="w-1 h-1 rounded-full bg-[#C7A962] animate-pulse" />
                Now Live · Available for Booking
              </span>
              <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] text-[#0a2225]">
                <Star className="w-2.5 h-2.5 text-[#C7A962] fill-[#C7A962]" />
                4.9
              </span>
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur px-1.5 py-0.5 text-[9px] text-white opacity-0 animate-[gs-rise_500ms_ease-out_forwards]" style={{ animationDelay: "500ms" }}>
                <Heart className="w-2.5 h-2.5 text-[#C7A962] fill-[#C7A962]" />
                243 saves
              </span>
            </div>
            <div className="px-4 pt-3 pb-3.5">
              <p className="font-secondary text-[14px] text-[#0a2225] leading-tight">
                Santorini in 3 Days
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#C7A962] to-[#8a6a2e]" />
                <span className="text-[9px] text-[#6B7280]">by @elenaroams · Creator</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[9px] text-[#6B7280]">from</span>
                  <span className="font-secondary text-[16px] text-[#0a2225]">$249</span>
                  <span className="text-[9px] text-[#6B7280] line-through">$299</span>
                </div>
                {/* Publish → Published swap */}
                <div className="relative h-[26px] w-[112px]">
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center gap-1 overflow-hidden rounded-full bg-[#0c4d47] px-3 text-[10px] font-medium text-[#FDFBF7] opacity-100 animate-[gs-fade-out_300ms_ease-out_forwards]"
                    style={{ animationDelay: "900ms" }}
                  >
                    <span className="relative z-10">Publish Itinerary</span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[gs-shimmer_1.6s_ease-in-out_infinite]" />
                  </button>
                  <div
                    className="absolute inset-0 flex items-center justify-center gap-1 rounded-full bg-[#0c4d47] text-[10px] font-medium text-[#C7A962] opacity-0 animate-[gs-fade-in_400ms_ease-out_forwards]"
                    style={{ animationDelay: "1100ms" }}
                  >
                    <Check className="w-3 h-3" strokeWidth={3} />
                    Published
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] text-[#C7A962] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
              style={{ animationDelay: "1400ms" }}
            >
              <Wallet className="w-3 h-3" />
              + $249 earned
            </div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-white/85 border border-[#E5DFC6] px-2.5 py-0.5 text-[9px] text-[#0a2225] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
              style={{ animationDelay: "1700ms" }}
            >
              <MapPin className="w-2.5 h-2.5 text-[#C7A962]" />
              Bookings open · Marketplace listing live
            </div>
          </div>
        </div>
        <Caption text="Your trip is now a sellable experience" />
      </Scene>

      {/* Step indicator */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
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
        @keyframes gs-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes gs-fade-out {
          0% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes gs-rise {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes gs-card-in {
          0% { opacity: 0; transform: translateY(14px) rotate(0deg) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) rotate(var(--rot)) scale(1); }
        }
        @keyframes gs-ring {
          0% { transform: scale(0.5); opacity: 0.7; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes gs-glow {
          0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.9); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes gs-draw {
          to { stroke-dashoffset: 0; }
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
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur border border-[#E5DFC6] px-3 py-1 text-[10px] tracking-wide text-[#0a2225] shadow-sm z-20">
    <Sparkles className="w-3 h-3 text-[#C7A962]" />
    {text}
  </div>
);

const Meta: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string }> = ({
  icon: Icon,
  label,
}) => (
  <span className="inline-flex items-center justify-center gap-1 text-[9px] text-[#0a2225]/70">
    <Icon className="w-2.5 h-2.5 text-[#0c4d47]" />
    {label}
  </span>
);

const PhoneFrame: React.FC<{
  children: React.ReactNode;
  label: string;
  status: string;
}> = ({ children, label, status }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative w-[180px] md:w-[200px] h-[280px] md:h-[340px] rounded-[32px] bg-[#0a2225] p-1.5 shadow-[0_24px_60px_rgba(10,34,37,0.28)]">
      <div className="relative w-full h-full rounded-[26px] bg-gradient-to-b from-[#FDFBF7] to-[#F5EFE1] overflow-hidden">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-full bg-[#0a2225]" />
        <div className="pt-6 px-3 pb-2 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#0a2225]/70">{label}</span>
          <span className="flex items-center gap-1 text-[9px] text-[#0c4d47]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C7A962] animate-pulse" />
            {status}
          </span>
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default CreatorAIMagic;
