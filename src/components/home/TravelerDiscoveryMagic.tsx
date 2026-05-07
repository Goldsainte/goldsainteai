import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Heart, Star, Check, ShieldCheck, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const SCENE_MS = 3600;
const SCENES = 4;

const tastes = ["Luxury", "Food & Wine", "Slow Travel", "Wellness", "Adventure"];

const swaps = [
  { from: "Boutique Inn", to: "Canaves Oia · Cliffside Suite", tag: "Stay" },
  { from: "Casual taverna", to: "Selene · Tasting Menu", tag: "Dining" },
  { from: "City walk", to: "Private Sailboat · Caldera Sunset", tag: "Experience" },
];

const aiSuggestions = [
  { label: "Add: Private Sommelier Tasting", c: "from-[#7a2438] to-[#3d101c]", t: "8%", l: "4%" },
  { label: "Nearby: Akrotiri at Golden Hour", c: "from-[#f3b87a] to-[#b85c3a]", t: "10%", l: "60%" },
  { label: "Hidden gem: Vlychada Black Beach", c: "from-[#7a7466] to-[#2d2a24]", t: "70%", l: "30%" },
];

const dayTimeline = [
  { day: "01", title: "Cliffside Dinner", c: "from-[#bcd3d0] to-[#0c4d47]" },
  { day: "02", title: "Caldera Sunset", c: "from-[#f3d9b1] to-[#c08457]" },
  { day: "03", title: "Winery Tasting", c: "from-[#dcc89a] to-[#8a6a2e]" },
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
      aria-label="How travelers discover, personalize, and book curated trips on Goldsainte"
    >
      <div className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full bg-[#C7A962]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-[#0c4d47]/10 blur-3xl" />

      {/* Scene 1 — Living marketplace */}
      <Scene visible={step === 0}>
        <div className="absolute inset-0 px-5 pt-10 pb-12 flex flex-col">
          <div className="flex items-center gap-2 mb-2.5 opacity-0 animate-[gs-fade-in_500ms_ease-out_forwards]">
            <span className="font-secondary italic text-[12px] text-[#0a2225]">Trending in Summer</span>
            <span className="block h-px bg-[#C7A962] origin-left animate-[gs-grow-x_700ms_ease-out_400ms_forwards] scale-x-0 w-12" />
          </div>
          <div className="flex-1 grid grid-cols-5 gap-2.5">
            {/* Hero card */}
            <div
              className="col-span-3 relative rounded-2xl overflow-hidden bg-white border border-[#E5DFC6] shadow-[0_18px_40px_rgba(10,34,37,0.12)] opacity-0 animate-[gs-card-in_700ms_ease-out_forwards]"
              style={{ ["--rot" as any]: "-0.4deg", animationDelay: "180ms" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#bcd3d0] via-[#7fa8a3] to-[#0c4d47]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/70 via-[#0a2225]/10 to-transparent" />
              <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/85 backdrop-blur px-1.5 py-0.5 text-[10px] text-[#0a2225]">
                <Star className="w-2.5 h-2.5 text-[#C7A962] fill-[#C7A962]" /> 4.9
              </div>
              <button
                aria-label="Save"
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/85 backdrop-blur flex items-center justify-center"
              >
                <Heart className="w-3 h-3 text-[#C7A962] opacity-0 fill-[#C7A962] animate-[gs-fade-in_400ms_ease-out_1400ms_forwards]" />
                <Heart className="absolute w-3 h-3 text-[#0a2225]/60 animate-[gs-fade-out_400ms_ease-out_1400ms_forwards]" />
              </button>
              <span
                className="absolute top-9 right-2 text-[10px] font-secondary text-[#C7A962] opacity-0 animate-[gs-rise_500ms_ease-out_1600ms_forwards]"
              >
                +1 saved
              </span>
              <div className="absolute bottom-2 left-3 right-3">
                <p className="font-secondary italic text-[14px] text-white leading-tight">Santorini Escape</p>
                <p className="text-[10px] text-white/80 mt-0.5">Curated with @elenaroams · from $249</p>
              </div>
            </div>

            {/* Right column */}
            <div className="col-span-2 flex flex-col gap-2.5">
              <SmallCard
                gradient="from-[#e9c9b8] via-[#b56a6a] to-[#4a2330]"
                title="Kyoto Cultural Journey"
                chip="Curated by Local Experts"
                price={389}
                delay={360}
                rot="0.6deg"
              />
              <SmallCard
                gradient="from-[#f3d9b1] via-[#d18a59] to-[#6b3a2a]"
                title="Amalfi Coast Villas"
                chip="Hidden Gem"
                price={429}
                delay={540}
                rot="-0.5deg"
              />
            </div>
          </div>
          <div
            className="absolute bottom-12 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-[#C7A962]/50 px-2 py-1 text-[10px] text-[#0a2225] shadow-[0_8px_20px_rgba(199,169,98,0.18)] opacity-0 animate-[gs-rise_500ms_ease-out_1100ms_forwards]"
          >
            <Sparkles className="w-2.5 h-2.5 text-[#C7A962]" />
            Recommended for you
          </div>
          <div
            className="absolute bottom-12 left-4 inline-flex items-center gap-1 rounded-full bg-white/90 border border-[#E5DFC6] px-2 py-0.5 text-[10px] text-[#0a2225]/75 opacity-0 animate-[gs-rise_500ms_ease-out_1400ms_forwards]"
          >
            <span className="w-1 h-1 rounded-full bg-[#0c4d47] animate-pulse" />
            +18 viewing now
          </div>
        </div>
        <Caption text="Discover trips made for you" />
      </Scene>

      {/* Scene 2 — Transformational personalization */}
      <Scene visible={step === 1}>
        <div className="absolute inset-0 px-5 pt-10 pb-12 flex items-center justify-center">
          <div className="w-full max-w-[300px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_22px_50px_rgba(10,34,37,0.14)] overflow-hidden opacity-0 animate-[gs-rise_500ms_ease-out_forwards]">
            <div className="px-3 py-2.5 border-b border-[#F0E8D2]">
              <p className="font-secondary italic text-[13px] text-[#0a2225] leading-tight">Santorini Escape</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#0a2225]/55 mt-0.5">Tailoring your taste</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {tastes.map((t, i) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] border border-[#E5DFC6] bg-white text-[#0a2225]/55 opacity-0 animate-[gs-taste-on_500ms_ease-out_forwards]"
                    style={{ animationDelay: `${250 + i * 160}ms` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative px-3 py-2.5">
              {/* Right tailoring line */}
              <svg className="absolute right-2 top-3 bottom-3 w-px pointer-events-none" viewBox="0 0 1 100" preserveAspectRatio="none">
                <line
                  x1="0.5" y1="0" x2="0.5" y2="100"
                  stroke="#C7A962" strokeWidth="0.6" strokeDasharray="2 3"
                  style={{ strokeDashoffset: 100, animation: "gs-draw 1.4s ease-out 600ms forwards" }}
                />
              </svg>
              {swaps.map((row, i) => (
                <div key={row.tag} className="relative flex items-center gap-2 py-1.5">
                  <span className="font-secondary italic text-[10px] text-[#C7A962] w-12 shrink-0">{row.tag}</span>
                  <div className="relative flex-1 h-4">
                    <span
                      className="absolute inset-0 font-secondary text-[10px] text-[#0a2225]/45 animate-[gs-fade-out_400ms_ease-out_forwards]"
                      style={{ animationDelay: `${1100 + i * 320}ms` }}
                    >
                      {row.from}
                    </span>
                    <span
                      className="absolute inset-0 font-secondary text-[11px] text-[#0a2225] opacity-0 translate-y-1 animate-[gs-swap-in_500ms_ease-out_forwards]"
                      style={{ animationDelay: `${1300 + i * 320}ms` }}
                    >
                      {row.to}
                    </span>
                  </div>
                  <Check
                    className="w-3 h-3 text-[#0c4d47] opacity-0 animate-[gs-fade-in_300ms_ease-out_forwards]"
                    strokeWidth={3}
                    style={{ animationDelay: `${1700 + i * 320}ms` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <Caption text="Tailored to your taste in real time" />
      </Scene>

      {/* Scene 3 — AI inspiration layer */}
      <Scene visible={step === 2}>
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_18px_40px_rgba(10,34,37,0.12)] overflow-hidden">
            <div className="h-14 bg-gradient-to-br from-[#bcd3d0] via-[#7fa8a3] to-[#0c4d47]" />
            <div className="px-3 py-2">
              <p className="font-secondary italic text-[12px] text-[#0a2225] leading-tight">Santorini Escape</p>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#0c4d47] px-2 py-0.5 text-[10px] text-[#C7A962]">
                <Sparkles className="w-2.5 h-2.5" />
                Tailored by Goldsainte AI
              </div>
            </div>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-[#C7A962]/15 blur-2xl animate-pulse" />

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 460" preserveAspectRatio="none">
            {[
              "M 70 80 Q 150 140 195 200",
              "M 330 80 Q 270 140 215 200",
              "M 180 380 Q 200 320 200 270",
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

          {aiSuggestions.map((s, i) => (
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
        <Caption text="Goldsainte curates the rest" />
      </Scene>

      {/* Scene 4 — Cinematic booking payoff */}
      <Scene visible={step === 3}>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 gap-2.5 pt-2">
          <div className="w-full max-w-[300px] rounded-2xl bg-white border border-[#E5DFC6] shadow-[0_22px_50px_rgba(10,34,37,0.14)] overflow-hidden opacity-0 animate-[gs-rise_600ms_ease-out_forwards]">
            <div className="relative h-24 bg-gradient-to-br from-[#bcd3d0] via-[#7fa8a3] to-[#0c4d47] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/60 to-transparent" />
              <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[gs-shimmer_1.6s_ease-out_300ms_forwards]" />
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#C7A962]/85 backdrop-blur px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#0a2225]">
                <Check className="w-2.5 h-2.5" strokeWidth={3} />
                Trip Confirmed
              </span>
              <div className="absolute bottom-2 left-3 right-3">
                <p className="font-secondary italic text-[14px] text-white leading-tight">Santorini Escape · Jun 12–14</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="relative flex items-center gap-2">
                <svg className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-px w-[calc(100%-16px)] pointer-events-none" viewBox="0 0 100 1" preserveAspectRatio="none">
                  <line
                    x1="0" y1="0.5" x2="100" y2="0.5"
                    stroke="#C7A962" strokeWidth="0.4" strokeDasharray="2 3"
                    style={{ strokeDashoffset: 100, animation: "gs-draw 1.2s ease-out 700ms forwards" }}
                  />
                </svg>
                {dayTimeline.map((d, i) => (
                  <div
                    key={d.day}
                    className="relative z-10 flex-1 rounded-md p-1.5 bg-gradient-to-br border border-white/60 opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
                    style={{ animationDelay: `${300 + i * 150}ms` }}
                  >
                    <div className={cn("h-7 rounded bg-gradient-to-br", d.c)} />
                    <p className="text-[10px] uppercase tracking-widest text-[#0a2225]/70 mt-1">Day {d.day}</p>
                    <p className="font-secondary italic text-[10px] text-[#0a2225] leading-tight truncate">{d.title}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#0a2225]/70">
                <span className="inline-flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#C7A962] to-[#8a6a2e]" />
                  Curated with @elenaroams
                </span>
                <span className="inline-flex items-center gap-1 text-[#C7A962]">
                  <Heart className="w-2.5 h-2.5 fill-[#C7A962]" />
                  Saved to your trips
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-white/85 border border-[#E5DFC6] px-2.5 py-0.5 text-[10px] text-[#0a2225] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
              style={{ animationDelay: "1000ms" }}
            >
              <ShieldCheck className="w-2.5 h-2.5 text-[#0c4d47]" />
              On-platform booking · Fully protected
            </div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-2.5 py-0.5 text-[10px] text-[#C7A962] opacity-0 animate-[gs-rise_500ms_ease-out_forwards]"
              style={{ animationDelay: "1300ms" }}
            >
              <Mail className="w-2.5 h-2.5" />
              Itinerary sent to your inbox
            </div>
          </div>
        </div>
        <Caption text="Booked. Saved. Ready to travel." />
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
        @keyframes gs-fade-out { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes gs-rise { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes gs-card-in { 0% { opacity: 0; transform: translateY(14px) rotate(0deg) scale(0.94); } 100% { opacity: 1; transform: translateY(0) rotate(var(--rot)) scale(1); } }
        @keyframes gs-draw { to { stroke-dashoffset: 0; } }
        @keyframes gs-grow-x { to { transform: scaleX(1); } }
        @keyframes gs-shimmer { 0% { transform: translateX(0); } 100% { transform: translateX(400%); } }
        @keyframes gs-swap-in { 0% { opacity: 0; transform: translateY(4px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes gs-taste-on {
          0% { opacity: 0; transform: translateY(2px); background: white; color: rgba(10,34,37,0.55); border-color: #E5DFC6; }
          60% { opacity: 1; transform: translateY(0); background: white; color: rgba(10,34,37,0.55); border-color: #E5DFC6; }
          100% { opacity: 1; background: #0c4d47; color: #C7A962; border-color: #0c4d47; }
        }
      `}</style>
    </div>
  );
};

const SmallCard: React.FC<{ gradient: string; title: string; chip: string; price: number; delay: number; rot: string }> = ({
  gradient, title, chip, price, delay, rot,
}) => (
  <div
    className="relative flex-1 rounded-2xl overflow-hidden bg-white border border-[#E5DFC6] shadow-[0_14px_30px_rgba(10,34,37,0.10)] opacity-0 animate-[gs-card-in_700ms_ease-out_forwards]"
    style={{ ["--rot" as any]: rot, animationDelay: `${delay}ms` }}
  >
    <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
    <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/65 to-transparent" />
    <span className="absolute top-1.5 left-1.5 inline-flex items-center rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-secondary italic text-[#0a2225]">
      {chip}
    </span>
    <div className="absolute bottom-1.5 left-2 right-2">
      <p className="font-secondary italic text-[10px] text-white leading-tight truncate">{title}</p>
      <p className="text-[10px] text-white/80">from ${price}</p>
    </div>
  </div>
);

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

export default TravelerDiscoveryMagic;
