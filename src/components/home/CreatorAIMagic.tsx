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
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CreatorAIMagic
 * A premium product-transformation animation: messy travel memories
 * become a curated, sellable itinerary. No pipeline diagrams — just
 * elegant UI states that morph from one to the next.
 */

const SCENE_MS = 3200;
const SCENES = 4;

const memories = [
  { c: "from-[#bcd3d0] to-[#0c4d47]", tag: "Oia Beach", icon: MapPin, time: "08:42" },
  { c: "from-[#f3d9b1] to-[#c08457]", tag: "Ammoudi Taverna", icon: Utensils, time: "13:10" },
  { c: "from-[#dcc89a] to-[#8a6a2e]", tag: "Caldera View", icon: MapPin, time: "16:25" },
  { c: "from-[#cfd9d6] to-[#384e4b]", tag: "Canaves Suite", icon: MapPin, time: "19:00" },
  { c: "from-[#f6c9a8] to-[#b85c3a]", tag: "Sunset Cruise", icon: Video, time: "20:18" },
  { c: "from-[#d6e0d6] to-[#5b7a6a]", tag: "Megalochori", icon: MapPin, time: "11:30" },
];

const itinerary = [
  { day: "01", title: "Arrival in Santorini", sub: "Canaves Oia · Check-in & cliffside dinner" },
  { day: "02", title: "Sunset Catamaran Cruise", sub: "Caldera · Half-day with sommelier" },
  { day: "03", title: "Cliffside Wine Experience", sub: "Megalochori · Private tasting" },
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
      className="relative w-full h-[300px] md:h-[440px] overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F8F1E0] to-[#F5EFE1]"
      aria-label="Goldsainte AI turning travel media into a curated itinerary"
    >
      {/* Soft ambient glows */}
      <div className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full bg-[#C7A962]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-[#0c4d47]/10 blur-3xl" />

      {/* Scene 1 — Camera roll upload */}
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
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {i % 4 === 0 && (
                  <Video className="absolute bottom-1 right-1 w-2.5 h-2.5 text-white/90" />
                )}
                <div
                  className="absolute inset-0 ring-1 ring-inset ring-[#C7A962] rounded-md opacity-0 animate-[gs-fade_500ms_ease-out_forwards]"
                  style={{ animationDelay: `${800 + i * 80}ms` }}
                />
                <div
                  className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-[#C7A962] flex items-center justify-center text-[8px] font-bold text-[#0a2225] opacity-0 animate-[gs-pop_400ms_ease-out_forwards]"
                  style={{ animationDelay: `${900 + i * 80}ms` }}
                >
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 pt-2.5">
            <button className="w-full rounded-full bg-[#0c4d47] text-[#FDFBF7] text-[10px] font-medium py-1.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-2.5 h-2.5 text-[#C7A962]" />
              Generate with Goldsainte AI
            </button>
          </div>
        </PhoneFrame>
        <Caption text="Pick your travel memories" />
      </Scene>

      {/* Scene 2 — AI understanding (photo collage with smart tags) */}
      <Scene visible={step === 1}>
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Floating photo cards with destination tags */}
          {memories.slice(0, 5).map((m, i) => {
            const Icon = m.icon;
            const positions = [
              { t: "12%", l: "10%", r: "-6deg" },
              { t: "18%", l: "58%", r: "5deg" },
              { t: "48%", l: "22%", r: "3deg" },
              { t: "44%", l: "62%", r: "-4deg" },
              { t: "62%", l: "40%", r: "-2deg" },
            ][i];
            return (
              <div
                key={i}
                className="absolute opacity-0 animate-[gs-card-in_700ms_ease-out_forwards]"
                style={{
                  top: positions.t,
                  left: positions.l,
                  ["--rot" as any]: positions.r,
                  animationDelay: `${i * 140}ms`,
                }}
              >
                <div
                  className={cn(
                    "w-[88px] h-[64px] md:w-[104px] md:h-[76px] rounded-lg bg-gradient-to-br shadow-[0_10px_24px_rgba(10,34,37,0.18)] border border-white/60 overflow-hidden",
                    m.c
                  )}
                />
                <div
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur border border-[#E5DFC6] px-1.5 py-0.5 text-[8px] md:text-[9px] text-[#0a2225] shadow-sm opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
                  style={{ animationDelay: `${500 + i * 140}ms` }}
                >
                  <Icon className="w-2 h-2 text-[#C7A962]" />
                  {m.tag}
                  <span className="text-[#6B7280]">· {m.time}</span>
                </div>
              </div>
            );
          })}
          {/* Subtle scanning shimmer */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C7A962]/15 to-transparent h-12 animate-[gs-scan_2.6s_ease-in-out_infinite]" />
        </div>
        <Caption text="Goldsainte recognizes places & moments" />
      </Scene>

      {/* Scene 3 — Itinerary generation */}
      <Scene visible={step === 2}>
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="w-full max-w-[300px] rounded-2xl bg-white/95 border border-[#E5DFC6] shadow-[0_22px_50px_rgba(10,34,37,0.12)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F0E8D2]">
              <div className="flex items-center gap-1.5">
                <Wand2 className="w-3 h-3 text-[#C7A962]" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#0a2225]/70">
                  Curated Itinerary
                </span>
              </div>
              <span className="font-secondary italic text-[10px] text-[#0c4d47]">
                Santorini · 3 days
              </span>
            </div>
            <ul className="divide-y divide-[#F0E8D2]">
              {itinerary.map((d, i) => (
                <li
                  key={d.day}
                  className="flex items-center gap-3 px-4 py-2.5 opacity-0 animate-[gs-rise_650ms_ease-out_forwards]"
                  style={{ animationDelay: `${200 + i * 280}ms` }}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-secondary italic text-[14px] text-[#C7A962] leading-none">
                      {d.day}
                    </span>
                    <span className="text-[7px] uppercase tracking-widest text-[#6B7280] mt-0.5">Day</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-secondary text-[12px] text-[#0a2225] leading-tight truncate">
                      {d.title}
                    </p>
                    <p className="text-[9px] text-[#6B7280] mt-0.5 truncate">{d.sub}</p>
                  </div>
                  <div
                    className={cn(
                      "w-9 h-9 rounded-md bg-gradient-to-br shrink-0 shadow-sm",
                      memories[i].c
                    )}
                  />
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between px-4 py-2 bg-[#FBF7EC] border-t border-[#F0E8D2]">
              <span className="inline-flex items-center gap-1 text-[9px] text-[#0a2225]/70">
                <Calendar className="w-2.5 h-2.5 text-[#0c4d47]" />3 days
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] text-[#0a2225]/70">
                <MapPin className="w-2.5 h-2.5 text-[#0c4d47]" />4 stops
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] text-[#0a2225]/70">
                <Clock className="w-2.5 h-2.5 text-[#0c4d47]" />Auto-built
              </span>
            </div>
          </div>
        </div>
        <Caption text="A complete trip — written for you" />
      </Scene>

      {/* Scene 4 — Marketplace listing */}
      <Scene visible={step === 3}>
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div
            className="w-full max-w-[300px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_22px_50px_rgba(10,34,37,0.14)] overflow-hidden opacity-0 animate-[gs-rise_600ms_ease-out_forwards]"
          >
            <div className="relative h-24 bg-gradient-to-br from-[#bcd3d0] via-[#7fa8a3] to-[#0c4d47]">
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#0c4d47] px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-[#C7A962]">
                Available
              </span>
              <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] text-[#0a2225]">
                <Star className="w-2.5 h-2.5 text-[#C7A962] fill-[#C7A962]" />
                4.9
              </span>
              <button className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                <Heart className="w-3 h-3 text-[#0c4d47]" />
              </button>
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
                <div>
                  <span className="font-secondary text-[16px] text-[#0a2225]">$249</span>
                  <span className="text-[9px] text-[#6B7280] ml-1">/ traveler</span>
                </div>
                <button
                  type="button"
                  className="relative overflow-hidden rounded-full bg-[#0c4d47] px-4 py-1.5 text-[10px] font-medium text-[#FDFBF7]"
                >
                  <span className="relative z-10">Publish</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[gs-shimmer_1.8s_ease-in-out_infinite]" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] text-[#C7A962] opacity-0 animate-[gs-rise_600ms_ease-out_forwards]"
          style={{ animationDelay: "700ms" }}
        >
          <Wallet className="w-3 h-3" />
          +$249 earned
        </div>
        <Caption text="Now bookable on the marketplace" />
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
        @keyframes gs-fade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes gs-rise {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes gs-card-in {
          0% { opacity: 0; transform: translateY(14px) rotate(0deg) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) rotate(var(--rot)) scale(1); }
        }
        @keyframes gs-scan {
          0% { transform: translateY(-30%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(110%); opacity: 0; }
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

const PhoneFrame: React.FC<{
  children: React.ReactNode;
  label: string;
  status: string;
}> = ({ children, label, status }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative w-[180px] md:w-[200px] h-[280px] md:h-[330px] rounded-[32px] bg-[#0a2225] p-1.5 shadow-[0_24px_60px_rgba(10,34,37,0.28)]">
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
