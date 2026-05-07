import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Check, ShieldCheck, Send, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SCENE_MS = 3600;
const SCENES = 4;

const days = [
  { day: "01", title: "Positano · Cliffside Arrival", sub: "Le Sirenuse · Champagne welcome", c: "from-[#f6c9a8] to-[#b85c3a]", tags: ["Stay", "Dining"] },
  { day: "02", title: "Capri by Private Yacht", sub: "Da Paolino · Lemon-grove dinner", c: "from-[#bcd3d0] to-[#0c4d47]", tags: ["Yacht", "Dining"] },
  { day: "03", title: "Ravello · Belvedere Suite", sub: "Caruso · Cliffside terrace", c: "from-[#dcc89a] to-[#8a6a2e]", tags: ["Stay", "Experience"] },
];

const aiTips = [
  { label: "Pair Day 02 with: Da Adolfo by water taxi", c: "from-[#bcd3d0] to-[#0c4d47]", t: "12%", l: "4%" },
  { label: "Upgrade Day 03: Caruso Belvedere Suite", c: "from-[#dcc89a] to-[#8a6a2e]", t: "62%", l: "2%" },
  { label: "Add: Helicopter transfer Naples → Positano", c: "from-[#cfd9d6] to-[#384e4b]", t: "70%", l: "55%" },
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
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.2 });
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
      className="relative w-full h-[340px] sm:h-[400px] md:h-[460px] overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F8F1E0] to-[#F5EFE1]"
      aria-label="How travel agents craft and deliver luxury concierge proposals on Goldsainte"
    >
      <div className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full bg-[#C7A962]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-[#0c4d47]/10 blur-3xl" />

      {/* Scene 1 — Aspirational requests */}
      <Scene visible={step === 0}>
        <div className="absolute inset-0 px-5 pt-10 pb-12 flex flex-col">
          <div className="flex items-center gap-2 mb-2.5 opacity-0 animate-[gs-fade-in_500ms_ease-out_forwards]">
            <span className="font-secondary italic text-[12px] text-[#0a2225]">Concierge Inbox</span>
            <span className="block h-px bg-[#C7A962] origin-left animate-[gs-grow-x_700ms_ease-out_400ms_forwards] scale-x-0 w-12" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
            <div className="w-full max-w-[280px] rounded-xl bg-white/65 border border-[#E5DFC6] px-3 py-1.5 opacity-0 animate-[gs-rise_500ms_ease-out_500ms_forwards]">
              <p className="text-[10px] font-secondary italic text-[#0a2225]/55 truncate">Private safari · Anniversary · Tanzania</p>
            </div>
            <div className="w-full max-w-[290px] rounded-xl bg-white/85 border border-[#E5DFC6] px-3 py-1.5 opacity-0 animate-[gs-rise_500ms_ease-out_300ms_forwards]">
              <p className="text-[10px] font-secondary italic text-[#0a2225]/75 truncate">10-day Japan cultural journey · Family of 4</p>
            </div>

            <div className="w-full max-w-[300px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_18px_40px_rgba(10,34,37,0.12)] overflow-hidden opacity-0 animate-[gs-rise_600ms_ease-out_forwards]">
              <div className="px-3 py-2 flex items-center justify-between border-b border-[#F0E8D2]">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-[#0c4d47]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C7A962] animate-pulse" />
                  New request
                </span>
                <span className="text-[10px] text-[#6B7280]">just now</span>
              </div>
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#C7A962] to-[#8a6a2e]" />
                  <span className="text-[10px] text-[#6B7280]">Sophia &amp; Marc · Anniversary</span>
                  <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-[#0c4d47]/5 border border-[#0c4d47]/15 px-1.5 py-0.5 text-[10px] font-secondary italic text-[#0c4d47]">
                    <Star className="w-2 h-2 text-[#C7A962] fill-[#C7A962]" />
                    Verified Traveler
                  </span>
                </div>
                <p className="font-secondary italic text-[14px] text-[#0a2225] mt-1.5 leading-tight">
                  Luxury honeymoon along the Amalfi Coast
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-[#0a2225]/70">
                  {["10 days", "September", "2 travelers", "$12k"].map((m) => (
                    <span key={m} className="inline-flex items-center rounded-full bg-[#FBF7EC] border border-[#E5DFC6] px-1.5 py-0.5">{m}</span>
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {["Cliffside Suites", "Private Sailing", "Michelin Dining"].map((t) => (
                    <span key={t} className="inline-flex items-center rounded-full bg-[#0c4d47]/5 border border-[#0c4d47]/15 px-1.5 py-0.5 text-[10px] font-secondary italic text-[#0c4d47]">{t}</span>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-end">
                  <button className="rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] font-medium text-[#C7A962]">Accept &amp; Curate</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Caption text="Luxury requests, curated by you" />
      </Scene>

      {/* Scene 2 — Magazine-style assembly */}
      <Scene visible={step === 1}>
        <div className="absolute inset-0 px-5 pt-10 pb-12 flex flex-col">
          <div className="flex items-center gap-2 mb-2 opacity-0 animate-[gs-fade-in_500ms_ease-out_forwards]">
            <span className="font-secondary italic text-[11px] text-[#0a2225]">Amalfi · 10 Days · Prepared for Sophia &amp; Marc</span>
            <span className="block h-px bg-[#C7A962] origin-left animate-[gs-grow-x_700ms_ease-out_400ms_forwards] scale-x-0 w-10" />
          </div>

          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-[#C7A962]/15 blur-3xl" />

            {/* Vertical gold connector */}
            <svg className="absolute right-3 top-2 bottom-2 w-px pointer-events-none" viewBox="0 0 1 100" preserveAspectRatio="none">
              <line
                x1="0.5" y1="0" x2="0.5" y2="100"
                stroke="#C7A962" strokeWidth="0.6" strokeDasharray="2 3"
                style={{ strokeDashoffset: 100, animation: "gs-draw 1.6s ease-out 800ms forwards" }}
              />
            </svg>

            <div className="relative space-y-2">
              {days.map((d, i) => (
                <div
                  key={d.day}
                  className="flex items-center gap-2.5 rounded-xl bg-white border border-[#E5DFC6] shadow-[0_10px_24px_rgba(10,34,37,0.08)] p-2 opacity-0 animate-[gs-card-in_650ms_ease-out_forwards]"
                  style={{ ["--rot" as any]: i % 2 === 0 ? "-0.3deg" : "0.3deg", animationDelay: `${i * 220}ms` }}
                >
                  <div className={cn("w-12 h-12 rounded-md bg-gradient-to-br shrink-0 shadow-sm", d.c)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#C7A962]">Day {d.day}</p>
                    <p className="font-secondary italic text-[12px] text-[#0a2225] leading-tight truncate">{d.title}</p>
                    <p className="font-secondary italic text-[10px] text-[#6B7280] truncate">{d.sub}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 mr-2">
                    {d.tags.map((t, ti) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-[#FBF7EC] border border-[#E5DFC6] px-1.5 py-0 text-[10px] text-[#0a2225]/70 opacity-0 animate-[gs-fade-in_400ms_ease-out_forwards]"
                        style={{ animationDelay: `${500 + i * 220 + ti * 120}ms` }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#C7A962] ring-2 ring-white" style={{ position: "relative" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <Caption text="Crafted like a luxury travel magazine" />
      </Scene>

      {/* Scene 3 — AI concierge assistance */}
      <Scene visible={step === 2}>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white/95 border border-[#C7A962]/50 px-2 py-0.5 text-[10px] text-[#0a2225] shadow-sm">
            <Sparkles className="w-2.5 h-2.5 text-[#C7A962] animate-pulse" />
            Goldsainte AI · Concierge
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_18px_40px_rgba(10,34,37,0.12)] p-2">
            {days.map((d) => (
              <div key={d.day} className="flex items-center gap-2 py-1 border-b last:border-b-0 border-[#F0E8D2]">
                <span className="font-secondary italic text-[11px] text-[#C7A962] w-5 text-center">{d.day}</span>
                <span className="font-secondary italic text-[10px] text-[#0a2225] truncate flex-1">{d.title}</span>
                <div className={cn("w-5 h-5 rounded-md bg-gradient-to-br", d.c)} />
              </div>
            ))}
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-[#C7A962]/15 blur-2xl animate-pulse pointer-events-none" />

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 460" preserveAspectRatio="none">
            {[
              "M 70 110 Q 140 170 180 220",
              "M 70 320 Q 140 280 180 250",
              "M 320 340 Q 260 290 220 250",
            ].map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#C7A962"
                strokeWidth="1"
                strokeDasharray="3 4"
                style={{ strokeDashoffset: 300, animation: "gs-draw 1.6s ease-out forwards", animationDelay: `${300 + i * 200}ms` }}
              />
            ))}
          </svg>

          {aiTips.map((s, i) => (
            <div
              key={s.label}
              className="absolute max-w-[160px] opacity-0 animate-[gs-rise_600ms_ease-out_forwards]"
              style={{ top: s.t, left: s.l, animationDelay: `${500 + i * 220}ms` }}
            >
              <div className="rounded-lg bg-white/95 backdrop-blur border border-[#C7A962]/60 px-2 py-1.5 shadow-[0_8px_20px_rgba(199,169,98,0.18)] flex items-center gap-1.5">
                <div className={cn("w-5 h-5 rounded-md bg-gradient-to-br shrink-0", s.c)} />
                <span className="font-secondary italic text-[10px] text-[#0a2225] leading-tight">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
        <Caption text="AI quietly elevates every detail" />
      </Scene>

      {/* Scene 4 — Delivery + acceptance */}
      <Scene visible={step === 3}>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 gap-2 pt-2">
          <div className="relative w-full max-w-[300px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_22px_50px_rgba(10,34,37,0.14)] overflow-hidden opacity-0 animate-[gs-rise_600ms_ease-out_forwards]">
            <div className="relative h-20 bg-gradient-to-br from-[#bcd3d0] via-[#7fa8a3] to-[#0c4d47] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/55 to-transparent" />
              <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[gs-shimmer_1.6s_ease-out_300ms_forwards]" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="font-secondary italic text-[14px] text-white leading-tight">Honeymoon · Amalfi Coast, 10 Days</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#C7A962] mt-0.5">Prepared for Sophia &amp; Marc</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {["Private Yacht", "Helicopter", "Cliffside Suites"].map((h, i) => (
                  <span
                    key={h}
                    className="inline-flex items-center rounded-full border border-[#E5DFC6] bg-[#FBF7EC] px-2 py-0.5 text-[10px] font-secondary italic text-[#0a2225] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
                    style={{ animationDelay: `${300 + i * 130}ms` }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              <div className="mt-2.5 flex items-end justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#6B7280]">Total</span>
                  <p className="font-secondary text-[15px] text-[#0a2225] leading-none mt-0.5">$11,840</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">50/50 schedule</p>
                </div>
                <div className="relative h-[26px] w-[110px]">
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center gap-1 overflow-hidden rounded-full bg-[#0c4d47] px-3 text-[10px] font-medium text-[#C7A962] opacity-100 animate-[gs-fade-out_300ms_ease-out_900ms_forwards]"
                  >
                    <Send className="w-2.5 h-2.5" />
                    <span>Send Proposal</span>
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-full bg-[#0c4d47] text-[10px] font-medium text-[#C7A962] opacity-0 animate-[gs-fade-in_400ms_ease-out_1100ms_forwards]">
                    <Check className="w-3 h-3" strokeWidth={3} />
                    Sent
                  </div>
                </div>
              </div>
            </div>

            {/* Acceptance overlay */}
            <div
              className="absolute left-2 right-2 bottom-2 rounded-xl bg-[#0c4d47] text-[#C7A962] px-3 py-2 shadow-[0_14px_30px_rgba(12,77,71,0.35)] opacity-0 translate-y-3 animate-[gs-rise_600ms_ease-out_forwards]"
              style={{ animationDelay: "1500ms" }}
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3" strokeWidth={3} />
                <span className="font-secondary italic text-[11px]">Sophia accepted · Booking activated</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#C7A962]/85">
                <Heart className="w-2.5 h-2.5 fill-[#C7A962]" />
                Live trip · Day-of concierge enabled
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-white/85 border border-[#E5DFC6] px-2.5 py-0.5 text-[10px] text-[#0a2225] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
              style={{ animationDelay: "2000ms" }}
            >
              <ShieldCheck className="w-2.5 h-2.5 text-[#0c4d47]" />
              Locked &amp; on-platform
            </div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-2.5 py-0.5 text-[10px] text-[#C7A962] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
              style={{ animationDelay: "2200ms" }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              Fee covered: 7% split (3.5 / 3.5)
            </div>
          </div>
        </div>
        <Caption text="Delivered. Accepted. Live." />
      </Scene>

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
        @keyframes gs-card-in { 0% { opacity: 0; transform: translateY(14px) rotate(0deg) scale(0.94); } 100% { opacity: 1; transform: translateY(0) rotate(var(--rot)) scale(1); } }
        @keyframes gs-draw { to { stroke-dashoffset: 0; } }
        @keyframes gs-grow-x { to { transform: scaleX(1); } }
        @keyframes gs-shimmer { 0% { transform: translateX(0); } 100% { transform: translateX(400%); } }
      `}</style>
    </div>
  );
};

const Scene: React.FC<{ visible: boolean; children: React.ReactNode }> = ({ visible, children }) => (
  <div className={cn("absolute inset-0 transition-opacity duration-700 ease-out", visible ? "opacity-100" : "opacity-0 pointer-events-none")}>
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
