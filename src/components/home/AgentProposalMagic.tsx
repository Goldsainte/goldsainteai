import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  MapPin,
  Hotel,
  Plane,
  Utensils,
  Camera,
  Car,
  Check,
  ShieldCheck,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SCENE_MS = 3600;
const SCENES = 4;

const blocks = [
  { icon: Hotel, label: "Stays" },
  { icon: Plane, label: "Flights" },
  { icon: Camera, label: "Experiences" },
  { icon: Utensils, label: "Dining" },
  { icon: Car, label: "Transfers" },
];

const days = [
  { day: "01", title: "Mykonos Arrival", sub: "Cali Mykonos · Sunset welcome", c: "from-[#cfd9d6] to-[#384e4b]" },
  { day: "02", title: "Private Yacht to Delos", sub: "Half-day · Sommelier onboard", c: "from-[#bcd3d0] to-[#0c4d47]" },
  { day: "03", title: "Santorini · Cliffside Dinner", sub: "Canaves Oia · Tasting menu", c: "from-[#f6c9a8] to-[#b85c3a]" },
];

const aiTips = [
  { label: "Suggested: Helicopter transfer Mykonos → Santorini", t: "8%", l: "30%" },
  { label: "Pair Day 3 with: Domaine Sigalas tasting", t: "62%", l: "4%" },
  { label: "Move yacht to Day 2 sunset", t: "70%", l: "55%" },
];

export const AgentProposalMagic: React.FC = () => {
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
      aria-label="How travel agents customize and deliver luxury proposals on Goldsainte"
    >
      <div className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full bg-[#C7A962]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-[#0c4d47]/10 blur-3xl" />

      {/* Scene 1 — Incoming request */}
      <Scene visible={step === 0}>
        <div className="absolute inset-0 px-5 pt-10 pb-12 flex flex-col items-center justify-center gap-2">
          {/* Pipeline (faded background cards) */}
          <div className="w-full max-w-[280px] rounded-xl bg-white/70 border border-[#E5DFC6] px-3 py-2 opacity-0 animate-[gs-rise_500ms_ease-out_forwards]" style={{ animationDelay: "500ms" }}>
            <p className="text-[10px] text-[#0a2225]/60 truncate">Family safari · Tanzania</p>
          </div>
          <div className="w-full max-w-[290px] rounded-xl bg-white/85 border border-[#E5DFC6] px-3 py-2 opacity-0 animate-[gs-rise_500ms_ease-out_forwards]" style={{ animationDelay: "300ms" }}>
            <p className="text-[10px] text-[#0a2225]/75 truncate">10-day Japan cultural itinerary</p>
          </div>

          {/* Active request */}
          <div className="w-full max-w-[300px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_18px_40px_rgba(10,34,37,0.12)] overflow-hidden opacity-0 animate-[gs-rise_600ms_ease-out_forwards]">
            <div className="px-3 py-2 flex items-center justify-between border-b border-[#F0E8D2]">
              <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-[0.2em] text-[#0c4d47]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C7A962] animate-pulse" />
                New request
              </span>
              <span className="text-[8px] text-[#6B7280]">just now</span>
            </div>
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#C7A962] to-[#8a6a2e]" />
                <span className="text-[9px] text-[#6B7280]">Sophia &amp; Marc · Couple</span>
              </div>
              <p className="font-secondary italic text-[14px] text-[#0a2225] mt-1.5 leading-tight">
                Luxury honeymoon in Greece
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1 text-[8px] text-[#0a2225]/70">
                {["10 days", "Sept", "2 travelers", "Budget $12k"].map((m) => (
                  <span key={m} className="inline-flex items-center rounded-full bg-[#FBF7EC] border border-[#E5DFC6] px-1.5 py-0.5">
                    {m}
                  </span>
                ))}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {["Privacy", "Cliffside Suites", "Sailing"].map((t) => (
                  <span key={t} className="inline-flex items-center rounded-full bg-[#0c4d47]/5 border border-[#0c4d47]/15 px-1.5 py-0.5 text-[8px] text-[#0c4d47]">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-end">
                <button className="rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] font-medium text-[#FDFBF7]">
                  Accept &amp; Build
                </button>
              </div>
            </div>
          </div>
        </div>
        <Caption text="A new client request lands" />
      </Scene>

      {/* Scene 2 — Build the proposal */}
      <Scene visible={step === 1}>
        <div className="absolute inset-0 px-4 pt-10 pb-12 flex gap-2.5">
          {/* Left rail */}
          <div className="w-[88px] md:w-[100px] rounded-2xl bg-white/95 border border-[#E5DFC6] shadow-[0_14px_30px_rgba(10,34,37,0.08)] p-2 shrink-0">
            <p className="text-[7px] uppercase tracking-[0.2em] text-[#0a2225]/60 mb-1.5 px-1">Trip Blocks</p>
            {blocks.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.label}
                  className="flex items-center gap-1.5 rounded-md border border-[#E5DFC6] bg-[#FBF7EC] px-1.5 py-1 mb-1 opacity-0 animate-[gs-rise_400ms_ease-out_forwards]"
                  style={{ animationDelay: `${100 + i * 110}ms` }}
                >
                  <Icon className="w-2.5 h-2.5 text-[#0c4d47]" />
                  <span className="text-[9px] text-[#0a2225]">{b.label}</span>
                </div>
              );
            })}
          </div>

          {/* Right canvas */}
          <div className="flex-1 relative rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_18px_40px_rgba(10,34,37,0.10)] p-2.5 overflow-hidden">
            <p className="text-[8px] uppercase tracking-[0.2em] text-[#0a2225]/60 mb-2">Itinerary canvas</p>

            <svg className="absolute right-[18px] top-12 bottom-3 w-px h-[calc(100%-60px)] pointer-events-none" viewBox="0 0 1 100" preserveAspectRatio="none">
              <line
                x1="0.5" y1="0" x2="0.5" y2="100"
                stroke="#C7A962" strokeWidth="0.5" strokeDasharray="2 3"
                style={{ strokeDashoffset: 100, animation: "gs-draw 1.4s ease-out forwards", animationDelay: "1100ms" }}
              />
            </svg>

            <div className="space-y-1.5">
              {days.map((d, i) => (
                <div
                  key={d.day}
                  className="relative flex items-center gap-2 rounded-md border border-[#F0E8D2] bg-[#FDFBF7] px-2 py-1.5 opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
                  style={{ animationDelay: `${250 + i * 280}ms` }}
                >
                  <span className="font-secondary italic text-[13px] text-[#C7A962] leading-none w-5 text-center">
                    {d.day}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-secondary text-[11px] text-[#0a2225] leading-tight truncate">
                      {d.title}
                    </p>
                    <p className="font-secondary italic text-[8px] text-[#6B7280] truncate">{d.sub}</p>
                  </div>
                  <div className="relative shrink-0">
                    <div className={cn("w-7 h-7 rounded-md bg-gradient-to-br shadow-sm", d.c)} />
                    <span className="absolute -right-[6px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#C7A962] ring-2 ring-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Caption text="Compose a concierge itinerary" />
      </Scene>

      {/* Scene 3 — AI refinements */}
      <Scene visible={step === 2}>
        <div className="absolute inset-0">
          {/* AI pill */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white/95 border border-[#C7A962]/50 px-2 py-0.5 text-[9px] text-[#0a2225] shadow-sm">
            <Sparkles className="w-2.5 h-2.5 text-[#C7A962] animate-pulse" />
            Goldsainte AI · Concierge
          </div>

          {/* Mini itinerary in center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_18px_40px_rgba(10,34,37,0.12)] p-2">
            {days.map((d, i) => (
              <div key={d.day} className="flex items-center gap-2 py-1 border-b last:border-b-0 border-[#F0E8D2]">
                <span className="font-secondary italic text-[11px] text-[#C7A962] w-4 text-center">{d.day}</span>
                <span className="font-secondary text-[10px] text-[#0a2225] truncate flex-1">{d.title}</span>
                <div className={cn("w-5 h-5 rounded-md bg-gradient-to-br", d.c)} />
              </div>
            ))}
          </div>

          {/* Connectors */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 460" preserveAspectRatio="none">
            {[
              "M 200 110 Q 200 170 200 200",
              "M 70 320 Q 140 280 180 240",
              "M 310 340 Q 260 290 220 250",
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

          {/* Suggestions */}
          {aiTips.map((s, i) => (
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
        <Caption text="AI refines the details with you" />
      </Scene>

      {/* Scene 4 — Send proposal */}
      <Scene visible={step === 3}>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 gap-2.5 pt-2">
          <div className="w-full max-w-[300px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_22px_50px_rgba(10,34,37,0.14)] overflow-hidden opacity-0 animate-[gs-rise_600ms_ease-out_forwards]">
            <div className="relative h-20 bg-gradient-to-br from-[#bcd3d0] via-[#7fa8a3] to-[#0c4d47] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/55 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="font-secondary italic text-[14px] text-white leading-tight">
                  Honeymoon · Cyclades, 10 Days
                </p>
                <p className="text-[8px] uppercase tracking-[0.2em] text-[#C7A962] mt-0.5">
                  Prepared for Sophia &amp; Marc
                </p>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {["Private Yacht", "Helicopter", "Cliffside Suites"].map((h, i) => (
                  <span
                    key={h}
                    className="inline-flex items-center rounded-full border border-[#E5DFC6] bg-[#FBF7EC] px-2 py-0.5 text-[8px] text-[#0a2225] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
                    style={{ animationDelay: `${300 + i * 130}ms` }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              <div className="mt-2.5 flex items-end justify-between">
                <div>
                  <span className="text-[8px] uppercase tracking-widest text-[#6B7280]">Total</span>
                  <p className="font-secondary text-[15px] text-[#0a2225] leading-none mt-0.5">$11,840</p>
                  <p className="text-[8px] text-[#6B7280] mt-0.5">50/50 schedule</p>
                </div>
                <div className="relative h-[26px] w-[110px]">
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center gap-1 overflow-hidden rounded-full bg-[#0c4d47] px-3 text-[10px] font-medium text-[#FDFBF7] opacity-100 animate-[gs-fade-out_300ms_ease-out_forwards]"
                    style={{ animationDelay: "900ms" }}
                  >
                    <Send className="w-2.5 h-2.5 text-[#C7A962]" />
                    <span>Send Proposal</span>
                  </button>
                  <div
                    className="absolute inset-0 flex items-center justify-center gap-1 rounded-full bg-[#0c4d47] text-[10px] font-medium text-[#C7A962] opacity-0 animate-[gs-fade-in_400ms_ease-out_forwards]"
                    style={{ animationDelay: "1100ms" }}
                  >
                    <Check className="w-3 h-3" strokeWidth={3} />
                    Sent
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-white/85 border border-[#E5DFC6] px-2.5 py-0.5 text-[9px] text-[#0a2225] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
              style={{ animationDelay: "1400ms" }}
            >
              <ShieldCheck className="w-2.5 h-2.5 text-[#0c4d47]" />
              Locked &amp; on-platform
            </div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-2.5 py-0.5 text-[9px] text-[#C7A962] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
              style={{ animationDelay: "1700ms" }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              Fee covered: 7% split (3.5 / 3.5)
            </div>
          </div>
        </div>
        <Caption text="Delivered. Trackable. On-platform." />
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
        @keyframes gs-fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes gs-fade-out { 0% { opacity: 1; } 100% { opacity: 0; pointer-events: none; } }
        @keyframes gs-rise { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes gs-draw { to { stroke-dashoffset: 0; } }
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

export default AgentProposalMagic;
