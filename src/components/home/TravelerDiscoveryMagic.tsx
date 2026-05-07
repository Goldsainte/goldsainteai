import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  MapPin,
  Heart,
  Star,
  Check,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SCENE_MS = 3600;
const SCENES = 4;

const trips = [
  {
    title: "Santorini Escape",
    host: "@elenaroams",
    price: 249,
    rating: 4.9,
    saves: 243,
    c: "from-[#bcd3d0] via-[#7fa8a3] to-[#0c4d47]",
  },
  {
    title: "Kyoto Cultural Journey",
    host: "@hiroyuki",
    price: 389,
    rating: 4.8,
    saves: 412,
    c: "from-[#e9c9b8] via-[#b56a6a] to-[#4a2330]",
  },
  {
    title: "Bali Wellness Retreat",
    host: "Goldsainte Concierge",
    price: 329,
    rating: 4.9,
    saves: 187,
    c: "from-[#d6e0c2] via-[#8aa776] to-[#3d5a39]",
  },
];

const personalize = [
  { label: "Pace", options: ["Slow", "Balanced", "Active"], selected: 1 },
  { label: "Dining", options: ["Local", "Fine Dining"], selected: 1 },
  { label: "Stays", options: ["Boutique", "Luxury"], selected: 1 },
];

const aiSuggestions = [
  { label: "Add: Private Sommelier Tasting · +$45", t: "10%", l: "4%" },
  { label: "Nearby: Akrotiri Excavation Tour", t: "10%", l: "55%" },
  { label: "Hidden gem: Vlychada Black Beach", t: "70%", l: "30%" },
];

export const TravelerDiscoveryMagic: React.FC = () => {
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
      aria-label="How travelers discover and book curated trips on Goldsainte"
    >
      <div className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full bg-[#C7A962]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-[#0c4d47]/10 blur-3xl" />

      {/* Scene 1 — Marketplace */}
      <Scene visible={step === 0}>
        <div className="absolute inset-0 px-5 pt-10 pb-12 flex flex-col items-center justify-center gap-2.5">
          {trips.map((t, i) => {
            const rotations = ["-1.2deg", "0.8deg", "-0.6deg"];
            return (
              <div
                key={t.title}
                className="w-full max-w-[300px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_14px_34px_rgba(10,34,37,0.10)] overflow-hidden flex opacity-0 animate-[gs-card-in_700ms_ease-out_forwards]"
                style={{
                  ["--rot" as any]: rotations[i],
                  animationDelay: `${i * 220}ms`,
                }}
              >
                <div className={cn("w-20 h-20 shrink-0 bg-gradient-to-br", t.c)} />
                <div className="flex-1 min-w-0 px-3 py-2">
                  <p className="font-secondary text-[13px] text-[#0a2225] leading-tight truncate">
                    {t.title}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#C7A962] to-[#8a6a2e]" />
                    <span className="text-[9px] text-[#6B7280] truncate">{t.host}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[8px] text-[#6B7280]">from</span>
                      <span className="font-secondary text-[13px] text-[#0a2225]">${t.price}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-[#0a2225]/70">
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-[#C7A962] fill-[#C7A962]" />
                        {t.rating}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Heart className="w-2.5 h-2.5 text-[#C7A962]" />
                        {t.saves}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Caption text="Discover curated trips" />
      </Scene>

      {/* Scene 2 — Personalize */}
      <Scene visible={step === 1}>
        <div className="absolute inset-0 px-5 pt-10 pb-12 flex items-center justify-center gap-3">
          {/* Trip card */}
          <div className="w-[160px] md:w-[170px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_18px_40px_rgba(10,34,37,0.12)] overflow-hidden shrink-0">
            <div className={cn("h-20 bg-gradient-to-br", trips[0].c)} />
            <div className="px-3 py-2">
              <p className="font-secondary text-[12px] text-[#0a2225] leading-tight">
                Santorini Escape
              </p>
              <p className="font-secondary italic text-[9px] text-[#6B7280] mt-0.5">
                Tailored to you
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-secondary text-[13px] text-[#0a2225] tabular-nums animate-[gs-fade-in_400ms_ease-out_forwards]">
                  $349
                </span>
                <span className="text-[8px] text-[#6B7280] line-through">$249</span>
              </div>
            </div>
          </div>

          {/* Personalize panel */}
          <div className="w-[150px] md:w-[170px] rounded-2xl bg-white/95 backdrop-blur border border-[#E5DFC6] shadow-[0_18px_40px_rgba(10,34,37,0.10)] p-3 opacity-0 animate-[gs-rise_500ms_ease-out_forwards]">
            <p className="text-[8px] uppercase tracking-[0.2em] text-[#0a2225]/70 mb-2">
              Personalize
            </p>
            {personalize.map((row, i) => (
              <div
                key={row.label}
                className="mb-2 opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
                style={{ animationDelay: `${300 + i * 220}ms` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-[#6B7280]">{row.label}</span>
                  <Check className="w-2.5 h-2.5 text-[#0c4d47]" strokeWidth={3} />
                </div>
                <div className="flex gap-1">
                  {row.options.map((o, j) => (
                    <span
                      key={o}
                      className={cn(
                        "flex-1 text-center rounded-full px-1 py-0.5 text-[8px] border",
                        j === row.selected
                          ? "bg-[#0c4d47] text-[#C7A962] border-[#0c4d47]"
                          : "bg-white text-[#0a2225]/60 border-[#E5DFC6]"
                      )}
                    >
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {/* Budget slider */}
            <div className="mt-2 opacity-0 animate-[gs-rise_500ms_ease-out_forwards]" style={{ animationDelay: "1000ms" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-[#6B7280]">Budget</span>
                <span className="text-[9px] font-secondary text-[#0a2225]">$349</span>
              </div>
              <div className="relative h-1 rounded-full bg-[#F0E8D2]">
                <div className="absolute left-0 top-0 h-full rounded-full bg-[#C7A962] animate-[gs-slide_1.4s_ease-out_forwards]" style={{ width: "0%" }} />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#C7A962] ring-2 ring-white shadow animate-[gs-slide-dot_1.4s_ease-out_forwards]"
                  style={{ left: "0%" }}
                />
              </div>
            </div>
          </div>
        </div>
        <Caption text="Tailor it to your taste" />
      </Scene>

      {/* Scene 3 — AI recommendations */}
      <Scene visible={step === 2}>
        <div className="absolute inset-0">
          {/* center personalized card */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_18px_40px_rgba(10,34,37,0.12)] overflow-hidden">
            <div className={cn("h-16 bg-gradient-to-br", trips[0].c)} />
            <div className="px-3 py-2">
              <p className="font-secondary text-[12px] text-[#0a2225] leading-tight">
                Santorini Escape
              </p>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#0c4d47] px-2 py-0.5 text-[8px] text-[#C7A962]">
                <Sparkles className="w-2.5 h-2.5" />
                +3 AI suggestions added
              </div>
            </div>
          </div>

          {/* dotted connectors */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 460" preserveAspectRatio="none">
            {[
              "M 70 80 Q 150 140 200 200",
              "M 330 80 Q 270 140 220 200",
              "M 180 380 Q 200 320 200 260",
            ].map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#C7A962"
                strokeWidth="1"
                strokeDasharray="3 4"
                style={{
                  strokeDashoffset: 300,
                  animation: "gs-draw 1.6s ease-out forwards",
                  animationDelay: `${300 + i * 200}ms`,
                }}
              />
            ))}
          </svg>

          {/* Floating suggestion chips */}
          {aiSuggestions.map((s, i) => (
            <div
              key={s.label}
              className="absolute max-w-[150px] opacity-0 animate-[gs-rise_600ms_ease-out_forwards]"
              style={{ top: s.t, left: s.l, animationDelay: `${500 + i * 220}ms` }}
            >
              <div className="rounded-lg bg-white/95 backdrop-blur border border-[#C7A962]/60 px-2 py-1 shadow-[0_8px_20px_rgba(199,169,98,0.18)]">
                <div className="flex items-start gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#C7A962] mt-0.5 shrink-0" />
                  <span className="font-secondary italic text-[9px] text-[#0a2225] leading-tight">
                    {s.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Caption text="Goldsainte tailors it further" />
      </Scene>

      {/* Scene 4 — Booking confirmed */}
      <Scene visible={step === 3}>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 gap-2.5 pt-2">
          <div className="w-full max-w-[300px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_22px_50px_rgba(10,34,37,0.14)] overflow-hidden opacity-0 animate-[gs-rise_600ms_ease-out_forwards]">
            <div className={cn("relative h-20 bg-gradient-to-br", trips[0].c)}>
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#0c4d47] px-2 py-0.5 text-[8px] uppercase tracking-wider text-[#C7A962]">
                <Check className="w-2.5 h-2.5" strokeWidth={3} />
                Trip Confirmed
              </span>
              <div className="absolute bottom-2 left-3 right-3">
                <p className="font-secondary italic text-[13px] text-white leading-tight">
                  Santorini Escape · Jun 12–14
                </p>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-md p-1.5 bg-gradient-to-br border border-white/60 opacity-0 animate-[gs-rise_500ms_ease-out_forwards]",
                      ["from-[#bcd3d0] to-[#0c4d47]", "from-[#f3d9b1] to-[#c08457]", "from-[#dcc89a] to-[#8a6a2e]"][i]
                    )}
                    style={{ animationDelay: `${300 + i * 150}ms` }}
                  >
                    <span className="text-[7px] uppercase tracking-widest text-white/90">Day {i + 1}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[9px] text-[#0a2225]/70">
                <span className="inline-flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#C7A962] to-[#8a6a2e]" />
                  Booked with @elenaroams
                </span>
                <span className="inline-flex items-center gap-1 text-[#0c4d47]">
                  <Mail className="w-2.5 h-2.5" />
                  Itinerary sent
                </span>
              </div>
            </div>
          </div>
          <div
            className="inline-flex items-center gap-1.5 rounded-full bg-white/85 border border-[#E5DFC6] px-2.5 py-0.5 text-[9px] text-[#0a2225] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
            style={{ animationDelay: "1000ms" }}
          >
            <ShieldCheck className="w-2.5 h-2.5 text-[#0c4d47]" />
            On-platform booking · Fully protected
          </div>
        </div>
        <Caption text="Booked. Saved. Ready to travel." />
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
        @keyframes gs-pop { 0% { opacity: 0; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes gs-fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes gs-rise { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes gs-card-in { 0% { opacity: 0; transform: translateY(14px) rotate(0deg) scale(0.94); } 100% { opacity: 1; transform: translateY(0) rotate(var(--rot)) scale(1); } }
        @keyframes gs-draw { to { stroke-dashoffset: 0; } }
        @keyframes gs-slide { to { width: 72%; } }
        @keyframes gs-slide-dot { to { left: 72%; } }
      `}</style>
    </div>
  );
};

const Scene: React.FC<{ visible: boolean; children: React.ReactNode }> = ({ visible, children }) => (
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

export default TravelerDiscoveryMagic;
