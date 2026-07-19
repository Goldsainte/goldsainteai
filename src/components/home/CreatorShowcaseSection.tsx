// CreatorShowcaseSection — "Built for creators" (approved from the animated
// HTML preview, Jul 18 2026). Fora-style capability showcase in the house
// register: five auto-rotating tabs, each playing an animated vignette of a
// REAL platform feature over brand destination imagery (Ken Burns drift —
// video feel, zero video weight). Honest stat strip: we flex terms, not
// fabricated volume. Scene labels sit in solid dark pills so photos can
// never wash them out (founder note from the preview review).
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import positano from "@/assets/home/storyboard-positano.webp";
import overwater from "@/assets/home/hero-overwater-villa.webp";
import amalfi from "@/assets/home/hero-amalfi-coast.webp";
import bali from "@/assets/home/storyboard-bali.webp";
import seoul from "@/assets/home/storyboard-seoul.webp";
import maldives from "@/assets/home/storyboard-maldives.webp";
import jungle from "@/assets/home/hero-jungle-villa.webp";
import desert from "@/assets/creator-desert-camel.webp";
import beach from "@/assets/beach-flowers.webp";

const ROTATE_MS = 5000;

const TABS = [
  {
    title: "Get hired for trips",
    body:
      "Travelers hire you to plan, guide, or shoot their trip. Requests land in your pipeline — you send the proposal, they accept, it's booked.",
  },
  {
    title: "Paid at booking",
    body:
      "Deposits and balances land in your own Stripe account the moment your client pays — never chased over Venmo.",
  },
  {
    title: "A flat 3.5% fee",
    body:
      "7% platform fee total, split evenly with your traveler. Standard card processing applies. No tiers. No surprises.",
  },
  {
    title: "Sell guides & services",
    body:
      "Your itineraries, presets, planning calls, and day rates — a storefront under your own name.",
  },
  {
    title: "Get hired on location",
    body:
      "Post where you're headed. Travelers hire you while you're already there — your highest-margin bookings.",
  },
];

const SHELF = [
  { t: "Lisbon in 5 days", p: "$29", k: "Guide", img: positano },
  { t: "Photo day rate", p: "$450", k: "Service", img: desert },
  { t: "Preset pack", p: "$19", k: "Digital", img: jungle },
  { t: "Planning call", p: "$95", k: "1:1", img: seoul },
  { t: "Tulum guide", p: "$24", k: "Guide", img: beach },
  { t: "Full trip plan", p: "$350", k: "Service", img: maldives },
];

const CAL = [
  { d: "Portugal", w: "December 2026" },
  { d: "Patagonia", w: "January 2027" },
  { d: "Morocco", w: "March 2027" },
];

const SCENE_IMG = [positano, overwater, amalfi, bali, desert];

function SceneChip({ children }: { children: React.ReactNode }) {
  // Solid dark pill — headings never get lost behind photography.
  return (
    <span className="absolute left-6 top-5 z-20 inline-flex items-center rounded-full bg-[#061a18]/85 px-3.5 py-1.5 text-[12px] uppercase tracking-[0.2em] text-[#C7A962] backdrop-blur-sm">
      {children}
    </span>
  );
}

export function CreatorShowcaseSection() {
  const [active, setActive] = useState(0);
  const [earned, setEarned] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const restart = (i: number) => {
    setActive(i);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(
      () => setActive((a) => (a + 1) % TABS.length),
      ROTATE_MS
    );
  };

  useEffect(() => {
    timer.current = setInterval(
      () => setActive((a) => (a + 1) % TABS.length),
      ROTATE_MS
    );
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  // Earnings count-up when the 96.5% scene is on stage.
  useEffect(() => {
    if (active !== 2) return;
    let raf = 0;
    const end = 2171.25;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1600);
      setEarned(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <section className="border-t border-[#E5DFC6] bg-[#f7f3ea] py-16 md:py-24">
      <style>{`
        @keyframes gsCsFill { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes gsCsSlideIn { from { transform: translateY(34px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes gsCsCalIn { from { transform: translateX(-28px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes gsCsLightUp { to { opacity: 1; } }
        @keyframes gsCsGrow { to { width: 100%; } }
        @keyframes gsCsPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(199,169,98,.5); } 50% { box-shadow: 0 0 0 9px rgba(199,169,98,0); } }
        @keyframes gsCsKb { from { transform: scale(1); } to { transform: scale(1.1); } }
        @media (prefers-reduced-motion: reduce) {
          .gs-cs-anim, .gs-cs-anim * { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#8D6B2F]">
          Built for creators
        </p>
        <h2 className="mt-3 font-secondary text-3xl leading-[1.15] text-[#0a2225] md:text-[40px]">
          Your audience already asks.
          <br />
          Now the answer pays you.
        </h2>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#0a2225]/75">
          Everything a travel creator needs to run a real business — hire
          requests, direct Stripe payments, a storefront for your guides and
          services, and a client pipeline — in one place, on your terms.
        </p>

        {/* Honest stat strip: pre-launch we flex TERMS, not volume. */}
        <div className="mt-11 grid grid-cols-2 border-t border-[#0a2225]/15 md:grid-cols-4">
          {[
            ["7%", "Flat fee. Ever."],
            ["3.5%", "Your flat platform fee"],
            ["$0", "To start"],
            ["100%", "Paid direct to your Stripe"],
          ].map(([n, l], i) => (
            <div
              key={l}
              className={`pt-5 ${i > 0 ? "md:border-l md:border-[#0a2225]/10 md:pl-5" : ""} ${i % 2 === 1 ? "border-l border-[#0a2225]/10 pl-5 md:border-l" : ""}`}
            >
              <p className="font-secondary text-[30px] text-[#0a2225] md:text-[34px]">{n}</p>
              <p className="mt-1 text-[12.5px] uppercase tracking-[0.1em] text-[#0a2225]/55">
                {l}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid items-center gap-10 md:grid-cols-[360px_minmax(0,1fr)] md:gap-11">
          {/* Tabs */}
          <div className="flex flex-col">
            {TABS.map((t, i) => {
              const on = i === active;
              return (
                <button
                  key={t.title}
                  type="button"
                  onClick={() => restart(i)}
                  className="relative border-t border-[#0a2225]/12 px-1 py-4 text-left"
                >
                  <span className="absolute -left-4 bottom-0 top-0 hidden w-[2px] bg-[#0a2225]/8 md:block">
                    {on && (
                      <span
                        key={`bar-${i}-${active}`}
                        className="gs-cs-anim absolute inset-0 origin-top bg-[#C7A962]"
                        style={{ animation: `gsCsFill ${ROTATE_MS}ms linear forwards` }}
                      />
                    )}
                  </span>
                  <span
                    className={`block text-[17px] font-medium transition-colors ${on ? "text-[#0a2225]" : "text-[#0a2225]/45"}`}
                  >
                    {t.title}
                  </span>
                  <span
                    className={`block overflow-hidden text-[14px] leading-relaxed text-[#0a2225]/70 transition-all duration-500 ${on ? "mt-1.5 max-h-24 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    {t.body}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stage */}
          <div className="relative h-[400px] w-full overflow-hidden rounded-3xl bg-[#0f3d38] shadow-[0_24px_70px_-30px_rgba(10,34,37,0.5)] md:h-[380px] md:max-w-[620px] md:justify-self-end">
            {SCENE_IMG.map((img, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"}`}
              >
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                  className="gs-cs-anim absolute inset-0 h-full w-full object-cover"
                  style={i === active ? { animation: "gsCsKb 14s ease-out forwards" } : undefined}
                />
                {/* Scrim: heavy left for mock legibility + solid top band so
                    labels never wash out (founder note). */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#082622]/95 via-[#082622]/80 to-[#082622]/55" />
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#061a18]/80 to-transparent" />
              </div>
            ))}

            {/* Active scene content (remounts on switch to restart animations) */}
            <div key={active} className="gs-cs-anim absolute inset-0 z-20 flex flex-col justify-center px-6 pb-6 pt-16 md:px-8">
              {active === 0 && (
                <>
                  <SceneChip>Hire requests</SceneChip>
                  <div
                    className="max-w-[390px] rounded-2xl bg-[#fdfaf2] p-5 opacity-0 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.45)]"
                    style={{ animation: "gsCsSlideIn .8s cubic-bezier(.2,.9,.3,1) .25s forwards" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C7A962] text-[14px] font-semibold text-[#0a2225]">
                        MT
                      </span>
                      <span>
                        <span className="block text-[15px] font-medium text-[#0a2225]">
                          Maya T. wants to hire you
                        </span>
                        <span className="block text-[12.5px] text-[#0a2225]/55">
                          Lisbon · Oct 12–17 · Photography
                        </span>
                      </span>
                    </div>
                    <p className="mt-3 font-secondary text-[30px] text-[#0a2225]">$2,250</p>
                    <p className="text-[13px] text-[#0a2225]/60">5 on-trip days · your day rate</p>
                    <div className="mt-4 flex gap-2.5">
                      <span
                        className="rounded-full bg-[#0c4d47] px-5 py-2.5 text-[12px] uppercase tracking-[0.1em] text-[#E5DFC6]"
                        style={{ animation: "gsCsPulse 2.2s 1.4s infinite" }}
                      >
                        Send proposal
                      </span>
                      <span className="rounded-full border border-[#0a2225]/25 px-5 py-2.5 text-[12px] uppercase tracking-[0.1em] text-[#0a2225]">
                        View request
                      </span>
                    </div>
                  </div>
                  <div
                    className="mt-3.5 max-w-[390px] rounded-xl border border-[#E5DFC6]/25 bg-[#E5DFC6]/10 px-4 py-2.5 text-[13.5px] text-[#E5DFC6] opacity-0"
                    style={{ animation: "gsCsSlideIn .7s 1.7s forwards" }}
                  >
                    Proposal accepted — deposit paid to your account.
                  </div>
                </>
              )}

              {active === 1 && (
                <>
                  <SceneChip>Paid direct, start to finish</SceneChip>
                  <div className="max-w-[400px]">
                    {[
                      "Traveler pays the deposit",
                      "Paid straight to your Stripe account",
                      "Balance paid before departure",
                      "Trip happens",
                      "Your business, your revenue",
                    ].map((step, i) => (
                      <div
                        key={step}
                        className="flex items-center gap-3.5 py-[9px] text-[15px] text-[#E5DFC6] opacity-0"
                        style={{ animation: `gsCsLightUp .5s ${i * 0.45}s forwards` }}
                      >
                        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#C7A962] text-[12px] text-[#0a2225]">
                          ✓
                        </span>
                        {step}
                      </div>
                    ))}
                    <div className="mt-4 h-[9px] overflow-hidden rounded-full bg-[#E5DFC6]/15">
                      <span
                        className="block h-full w-0 rounded-full bg-[#C7A962]"
                        style={{ animation: "gsCsGrow 2.4s .4s forwards" }}
                      />
                    </div>
                    <p
                      className="mt-3 text-[14px] text-[#E5DFC6] opacity-0"
                      style={{ animation: "gsCsLightUp .5s 2.6s forwards" }}
                    >
                      Payout on a $2,250 trip:{" "}
                      <span className="font-secondary text-[21px] text-[#C7A962]">$2,171.25</span>
                    </p>
                  </div>
                </>
              )}

              {active === 2 && (
                <>
                  <SceneChip>Your earnings</SceneChip>
                  <p className="font-secondary text-[58px] leading-none text-[#fdfaf2] md:text-[68px]">
                    $
                    {earned.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <div className="mt-5 max-w-[380px]">
                    {[
                      ["Trip bookings", "$1,940.00"],
                      ["Guide sales", "$186.50"],
                      ["Affiliate", "$44.75"],
                    ].map(([k, v], i) => (
                      <div
                        key={k}
                        className="flex justify-between border-t border-[#E5DFC6]/15 py-2.5 text-[15px] text-[#E5DFC6] opacity-0"
                        style={{ animation: `gsCsLightUp .5s ${0.2 + i * 0.35}s forwards` }}
                      >
                        <span>{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {active === 3 && (
                <>
                  <SceneChip>Your storefront</SceneChip>
                  <div className="grid max-w-[520px] grid-cols-3 gap-3">
                    {SHELF.map((it, i) => (
                      <div
                        key={it.t}
                        className="rounded-xl bg-[#fdfaf2] p-3 opacity-0"
                        style={{ animation: `gsCsSlideIn .55s ${i * 0.22}s cubic-bezier(.2,.9,.3,1) forwards` }}
                      >
                        <img
                          src={it.img}
                          alt=""
                          loading="lazy"
                          className="mb-2 h-[46px] w-full rounded-lg object-cover md:h-[52px]"
                        />
                        <p className="text-[12.5px] font-medium leading-tight text-[#0a2225]">{it.t}</p>
                        <p className="mt-1 font-secondary text-[16px] text-[#0a2225]">{it.p}</p>
                        <p className="text-[12px] uppercase tracking-[0.12em] text-[#8D6B2F]">{it.k}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {active === 4 && (
                <>
                  <SceneChip>On location</SceneChip>
                  <div className="max-w-[500px]">
                    {CAL.map((c, i) => (
                      <div
                        key={c.d}
                        className="mt-2.5 flex items-center justify-between rounded-2xl bg-[#fdfaf2] px-5 py-3.5 opacity-0 first:mt-0"
                        style={{ animation: `gsCsCalIn .55s ${i * 0.28}s cubic-bezier(.2,.9,.3,1) forwards` }}
                      >
                        <span>
                          <span className="block font-secondary text-[18px] text-[#0a2225]">{c.d}</span>
                          <span className="block text-[12px] uppercase tracking-[0.14em] text-[#0a2225]/55">
                            {c.w}
                          </span>
                        </span>
                        <span
                          className="rounded-full bg-[#0c4d47] px-4 py-2 text-[12px] uppercase tracking-[0.1em] text-[#E5DFC6]"
                          style={i === 1 ? { animation: "gsCsPulse 2.2s 1.2s infinite" } : undefined}
                        >
                          Hire me here
                        </span>
                      </div>
                    ))}
                    <div
                      className="mt-3.5 rounded-xl border border-[#E5DFC6]/25 bg-[#E5DFC6]/10 px-4 py-2.5 text-[13.5px] text-[#E5DFC6] opacity-0"
                      style={{ animation: "gsCsLightUp .5s 1.5s forwards" }}
                    >
                      You're already going — travel's covered, the day rate is all margin.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link
            to="/auth?mode=signup&role=creator"
            className="rounded-full bg-[#0c4d47] px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.14em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
          >
            Become a creator
          </Link>
          <Link
            to="/creators"
            className="text-[14px] font-medium text-[#0c4d47] underline-offset-4 hover:underline"
          >
            See how creators use Goldsainte →
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CreatorShowcaseSection;
