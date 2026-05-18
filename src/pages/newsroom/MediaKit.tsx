import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, Download, ArrowUpRight } from "lucide-react";
import {
  BASE_URL,
  COMPANY_BOILERPLATE_LONG,
  COMPANY_BOILERPLATE_MEDIUM,
  COMPANY_BOILERPLATE_SHORT,
} from "./lib";
import heroImage from "@/assets/newsroom/mediakit-hero.jpg";
import worldImage1 from "@/assets/newsroom/mediakit-world-1.jpg";
import worldImage2 from "@/assets/newsroom/mediakit-world-2.jpg";
import worldImage3 from "@/assets/newsroom/mediakit-world-3.jpg";
import founderImage from "@/assets/newsroom/inline-founder-desk.jpg";
import logomarkGold from "@/assets/newsroom/logos/logomark-gold.png";
import logomarkGreen from "@/assets/newsroom/logos/logomark-green.png";
import primaryHorizontalGold from "@/assets/newsroom/logos/primary-horizontal-gold.png";
import primaryHorizontalGreen from "@/assets/newsroom/logos/primary-horizontal-green.png";
import primaryVerticalGold from "@/assets/newsroom/logos/primary-vertical-gold.png";
import primaryVerticalGreen from "@/assets/newsroom/logos/primary-vertical-green.png";
import secondaryHorizontalGold from "@/assets/newsroom/logos/secondary-horizontal-gold.png";
import secondaryHorizontalGreen from "@/assets/newsroom/logos/secondary-horizontal-green.png";
import secondaryVerticalGold from "@/assets/newsroom/logos/secondary-vertical-gold.png";
import secondaryVerticalGreen from "@/assets/newsroom/logos/secondary-vertical-green.png";

const COLORS = [
  { name: "Cream", role: "Primary surface", hex: "#FDF9F0", text: "#0a2225" },
  { name: "Ink", role: "Editorial text", hex: "#0a2225", text: "#FDF9F0" },
  { name: "Forest", role: "Signature accent", hex: "#0c4d47", text: "#FDF9F0" },
  { name: "Gold", role: "Editorial highlight", hex: "#C7A962", text: "#0a2225" },
];

const BOILERPLATES = {
  short: {
    label: "Short",
    meta: "~30 words · social, captions, citations",
    text: COMPANY_BOILERPLATE_SHORT,
  },
  press: {
    label: "Press",
    meta: "~50 words · press releases, media inclusion",
    text: COMPANY_BOILERPLATE_MEDIUM,
  },
  investor: {
    label: "Investor",
    meta: "~100 words · long-form coverage, decks, profiles",
    text: COMPANY_BOILERPLATE_LONG,
  },
  founder: {
    label: "Founder",
    meta: "Attributed quote · op-eds, interviews, founder profiles",
    text:
      '"Modern travelers do not just want another booking engine. They want perspective, taste, and a person who actually knows the place. Goldsainte was built to bring that human craft back into travel — at the scale and speed the modern world expects." — Andre C. Powell, Jr., Founder & CEO of Goldsainte.',
  },
};

type BoilerKey = keyof typeof BOILERPLATES;

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const PRESS_PACKS = [
  {
    title: "Press Kit",
    desc: "Full editorial brief, fact sheet, founder bio, and approved boilerplate.",
    file: "Goldsainte-Press-Kit.pdf",
    type: "PDF",
  },
  {
    title: "Founder Bio",
    desc: "Long-form biography and approved talking points for Andre C. Powell, Jr.",
    file: "Goldsainte-Founder-Bio.pdf",
    type: "PDF",
  },
  {
    title: "Logo Suite",
    desc: "Wordmark and monogram in light and dark, SVG and PNG.",
    file: "Goldsainte-Logo-Suite.zip",
    type: "ZIP",
  },
  {
    title: "Executive Headshots",
    desc: "High-resolution founder portraits for editorial and broadcast.",
    file: "Goldsainte-Headshots.zip",
    type: "ZIP",
  },
  {
    title: "Product Imagery",
    desc: "Approved marketplace UI screenshots and product visuals.",
    file: "Goldsainte-Product-Imagery.zip",
    type: "ZIP",
  },
];

type LogoAsset = {
  src: string;
  alt: string;
  label: string;
  variant: "Gold" | "Green";
  filename: string;
  bg: "light" | "dark";
  fit: "wide" | "tall" | "square";
};

const LOGO_GROUPS: { title: string; subtitle: string; items: LogoAsset[] }[] = [
  {
    title: "Primary Logo · Horizontal",
    subtitle: "Default lockup for editorial layouts, headers, and partner placements.",
    items: [
      { src: primaryHorizontalGold, alt: "Goldsainte primary horizontal logo in gold.", label: "Primary Horizontal", variant: "Gold", filename: "goldsainte-primary-horizontal-gold.png", bg: "dark", fit: "wide" },
      { src: primaryHorizontalGreen, alt: "Goldsainte primary horizontal logo in forest green.", label: "Primary Horizontal", variant: "Green", filename: "goldsainte-primary-horizontal-green.png", bg: "light", fit: "wide" },
    ],
  },
  {
    title: "Primary Logo · Vertical",
    subtitle: "Stacked lockup for portrait formats, covers, and centered compositions.",
    items: [
      { src: primaryVerticalGold, alt: "Goldsainte primary vertical logo in gold.", label: "Primary Vertical", variant: "Gold", filename: "goldsainte-primary-vertical-gold.png", bg: "dark", fit: "tall" },
      { src: primaryVerticalGreen, alt: "Goldsainte primary vertical logo in forest green.", label: "Primary Vertical", variant: "Green", filename: "goldsainte-primary-vertical-green.png", bg: "light", fit: "tall" },
    ],
  },
  {
    title: "Secondary Logo · Horizontal",
    subtitle: "Refined horizontal lockup without the surrounding seal.",
    items: [
      { src: secondaryHorizontalGold, alt: "Goldsainte secondary horizontal logo in gold.", label: "Secondary Horizontal", variant: "Gold", filename: "goldsainte-secondary-horizontal-gold.png", bg: "dark", fit: "wide" },
      { src: secondaryHorizontalGreen, alt: "Goldsainte secondary horizontal logo in forest green.", label: "Secondary Horizontal", variant: "Green", filename: "goldsainte-secondary-horizontal-green.png", bg: "light", fit: "wide" },
    ],
  },
  {
    title: "Secondary Logo · Vertical",
    subtitle: "Stacked monogram and wordmark without the surrounding seal.",
    items: [
      { src: secondaryVerticalGold, alt: "Goldsainte secondary vertical logo in gold.", label: "Secondary Vertical", variant: "Gold", filename: "goldsainte-secondary-vertical-gold.png", bg: "dark", fit: "tall" },
      { src: secondaryVerticalGreen, alt: "Goldsainte secondary vertical logo in forest green.", label: "Secondary Vertical", variant: "Green", filename: "goldsainte-secondary-vertical-green.png", bg: "light", fit: "tall" },
    ],
  },
  {
    title: "Monogram",
    subtitle: "Standalone seal for avatars, favicons, app icons, and tight crops.",
    items: [
      { src: logomarkGold, alt: "Goldsainte monogram in gold.", label: "Monogram", variant: "Gold", filename: "goldsainte-monogram-gold.png", bg: "dark", fit: "square" },
      { src: logomarkGreen, alt: "Goldsainte monogram in forest green.", label: "Monogram", variant: "Green", filename: "goldsainte-monogram-green.png", bg: "light", fit: "square" },
    ],
  },
];

function LogoTile({ asset }: { asset: LogoAsset }) {
  const isDark = asset.bg === "dark";
  const aspect =
    asset.fit === "square" ? "aspect-square" : asset.fit === "tall" ? "aspect-[3/4]" : "aspect-[5/2]";
  const maxH =
    asset.fit === "square" ? "max-h-20" : asset.fit === "tall" ? "max-h-32" : "max-h-12";
  return (
    <div className="group rounded-sm overflow-hidden border border-[#0a2225]/10 bg-white shadow-[0_8px_24px_-18px_rgba(10,34,37,0.25)] hover:shadow-[0_24px_60px_-28px_rgba(10,34,37,0.4)] transition-all duration-500">
      <div
        className={`relative ${aspect} flex items-center justify-center px-10 md:px-16 py-10 ${
          isDark ? "bg-[#0a2225]" : "bg-[#FDF9F0]"
        }`}
      >
        <span
          className="absolute top-3 left-3 text-[9px] tracking-[0.28em] uppercase"
          style={{ color: isDark ? "rgba(253,249,240,0.55)" : "rgba(10,34,37,0.45)" }}
        >
          {asset.label} · {asset.variant}
        </span>
        <img
          src={asset.src}
          alt={asset.alt}
          className={`${maxH} max-w-full object-contain`}
          loading="lazy"
        />
      </div>
      <div className="flex items-center justify-between px-5 py-4 bg-[#FDF9F0] border-t border-[#0a2225]/10">
        <span className="text-[10px] tracking-[0.25em] uppercase text-[#0a2225]/60">
          PNG · {asset.variant}
        </span>
        <a
          href={asset.src}
          download={asset.filename}
          className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase text-[#0c4d47] hover:text-[#0a2225] transition-colors"
        >
          <Download className="h-3 w-3" />
          Download
        </a>
      </div>
    </div>
  );
}

function ColorCard({ c }: { c: typeof COLORS[number] }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(c.hex).then(() => {
      setCopied(true);
      toast.success(`${c.name} ${c.hex} copied`);
      setTimeout(() => setCopied(false), 1600);
    });
  };
  return (
    <button
      onClick={onCopy}
      className="group text-left rounded-sm overflow-hidden border border-[#0a2225]/10 bg-white shadow-[0_8px_24px_-16px_rgba(10,34,37,0.25)] hover:shadow-[0_24px_60px_-28px_rgba(10,34,37,0.45)] hover:-translate-y-[2px] transition-all duration-500"
    >
      <div
        className="aspect-[5/6] relative"
        style={{ background: c.hex }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
        <div
          className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] tracking-[0.25em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ color: c.text }}
        >
          <span>{copied ? "Copied" : "Click to copy"}</span>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </div>
      </div>
      <div className="p-5 bg-[#FDF9F0]">
        <p className="font-secondary text-xl text-[#0a2225]">{c.name}</p>
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#0a2225]/50 mt-1">
          {c.role}
        </p>
        <p className="text-xs text-[#0a2225]/70 font-mono mt-3">{c.hex}</p>
      </div>
    </button>
  );
}

function BoilerplatePanel() {
  const [tab, setTab] = useState<BoilerKey>("short");
  const [copied, setCopied] = useState(false);
  const current = BOILERPLATES[tab];

  const onCopy = () => {
    navigator.clipboard.writeText(current.text).then(() => {
      setCopied(true);
      toast.success(`${current.label} boilerplate copied`);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="border border-[#E5DFC6] bg-white/60 backdrop-blur-sm rounded-sm overflow-hidden">
      <div className="flex flex-wrap border-b border-[#E5DFC6]">
        {(Object.keys(BOILERPLATES) as BoilerKey[]).map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 md:px-6 py-4 text-[11px] tracking-[0.22em] uppercase transition-colors duration-300 ${
                active
                  ? "text-[#0c4d47] bg-[#FDF9F0] border-b-2 border-[#C7A962] -mb-px"
                  : "text-[#0a2225]/55 hover:text-[#0a2225]"
              }`}
            >
              {BOILERPLATES[key].label}
            </button>
          );
        })}
      </div>
      <div className="p-7 md:p-10 space-y-6">
        <p className="text-[11px] tracking-[0.22em] uppercase text-[#C7A962]">
          {current.meta}
        </p>
        <p className="font-secondary text-lg md:text-xl leading-[1.7] text-[#0a2225]/90">
          {current.text}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0c4d47] text-[#FDF9F0] text-[11px] tracking-[0.22em] uppercase hover:bg-[#0a3d39] transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy text"}
          </button>
          <button
            onClick={() =>
              downloadText(`Goldsainte-Boilerplate-${current.label}.txt`, current.text)
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#0a2225]/20 text-[#0a2225] text-[11px] tracking-[0.22em] uppercase hover:border-[#0c4d47] hover:text-[#0c4d47] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download .txt
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaKit() {
  return (
    <>
      <Helmet>
        <title>Media Kit | Goldsainte Newsroom</title>
        <meta
          name="description"
          content="Brand assets, executive imagery, editorial typography, approved boilerplate, and press packs for media covering Goldsainte."
        />
        <link rel="canonical" href={`${BASE_URL}/newsroom/media-kit`} />
      </Helmet>

      {/* HERO */}
      <section className="relative h-[70vh] min-h-[520px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt="A cinematic luxury hotel suite at golden hour with a leather suitcase and cream cashmere throw, evoking modern global hospitality."
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2225]/55 via-[#0a2225]/35 to-[#0a2225]/75" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto w-full px-6 pb-16 md:pb-24">
            <p className="text-[11px] tracking-[0.32em] uppercase text-[#C7A962] mb-6">
              Goldsainte Newsroom · Media Kit
            </p>
            <h1 className="font-secondary text-4xl md:text-6xl text-[#FDF9F0] max-w-3xl leading-[1.05]">
              Brand Assets &amp; Editorial Resources
            </h1>
            <p className="mt-6 max-w-xl text-[#FDF9F0]/80 text-base md:text-lg leading-relaxed">
              Approved logos, executive imagery, editorial assets, and brand materials
              for media and press use.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#press-packs"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FDF9F0] text-[#0a2225] text-[11px] tracking-[0.22em] uppercase hover:bg-white transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download press packs
              </a>
              <a
                href="mailto:press@goldsainte.ai?subject=Goldsainte%20Media%20Kit%20Request"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#FDF9F0]/40 text-[#FDF9F0] text-[11px] tracking-[0.22em] uppercase hover:border-[#FDF9F0] transition-colors"
              >
                Request full archive
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-[#FDF9F0]">
        {/* INTRO */}
        <section className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-4">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                01 — The Kit
              </p>
            </div>
            <div className="md:col-span-8">
              <p className="font-secondary text-2xl md:text-3xl text-[#0a2225] leading-[1.35]">
                Everything an editor, producer, or journalist needs to write about
                Goldsainte with accuracy and visual integrity — in one place.
              </p>
              <p className="text-base text-[#0a2225]/70 mt-6 leading-relaxed max-w-2xl">
                The materials below are pre-approved for editorial use. For interviews,
                speaking requests, or custom assets, contact{" "}
                <a className="text-[#0c4d47] underline underline-offset-4" href="mailto:press@goldsainte.ai">
                  press@goldsainte.ai
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-6">
          <div className="h-px bg-[#E5DFC6]" />
        </div>

        {/* LOGOS */}
        <section className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                02 — Identity
              </p>
              <h2 className="font-secondary text-2xl md:text-3xl mt-3 text-[#0a2225]">
                Logo Suite
              </h2>
              <p className="text-base text-[#0a2225]/70 mt-4 max-w-2xl leading-relaxed">
                The complete Goldsainte mark in primary, secondary, and monogram
                configurations — each in forest green and gold. Click any logo to
                download the PNG.
              </p>
            </div>
            <a
              href="mailto:press@goldsainte.ai?subject=Logo%20suite%20request%20(SVG)"
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-[#0c4d47] hover:underline underline-offset-4"
            >
              <Download className="h-3.5 w-3.5" />
              Request SVG &amp; full ZIP
            </a>
          </div>

          <div className="space-y-14">
            {LOGO_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="mb-5 flex items-baseline justify-between gap-6">
                  <div>
                    <h3 className="font-secondary text-xl text-[#0a2225]">
                      {group.title}
                    </h3>
                    <p className="text-sm text-[#0a2225]/60 mt-1 max-w-xl leading-relaxed">
                      {group.subtitle}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {group.items.map((item) => (
                    <LogoTile key={item.filename} asset={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-[#0a2225]/55 mt-10 max-w-2xl leading-relaxed">
            Usage: maintain minimum clear space equal to the height of the monogram.
            Do not recolor, distort, rotate, or apply effects. Use the green marks
            on cream or light surfaces, and the gold marks on dark or photographic
            backgrounds. SVG masters and additional formats available on request.
          </p>
        </section>

        {/* COLOR */}
        <section className="bg-white/60 border-y border-[#E5DFC6]">
          <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
            <div className="mb-12">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                03 — Palette
              </p>
              <h2 className="font-secondary text-2xl md:text-3xl mt-3 text-[#0a2225]">
                The Goldsainte Palette
              </h2>
              <p className="text-base text-[#0a2225]/70 mt-4 max-w-2xl leading-relaxed">
                Cream as the canvas. Ink as the voice. Forest as the signature.
                Gold as the moment of light. Click any color to copy its value.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {COLORS.map((c) => (
                <ColorCard key={c.hex} c={c} />
              ))}
            </div>
          </div>
        </section>

        {/* TYPOGRAPHY SHOWCASE */}
        <section className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <div className="mb-12">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
              04 — Typography
            </p>
            <h2 className="font-secondary text-2xl md:text-3xl mt-3 text-[#0a2225]">
              Editorial Voice in Practice
            </h2>
          </div>

          <div className="border border-[#E5DFC6] bg-white/60 rounded-sm p-8 md:p-14 space-y-12">
            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#0a2225]/45">
                Eyebrow · Section label
              </p>
              <p className="text-[11px] tracking-[0.32em] uppercase text-[#C7A962]">
                The Modern Travel Marketplace
              </p>
            </div>

            <div className="h-px bg-[#E5DFC6]" />

            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#0a2225]/45">
                Display headline · Serif
              </p>
              <h3 className="font-secondary text-4xl md:text-6xl leading-[1.05] text-[#0a2225]">
                Travel doesn&apos;t belong to algorithms.
              </h3>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#0a2225]/45">
                Standfirst · Editorial subhead
              </p>
              <p className="font-secondary text-xl md:text-2xl leading-[1.45] text-[#0a2225]/85 max-w-2xl">
                It belongs to the people who actually know the place — and to the
                travelers willing to trust them.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#0a2225]/45">
                  Body · Sans
                </p>
                <p className="text-base leading-[1.75] text-[#0a2225]/80">
                  Goldsainte was founded on a simple instinct: the most memorable
                  trips are still the ones built by a person who has lived the
                  destination. The platform pairs that human craft with modern
                  speed, transparency, and protection.
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#0a2225]/45">
                  Metadata · Caption
                </p>
                <p className="text-xs tracking-wide text-[#0a2225]/55 leading-relaxed">
                  Charlotte, NC · Founded 2024 · AI-powered travel marketplace ·
                  Vetted creators and independent agents · On-platform booking and
                  protection.
                </p>
              </div>
            </div>

            <div className="h-px bg-[#E5DFC6]" />

            <div className="space-y-4">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#0a2225]/45">
                Pull quote
              </p>
              <blockquote className="font-secondary text-2xl md:text-3xl leading-[1.4] text-[#0c4d47] max-w-3xl">
                <span className="text-[#C7A962] mr-1">&ldquo;</span>
                Extraordinary travel begins with perspective.
                <span className="text-[#C7A962] ml-1">&rdquo;</span>
              </blockquote>
              <div className="w-10 h-px bg-[#C7A962]" />
            </div>
          </div>
        </section>

        {/* BOILERPLATE */}
        <section className="bg-white/60 border-y border-[#E5DFC6]">
          <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
            <div className="mb-10">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                05 — Boilerplate
              </p>
              <h2 className="font-secondary text-2xl md:text-3xl mt-3 text-[#0a2225]">
                Approved Company Language
              </h2>
              <p className="text-base text-[#0a2225]/70 mt-4 max-w-2xl leading-relaxed">
                Four pre-approved versions for different editorial contexts. Tap a
                tab, copy, or download as a text file.
              </p>
            </div>
            <BoilerplatePanel />
          </div>
        </section>

        {/* FOUNDER */}
        <section className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-5">
              <div className="aspect-[4/5] overflow-hidden rounded-sm border border-[#E5DFC6] shadow-[0_20px_50px_-20px_rgba(10,34,37,0.25)]">
                <img
                  src={founderImage}
                  alt="Andre C. Powell, Jr., founder and CEO of Goldsainte."
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="md:col-span-7">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                06 — Executive Imagery
              </p>
              <h2 className="font-secondary text-2xl md:text-3xl mt-3 text-[#0a2225]">
                Andre C. Powell, Jr.
              </h2>
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#0a2225]/55 mt-2">
                Founder &amp; Chief Executive Officer
              </p>
              <p className="text-base text-[#0a2225]/75 mt-6 leading-relaxed">
                High-resolution editorial portraits, broadcast-ready headshots, and
                approved short and long-form biographies are available for press
                profiles, interviews, and panel materials.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="mailto:press@goldsainte.ai?subject=Founder%20headshots%20request"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0c4d47] text-[#FDF9F0] text-[11px] tracking-[0.22em] uppercase hover:bg-[#0a3d39] transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Request headshot pack
                </a>
                <Link
                  to="/newsroom/leadership"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#0a2225]/20 text-[#0a2225] text-[11px] tracking-[0.22em] uppercase hover:border-[#0c4d47] hover:text-[#0c4d47] transition-colors"
                >
                  Founder profile
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PRESS PACKS */}
        <section
          id="press-packs"
          className="bg-[#0a2225] text-[#FDF9F0]"
        >
          <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
            <div className="mb-12">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                07 — Downloads
              </p>
              <h2 className="font-secondary text-2xl md:text-3xl mt-3 text-[#FDF9F0]">
                Press Packs
              </h2>
              <p className="text-base text-[#FDF9F0]/70 mt-4 max-w-2xl leading-relaxed">
                Curated archives for journalists, broadcasters, and editorial
                partners. Email{" "}
                <a className="text-[#C7A962] underline underline-offset-4" href="mailto:press@goldsainte.ai">
                  press@goldsainte.ai
                </a>{" "}
                to receive the latest packs directly.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-px bg-[#FDF9F0]/10 border border-[#FDF9F0]/10">
              {PRESS_PACKS.map((p) => (
                <a
                  key={p.title}
                  href={`mailto:press@goldsainte.ai?subject=${encodeURIComponent(
                    `Request: ${p.title}`,
                  )}`}
                  className="group bg-[#0a2225] p-7 md:p-9 hover:bg-[#0c4d47] transition-colors duration-500 flex flex-col justify-between gap-8 min-h-[180px]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-secondary text-xl md:text-2xl text-[#FDF9F0]">
                        {p.title}
                      </h3>
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#C7A962] mt-1.5">
                        {p.type}
                      </span>
                    </div>
                    <p className="text-sm text-[#FDF9F0]/65 leading-relaxed mt-3">
                      {p.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] tracking-[0.22em] uppercase text-[#FDF9F0]/70 group-hover:text-[#FDF9F0]">
                    <span>{p.file}</span>
                    <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* BRAND WORLD */}
        <section className="bg-[#FDF9F0]">
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
            <div className="grid md:grid-cols-12 gap-10 mb-14 items-end">
              <div className="md:col-span-5">
                <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                  08 — Brand World
                </p>
                <h2 className="font-secondary text-2xl md:text-3xl mt-3 text-[#0a2225]">
                  The Goldsainte Atmosphere
                </h2>
              </div>
              <div className="md:col-span-7">
                <p className="text-base text-[#0a2225]/75 leading-relaxed max-w-xl">
                  Light, texture, and quiet detail — a visual language drawn from the
                  destinations and rituals we curate. Use these references when
                  approximating the Goldsainte mood in editorial layouts.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-4 md:gap-6">
              <div className="md:col-span-7 md:row-span-2">
                <div className="overflow-hidden rounded-sm border border-[#E5DFC6] aspect-[4/5] md:aspect-auto md:h-full">
                  <img
                    src={worldImage1}
                    alt="Sun-drenched Mediterranean villa terrace with linen drapes and olive trees at golden hour."
                    className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="md:col-span-5">
                <div className="overflow-hidden rounded-sm border border-[#E5DFC6] aspect-[4/3]">
                  <img
                    src={worldImage2}
                    alt="An aged leather travel journal, antique brass compass, and silk scarf on a dark walnut desk."
                    className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="md:col-span-5">
                <div className="overflow-hidden rounded-sm border border-[#E5DFC6] aspect-[4/3]">
                  <img
                    src={worldImage3}
                    alt="A black car arriving at a grand hotel at dusk, warm lobby light spilling onto rain-wet cobblestones."
                    className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            <blockquote className="mt-20 text-center max-w-3xl mx-auto">
              <span className="block w-10 h-px bg-[#C7A962] mx-auto mb-8" />
              <p className="font-secondary text-2xl md:text-3xl leading-[1.4] text-[#0c4d47]">
                Built for travelers who notice the difference between a destination
                and an experience.
              </p>
              <span className="block w-10 h-px bg-[#C7A962] mx-auto mt-8" />
            </blockquote>
          </div>
        </section>

        {/* EDITORIAL FOOTER */}
        <section className="bg-[#0c4d47] text-[#FDF9F0]">
          <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
            <div className="grid md:grid-cols-12 gap-10 items-start">
              <div className="md:col-span-7 space-y-6">
                <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                  For the Press
                </p>
                <h2 className="font-secondary text-3xl md:text-5xl leading-[1.1]">
                  For media inquiries, interviews, and founder commentary.
                </h2>
                <p className="text-base text-[#FDF9F0]/75 leading-relaxed max-w-xl">
                  Our newsroom team typically responds within one business day. For
                  time-sensitive editorial deadlines, please note the publication
                  date in your subject line.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href="mailto:press@goldsainte.ai?subject=Press%20inquiry"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FDF9F0] text-[#0c4d47] text-[11px] tracking-[0.22em] uppercase hover:bg-white transition-colors"
                  >
                    press@goldsainte.ai
                  </a>
                  <Link
                    to="/newsroom"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#FDF9F0]/40 text-[#FDF9F0] text-[11px] tracking-[0.22em] uppercase hover:border-[#FDF9F0] transition-colors"
                  >
                    Return to newsroom
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <div className="md:col-span-5 md:pl-10 md:border-l border-[#FDF9F0]/15 space-y-6 text-sm text-[#FDF9F0]/70 leading-relaxed">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#C7A962] mb-2">
                    Headquarters
                  </p>
                  <p>Charlotte, North Carolina · United States</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#C7A962] mb-2">
                    Founder &amp; CEO
                  </p>
                  <p>Andre C. Powell, Jr.</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#C7A962] mb-2">
                    Signed
                  </p>
                  <p className="font-secondary italic text-lg text-[#FDF9F0]/90">
                    Andre C. Powell, Jr.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}