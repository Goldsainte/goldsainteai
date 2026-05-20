#!/usr/bin/env node
/**
 * Lightweight per-route static <head> generator.
 *
 * For each route in ROUTES, copy dist/index.html to dist/<route>/index.html
 * with the head meta tags rewritten so that non-JS crawlers (LinkedIn, X,
 * Slack, WhatsApp, Facebook) get accurate per-page previews, and Google
 * sees accurate titles/descriptions on first crawl before JS executes.
 *
 * Body content is NOT prerendered — the SPA hydrates as normal. Auth,
 * Supabase, Stripe, and all dynamic behaviour are untouched.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const DIST = resolve("dist");
const INDEX = resolve(DIST, "index.html");
const SITE = "https://goldsainte.ai";
const OG_DEFAULT = `${SITE}/og-share.jpg?v=4`;

if (!existsSync(INDEX)) {
  console.warn("[prerender-head] dist/index.html missing — skipping (no build output)");
  process.exit(0);
}

/** @typedef {{ path:string, title:string, description:string, image?:string, type?:"website"|"article", jsonLd?:object }} Route */

/** @type {Route[]} */
const ROUTES = [
  {
    path: "/newsroom",
    title: "Goldsainte Newsroom — Travel Industry Analysis & Reports",
    description:
      "Editorial coverage on the future of travel: marketplaces, AI trip planning, creator economy, and the new luxury. Published by Goldsainte.",
    type: "website",
  },
  {
    path: "/newsroom/news/world-cup-reality-check",
    title: "The World Cup Reality Check: When Hype Meets the Hotel Bill",
    description:
      "Eighty percent of U.S. hotels say World Cup bookings are falling short — and the reason why reveals everything wrong with how we plan travel around hype.",
    image: `${SITE}/og-world-cup-reality-check.jpg`,
    type: "article",
  },
  {
    path: "/newsroom/news/state-of-the-modern-travel-marketplace",
    title: "The State of the Modern Travel Marketplace",
    description:
      "How creators, certified agents, and AI are reshaping how the next generation books extraordinary trips.",
    type: "article",
  },
  {
    path: "/how-it-works/traveler",
    title: "How Goldsainte Works for Travelers — AI Trip Planning",
    description:
      "Plan extraordinary trips with certified travel specialists and AI matching. Escrow-protected payments, on-platform collaboration, no booking surprises.",
    type: "website",
  },
  {
    path: "/how-it-works/creator",
    title: "How Goldsainte Works for Creators — Monetize Travel Content",
    description:
      "Turn your travel storyboards into bookable trips. Earn on every itinerary, package, and referral — paid via on-platform Stripe Connect.",
    type: "website",
  },
  {
    path: "/how-it-works/agent",
    title: "How Goldsainte Works for Travel Agents — Bid on Real Trips",
    description:
      "Access verified luxury travel requests. Bid, propose, and earn — all on-platform, with escrow protection and transparent 7% platform fees.",
    type: "website",
  },
  {
    path: "/marketplace",
    title: "Luxury Travel Marketplace — Curated Trips by Experts",
    description:
      "Browse curated luxury trips from certified travel specialists across 50+ countries. Request a trip, get matched, book with escrow protection.",
    type: "website",
  },
];

const baseHtml = readFileSync(INDEX, "utf8");

function stripExistingHead(html) {
  // Remove any existing title, description, canonical, OG, twitter, and Article JSON-LD tags.
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHead(route) {
  const url = `${SITE}${route.path}`;
  const image = route.image || OG_DEFAULT;
  const type = route.type || "website";
  const t = escapeHtml(route.title);
  const d = escapeHtml(route.description);
  const u = escapeHtml(url);
  const i = escapeHtml(image);

  const jsonLd =
    route.type === "article"
      ? `<script type="application/ld+json">${JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: route.title,
          description: route.description,
          image,
          url,
          publisher: {
            "@type": "Organization",
            name: "Goldsainte",
            logo: { "@type": "ImageObject", url: `${SITE}/icon-192.png` },
          },
        })}</script>`
      : "";

  return `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${u}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:image" content="${i}" />
    <meta property="og:image:secure_url" content="${i}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${i}" />
    ${jsonLd}
  `.trim();
}

let count = 0;
for (const route of ROUTES) {
  const stripped = stripExistingHead(baseHtml);
  const headInjection = buildHead(route);
  // Inject right before </head>
  const html = stripped.replace(/<\/head>/i, `${headInjection}\n  </head>`);

  const outDir = resolve(DIST, route.path.replace(/^\//, ""));
  const outFile = resolve(outDir, "index.html");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, html, "utf8");
  count++;
}

console.log(`[prerender-head] wrote ${count} per-route HTML files under dist/`);
