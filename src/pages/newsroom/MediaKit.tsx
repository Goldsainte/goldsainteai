import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, Download, ArrowUpRight } from "lucide-react";
import JSZip from "jszip";
import {
  BASE_URL,
  COMPANY_BOILERPLATE_LONG,
  COMPANY_BOILERPLATE_MEDIUM,
  COMPANY_BOILERPLATE_SHORT,
} from "./lib";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImage from "@/assets/newsroom/mediakit-hero.webp";
import signatureImage from "@/assets/newsroom/signature-andre-powell.webp";
import logomarkGold from "@/assets/newsroom/logos/logomark-gold.webp";
import logomarkGreen from "@/assets/newsroom/logos/logomark-green.webp";
import primaryHorizontalGold from "@/assets/newsroom/logos/primary-horizontal-gold.webp";
import primaryHorizontalGreen from "@/assets/newsroom/logos/primary-horizontal-green.webp";
import primaryVerticalGold from "@/assets/newsroom/logos/primary-vertical-gold.webp";
import primaryVerticalGreen from "@/assets/newsroom/logos/primary-vertical-green.webp";
import secondaryHorizontalGold from "@/assets/newsroom/logos/secondary-horizontal-gold.webp";
import secondaryHorizontalGreen from "@/assets/newsroom/logos/secondary-horizontal-green.webp";
import secondaryVerticalGold from "@/assets/newsroom/logos/secondary-vertical-gold.webp";
import secondaryVerticalGreen from "@/assets/newsroom/logos/secondary-vertical-green.webp";
import wordmarkGold from "@/assets/newsroom/logos/wordmark-gold.webp";
import wordmarkGreen from "@/assets/newsroom/logos/wordmark-green.webp";
import logomarkSealGold from "@/assets/newsroom/logos/logomark-seal-gold.webp";
import logomarkSealGreen from "@/assets/newsroom/logos/logomark-seal-green.webp";
import { newsroomPageShellClass, newsroomSectionTitleClass } from "./ui";

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

const LOGO_FILES: { src: string; filename: string }[] = [
  { src: primaryHorizontalGold, filename: "goldsainte-primary-horizontal-gold.png" },
  { src: primaryHorizontalGreen, filename: "goldsainte-primary-horizontal-green.png" },
  { src: primaryVerticalGold, filename: "goldsainte-primary-vertical-gold.png" },
  { src: primaryVerticalGreen, filename: "goldsainte-primary-vertical-green.png" },
  { src: secondaryHorizontalGold, filename: "goldsainte-secondary-horizontal-gold.png" },
  { src: secondaryHorizontalGreen, filename: "goldsainte-secondary-horizontal-green.png" },
  { src: secondaryVerticalGold, filename: "goldsainte-secondary-vertical-gold.png" },
  { src: secondaryVerticalGreen, filename: "goldsainte-secondary-vertical-green.png" },
  { src: logomarkGold, filename: "goldsainte-monogram-gold.png" },
  { src: logomarkGreen, filename: "goldsainte-monogram-green.png" },
  { src: wordmarkGold, filename: "goldsainte-wordmark-gold.png" },
  { src: wordmarkGreen, filename: "goldsainte-wordmark-green.png" },
  { src: logomarkSealGold, filename: "goldsainte-logomark-seal-gold.png" },
  { src: logomarkSealGreen, filename: "goldsainte-logomark-seal-green.png" },
];

async function downloadLogoAssets() {
  const zip = new JSZip();
  const folder = zip.folder("Goldsainte-Logo-Assets")!;
  await Promise.all(
    LOGO_FILES.map(async (f) => {
      const res = await fetch(f.src);
      const blob = await res.blob();
      folder.file(f.filename, blob);
    })
  );
  folder.file(
    "USAGE.txt",
    "Goldsainte Logo Assets\n\nUsage: Maintain minimum clear space equal to the height of the monogram. Do not recolor, distort, rotate, or apply effects. Use green marks on cream or light surfaces; use gold marks on dark or photographic backgrounds.\n\nFor SVG masters or custom formats, contact info@goldsainte.com."
  );
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Goldsainte-Logo-Assets.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
      className="group text-left rounded-sm overflow-hidden border border-[#E5DFC6] bg-white shadow-[0_8px_24px_-16px_rgba(10,34,37,0.25)] hover:shadow-[0_24px_60px_-28px_rgba(10,34,37,0.45)] hover:-translate-y-[2px] transition-all duration-500"
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
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-2">
          <button
            onClick={onCopy}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0c4d47] text-[#FDF9F0] text-[11px] tracking-[0.22em] uppercase hover:bg-[#0a3d39] transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy text"}
          </button>
          <button
            onClick={() =>
              downloadText(`Goldsainte-Boilerplate-${current.label}.txt`, current.text)
            }
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#E5DFC6] text-[#0a2225] text-[11px] tracking-[0.22em] uppercase hover:border-[#0c4d47] hover:text-[#0c4d47] transition-colors"
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
      <section className="relative h-[44vh] min-h-[300px] sm:min-h-[420px] md:h-[62vh] md:min-h-[460px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt="A cinematic luxury hotel suite at golden hour with a leather suitcase and cream cashmere throw, evoking modern global hospitality."
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2225]/40 via-[#0a2225]/25 to-[#0a2225]/80" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-5xl mx-auto w-full px-5 sm:px-6 pb-6 sm:pb-10 md:pb-20">
            <p className="text-[9px] sm:text-[10px] tracking-[0.22em] sm:tracking-[0.32em] uppercase text-[#C7A962] mb-3 sm:mb-5">
              Goldsainte Newsroom · Media Kit
            </p>
            <h1 className="font-secondary text-[28px] sm:text-[34px] md:text-5xl text-[#FDF9F0] max-w-[14ch] sm:max-w-xl md:max-w-2xl leading-[1.02] md:leading-[1.1]">
              Brand Assets &amp; Editorial Resources
            </h1>
            <p className="mt-4 sm:mt-5 max-w-md sm:max-w-lg text-[#FDF9F0]/82 text-[14px] sm:text-sm md:text-base leading-[1.55] sm:leading-[1.65]">
              Approved logos, executive imagery, editorial assets, and brand materials
              for media and press use.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <a
                href="#press-packs"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-full bg-[#0c4d47] text-[#FDF9F0] text-[10px] tracking-[0.18em] sm:tracking-[0.24em] uppercase hover:bg-[#0a3d39] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download press packs
              </a>
              <a
                href="mailto:info@goldsainte.com?subject=Goldsainte%20Media%20Kit%20Request"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-full border border-[#FDF9F0]/35 text-[#FDF9F0] text-[10px] tracking-[0.18em] sm:tracking-[0.24em] uppercase hover:border-[#FDF9F0] transition-colors"
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
        <section className={`${newsroomPageShellClass} pt-8 sm:pt-10 md:py-28`}>
          <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start">
            <div className="md:col-span-4">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                01 — The Kit
              </p>
            </div>
            <div className="md:col-span-8">
              <p className="font-secondary text-[24px] md:text-3xl text-[#0a2225] leading-[1.3]">
                Everything an editor, producer, or journalist needs to write about
                Goldsainte with accuracy and visual integrity — in one place.
              </p>
              <p className="text-base text-[#0a2225]/70 mt-6 leading-relaxed max-w-2xl">
                The materials below are pre-approved for editorial use. For interviews,
                speaking requests, or custom assets, contact{" "}
                <a className="text-[#0c4d47] underline underline-offset-4" href="mailto:info@goldsainte.com">
                  info@goldsainte.com
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="h-px bg-[#E5DFC6]" />
        </div>

        {/* LOGOS */}
        <section className={`${newsroomPageShellClass} pt-8 sm:pt-10 md:py-28`}>
          <div className="mb-12 max-w-3xl">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
              02 — Identity
            </p>
            <h2 className={`${newsroomSectionTitleClass} mt-3`}>
              Logo
            </h2>
            <p className="text-base text-[#0a2225]/70 mt-4 leading-relaxed">
              The Goldsainte mark is provided in primary, secondary, wordmark, and
              monogram configurations — each in forest green and gold. Please use
              the marks as supplied, without recoloring, distortion, or effects.
            </p>
          </div>

          <div className="rounded-sm border border-[#E5DFC6] bg-[#FDF9F0] p-6 sm:p-8 md:p-20 flex items-center justify-center">
            <img
              src={primaryHorizontalGreen}
              alt="Goldsainte primary horizontal logo in forest green."
              className="max-h-16 md:max-h-20 w-auto"
              loading="lazy"
            />
          </div>

          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-x-8 sm:gap-y-4">
            <button
              onClick={() => {
                toast.promise(downloadLogoAssets(), {
                  loading: "Preparing logo assetsâ€¦",
                  success: "Logo assets downloaded",
                  error: "Download failed. Please try again.",
                });
              }}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0c4d47] text-[#FDF9F0] text-[11px] tracking-[0.22em] uppercase hover:bg-[#0a3d39] transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download Logo Assets
            </button>
            <a
              href="mailto:info@goldsainte.com?subject=Logo%20request%20(SVG)"
              className="inline-flex w-full sm:w-auto items-center justify-center sm:justify-start gap-2 text-[11px] tracking-[0.22em] uppercase text-[#0c4d47] hover:underline underline-offset-4"
            >
              Request SVG masters
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        {/* COLOR */}
        <section className="bg-white/60 border-y border-[#E5DFC6]">
          <div className={`${newsroomPageShellClass} py-10 md:py-28`}>
            <div className="mb-12">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                03 — Palette
              </p>
              <h2 className={`${newsroomSectionTitleClass} mt-3`}>
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
        <section className={`${newsroomPageShellClass} py-10 md:py-28`}>
          <div className="mb-12">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
              04 — Typography
            </p>
              <h2 className={`${newsroomSectionTitleClass} mt-3`}>
              Editorial Voice in Practice
            </h2>
          </div>

          <div className="border border-[#E5DFC6] bg-white/60 rounded-sm p-5 sm:p-8 md:p-14 space-y-10 md:space-y-12">
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
              <h3 className="font-secondary text-[30px] sm:text-4xl md:text-6xl leading-[1.05] text-[#0a2225]">
                Travel doesn&apos;t belong to algorithms.
              </h3>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#0a2225]/45">
                Standfirst · Editorial subhead
              </p>
              <p className="font-secondary text-[20px] md:text-2xl leading-[1.4] text-[#0a2225]/85 max-w-2xl">
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
              <blockquote className="font-secondary text-[24px] md:text-3xl leading-[1.3] text-[#0c4d47] max-w-3xl">
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
          <div className={`${newsroomPageShellClass} py-10 md:py-28`}>
            <div className="mb-10">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                05 — Boilerplate
              </p>
              <h2 className={`${newsroomSectionTitleClass} mt-3`}>
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

        {/* PRESS PACKS */}
        <section
          id="press-packs"
          className="bg-white/60 border-y border-[#E5DFC6]"
        >
          <div className={`${newsroomPageShellClass} py-10 md:py-28`}>
            <div className="mb-12">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                06 — Downloads
              </p>
              <h2 className={`${newsroomSectionTitleClass} mt-3`}>
                Press Packs
              </h2>
              <p className="text-base text-[#0a2225]/70 mt-4 max-w-2xl leading-relaxed">
                Curated archives for journalists, broadcasters, and editorial
                partners. Email{" "}
                <a className="text-[#0c4d47] underline underline-offset-4" href="mailto:info@goldsainte.com">
                  info@goldsainte.com
                </a>{" "}
                to receive the latest packs directly.
              </p>
            </div>
            <Accordion
              type="single"
              collapsible
              className="border-t border-[#E5DFC6]"
            >
              {PRESS_PACKS.map((p) => (
                <AccordionItem
                  key={p.title}
                  value={p.title}
                  className="border-b border-[#E5DFC6]"
                >
                  <AccordionTrigger className="py-6 hover:no-underline group">
                    <div className="flex items-center justify-between w-full gap-6 pr-4">
                      <div className="flex items-baseline gap-5 text-left">
                        <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#C7A962] w-8 shrink-0">
                          {String(PRESS_PACKS.indexOf(p) + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">
                          {p.title}
                        </h3>
                      </div>
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#0a2225]/45 hidden sm:inline">
                        {p.type}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-8">
                    <div className="pl-0 sm:pl-[52px] grid md:grid-cols-12 gap-6 items-start">
                      <p className="md:col-span-8 text-base text-[#0a2225]/75 leading-relaxed">
                        {p.desc}
                      </p>
                      <div className="md:col-span-4 flex md:justify-end">
                        <a
                          href={`mailto:info@goldsainte.com?subject=${encodeURIComponent(
                            `Request: ${p.title}`,
                          )}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0c4d47] text-[#FDF9F0] text-[11px] tracking-[0.22em] uppercase hover:bg-[#0a3d39] transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Request {p.type}
                        </a>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* EDITORIAL FOOTER */}
        <section className="bg-[#FDF9F0]">
          <div className={`${newsroomPageShellClass} py-10 md:py-28`}>
            <div className="h-px bg-[#E5DFC6] mb-12 md:mb-20" />
            <div className="grid md:grid-cols-12 gap-10 items-start">
              <div className="md:col-span-7 space-y-6">
                <p className="text-[11px] tracking-[0.28em] uppercase text-[#C7A962]">
                  07 — For the Press
                </p>
                <h2 className="font-secondary text-[28px] md:text-5xl leading-[1.08] text-[#0a2225]">
                  For media inquiries, interviews, and founder commentary.
                </h2>
                <p className="text-base text-[#0a2225]/70 leading-relaxed max-w-xl">
                  Our newsroom team typically responds within one business day. For
                  time-sensitive editorial deadlines, please note the publication
                  date in your subject line.
                </p>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-2">
                  <a
                    href="mailto:info@goldsainte.com?subject=Press%20inquiry"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0c4d47] text-[#FDF9F0] text-[11px] tracking-[0.22em] uppercase hover:bg-[#0a3d39] transition-colors"
                  >
                    info@goldsainte.com
                  </a>
                  <Link
                    to="/newsroom"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#E5DFC6] text-[#0a2225] text-[11px] tracking-[0.22em] uppercase hover:border-[#0c4d47] hover:text-[#0c4d47] transition-colors"
                  >
                    Return to newsroom
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <div className="md:col-span-5 md:pl-10 md:border-l border-[#E5DFC6] space-y-6 text-sm text-[#0a2225]/70 leading-relaxed">
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
                  <div style={{ mixBlendMode: "multiply" }}>
                    <img
                      src={signatureImage}
                      alt="Signature of Andre C. Powell, Jr., Founder & CEO of Goldsainte"
                      className="h-20 w-auto -ml-2 select-none"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}