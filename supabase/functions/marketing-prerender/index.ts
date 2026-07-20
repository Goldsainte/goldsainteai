// Returns prerendered HTML for key marketing pages so search-engine
// crawlers always get fully-rendered content with proper meta tags,
// even if the SPA throws during render. Real users (non-bot UA) are
// routed past this by the Cloudflare Worker.
//
// Usage: GET /functions/v1/marketing-prerender?path=/

const BASE_URL = "https://goldsainte.ai";
const DEFAULT_OG = `${BASE_URL}/og-share.jpg?v=4`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type PageMeta = {
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: { heading: string; body: string; links?: { label: string; href: string }[] }[];
};

const PAGES: Record<string, PageMeta> = {
  "/": {
    title: "Goldsainte — The Smarter Travel Marketplace",
    description:
      "Plan, discover, and book extraordinary trips with certified travel specialists and explorers across 50+ countries. Powered by AI, built around you.",
    h1: "The Smarter Travel Marketplace",
    intro:
      "Goldsainte connects discerning travelers with certified specialists and travel creators across more than 50 countries. Plan, discover, and book extraordinary journeys on one intelligent platform — with on-platform payments, vetted experts, and transparent pricing.",
    sections: [
      {
        heading: "For Travelers",
        body: "Tell us what you're dreaming of. Receive curated proposals from vetted travel agents and trusted creators, compare side by side, and book securely on-platform.",
        links: [
          { label: "Browse Trips", href: "/marketplace" },
          { label: "Request a Trip", href: "/marketplace" },
          { label: "How it works", href: "/what-we-do" },
        ],
      },
      {
        heading: "For Travel Agents",
        body: "Access a continuous pipeline of qualified, high-intent travel requests. Bid on briefs, manage proposals end-to-end, and grow your book of business through our marketplace.",
        links: [
          { label: "Apply as an Agent", href: "/apply/agent" },
          { label: "Agent Earnings", href: "/help" },
        ],
      },
      {
        heading: "For Travel Creators",
        body: "Turn your audience into bookings. Publish storyboards, packaged trips, and concierge services. Goldsainte handles payments, contracts, and trust so you can focus on storytelling.",
        links: [
          { label: "Explore Creators", href: "/creators" },
          { label: "Creator Program", href: "/what-we-do" },
        ],
      },
      {
        heading: "Why Goldsainte",
        body: "Mandatory identity verification on every account. Secure payments through Stripe, direct to your specialist. AI-powered matching between your brief and the right specialist. A platform engineered for trust at the high end of travel.",
        links: [
          { label: "Trust & Safety", href: "/trust-safety" },
          { label: "About", href: "/about" },
        ],
      },
    ],
  },
  "/marketplace": {
    title: "Marketplace — Goldsainte",
    description:
      "Browse curated trips and storyboards from certified travel specialists and creators. Find the perfect itinerary or post your own trip request.",
    h1: "The Goldsainte Marketplace",
    intro:
      "Discover services and storyboards from vetted travel specialists and creators worldwide. Post a trip request and receive personalized proposals from professionals who match your style, region, and budget.",
    sections: [
      {
        heading: "Browse Trips",
        body: "Explore curated journeys across more than 50 destinations, from private safaris and yacht charters to architectural city stays and culinary tours.",
        links: [{ label: "Open Marketplace", href: "/marketplace" }],
      },
      {
        heading: "Request a Trip",
        body: "Share where you want to go, when, and your style. Receive tailored proposals from vetted agents and creators within hours.",
        links: [{ label: "Request a Trip", href: "/marketplace" }],
      },
    ],
  },
  "/about": {
    title: "About Goldsainte — Our Mission",
    description:
      "Goldsainte is the global marketplace for extraordinary travel — connecting travelers, specialists, and travel creators in one intelligent platform.",
    h1: "About Goldsainte",
    intro:
      "Goldsainte was built to bring trust, transparency, and craftsmanship back to the way extraordinary trips are planned. We connect travelers directly with the world's best specialists and creators — and we make sure every transaction is secure, every expert is verified, and every itinerary is bookable.",
    sections: [
      {
        heading: "Our Mission",
        body: "To be the most trusted global marketplace for extraordinary travel — where specialists thrive, creators earn, and travelers book with confidence.",
      },
      {
        heading: "How It Works",
        body: "Travelers post requests. Certified specialists bid with tailored proposals; creators inspire. Bookings happen on-platform with secure Stripe payments, identity verification, and dispute support.",
        links: [
          { label: "What we do", href: "/what-we-do" },
          { label: "Trust & Safety", href: "/trust-safety" },
        ],
      },
    ],
  },
  "/agents": {
    title: "Travel Agents on Goldsainte",
    description:
      "Find certified travel agents and specialists for your next trip. Vetted experts across luxury, adventure, family, and bespoke travel.",
    h1: "Find a Travel Specialist",
    intro:
      "Browse certified Goldsainte agents and specialists. Each profile is identity-verified and reviewed. Filter by region, specialty, or budget, then request a trip directly.",
    sections: [
      {
        heading: "For Travelers",
        body: "Compare verified specialists, read reviews, and request a personalized trip proposal in minutes.",
        links: [{ label: "Browse Agents", href: "/agents" }],
      },
      {
        heading: "For Agents",
        body: "Join Goldsainte to access qualified, high-intent travel requests, manage proposals, and grow your business on-platform.",
        links: [{ label: "Apply as an Agent", href: "/apply/agent" }],
      },
    ],
  },
  "/what-we-do": {
    title: "What We Do — Goldsainte",
    description:
      "Learn how Goldsainte connects travelers with certified specialists and creators through AI-powered matching, on-platform payments, and verified profiles.",
    h1: "What We Do",
    intro:
      "Goldsainte is the operating system for extraordinary travel. We bring three communities together — travelers, certified agents, and travel creators — and give them the tools, payments infrastructure, and trust signals to transact at the highest level.",
    sections: [
      {
        heading: "AI-Powered Matching",
        body: "Tell us your dream trip. Our matching engine routes your brief to the specialists most likely to deliver — based on region expertise, style, budget, and availability.",
      },
      {
        heading: "On-Platform Payments",
        body: "Every booking is processed on Goldsainte through secure Stripe checkout, paid directly to your specialist — your seller of record. Built-in dispute support keeps both sides protected.",
      },
      {
        heading: "Verified Experts",
        body: "Every specialist and creator on Goldsainte completes mandatory identity verification before accepting bookings. Reviews and trust signals stay on-platform and on-the-record.",
        links: [
          { label: "Trust & Safety", href: "/trust-safety" },
          { label: "Help Center", href: "/help" },
        ],
      },
    ],
  },
  "/creators": {
    title: "Travel Creators on Goldsainte",
    description:
      "Discover travel creators sharing storyboards, packaged trips, and concierge services. Turn inspiration into bookable journeys.",
    h1: "Travel Creators",
    intro:
      "Goldsainte's creator community publishes storyboards, packaged trips, and concierge services for travelers worldwide. Follow your favorites, book directly, or commission custom trips.",
    sections: [
      {
        heading: "Explore Creators",
        body: "Browse profiles, storyboards, and packaged trips from creators specializing in everything from cultural deep-dives to adrenaline expeditions.",
        links: [{ label: "Browse Creators", href: "/creators" }],
      },
    ],
  },
  "/help": {
    title: "Help Center — Goldsainte",
    description:
      "Answers for travelers, agents, and creators on Goldsainte. Booking, payments, fees, identity verification, cancellations, and trust & safety.",
    h1: "Help Center",
    intro:
      "Find answers to common questions about booking trips, managing proposals, payments and fees, identity verification, cancellations, and how Goldsainte protects every transaction on-platform.",
    sections: [
      {
        heading: "For Travelers",
        body: "How to request a trip, compare proposals, book securely on-platform, and pay your specialist directly through Stripe.",
        links: [
          { label: "Browse the Marketplace", href: "/marketplace" },
          { label: "Trust & Safety", href: "/trust-safety" },
        ],
      },
      {
        heading: "For Agents & Creators",
        body: "How to apply, pass identity verification, build a profile, submit proposals, get paid, and grow your book of business on Goldsainte.",
        links: [
          { label: "Apply as an Agent", href: "/apply/agent" },
          { label: "About Goldsainte", href: "/about" },
        ],
      },
      {
        heading: "Payments & Fees",
        body: "Goldsainte charges a transparent 7% platform fee — 3.5% from the host and 3.5% from the guest. All payments are processed on-platform through secure Stripe checkout, direct to the seller.",
      },
    ],
  },
  "/trust-safety": {
    title: "Trust & Safety — Goldsainte",
    description:
      "How Goldsainte keeps travelers, agents, and creators safe: mandatory identity verification, secure on-platform payments, and dispute resolution.",
    h1: "Trust & Safety",
    intro:
      "Trust is the foundation of every booking on Goldsainte. We verify every account, process every payment securely through Stripe, and keep every conversation on-platform — so travelers, agents, and creators can transact with confidence at the high end of travel.",
    sections: [
      {
        heading: "Mandatory Identity Verification",
        body: "Every traveler, agent, and creator on Goldsainte completes Stripe Identity verification before they can transact. No exceptions.",
      },
      {
        heading: "Secure On-Platform Payments",
        body: "All payments are processed on Goldsainte through secure Stripe checkout, paid directly to your specialist — your seller of record. Built-in dispute support keeps both sides protected.",
      },
      {
        heading: "On-Platform Communication",
        body: "Conversations, contracts, and itineraries stay on Goldsainte — protecting both sides with a complete, on-the-record audit trail.",
        links: [
          { label: "Help Center", href: "/help" },
          { label: "About Goldsainte", href: "/about" },
        ],
      },
    ],
  },
  "/apply/agent": {
    title: "Apply as a Travel Agent — Goldsainte",
    description:
      "Join Goldsainte as a certified travel agent. Access qualified high-intent travel requests, manage proposals, and grow your business on-platform.",
    h1: "Apply as a Travel Agent",
    intro:
      "Goldsainte is built for serious travel professionals. Apply to join our marketplace and gain access to a continuous pipeline of qualified, high-intent travel requests from discerning travelers worldwide.",
    sections: [
      {
        heading: "What You Get",
        body: "Qualified, high-intent leads. A polished proposal workspace. Secure on-platform payments, direct to your Stripe account. A verified profile that builds long-term trust with travelers.",
      },
      {
        heading: "Requirements",
        body: "Active travel agency credentials, proven specialty regions, mandatory Stripe Identity verification, and a commitment to on-platform communication and payments.",
        links: [
          { label: "Trust & Safety", href: "/trust-safety" },
          { label: "Help Center", href: "/help" },
        ],
      },
      {
        heading: "How It Works",
        body: "Submit your application. Our team reviews credentials within a few business days. Approved agents complete identity verification, build their profile, and start receiving briefs.",
        links: [{ label: "About Goldsainte", href: "/about" }],
      },
    ],
  },
};

function normalizePath(raw: string | null): string | null {
  if (!raw) return null;
  let p = raw;
  if (!p.startsWith("/")) p = "/" + p;
  // Strip trailing slash except for root
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return PAGES[p] ? p : null;
}

function renderHtml(path: string, meta: PageMeta): string {
  const canonical = `${BASE_URL}${path === "/" ? "" : path}/`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Goldsainte",
    url: BASE_URL,
    logo: `${BASE_URL}/brand/goldsainte-logo-512.png`,
    description: meta.description,
    sameAs: [
      "https://www.instagram.com/goldsainte",
      "https://www.linkedin.com/company/goldsainte",
    ],
  };

  const sectionsHtml = meta.sections
    .map(
      (s) => `<section>
  <h2>${esc(s.heading)}</h2>
  <p>${esc(s.body)}</p>
  ${
    s.links && s.links.length
      ? `<ul>${s.links
          .map((l) => `<li><a href="${esc(BASE_URL + l.href)}">${esc(l.label)}</a></li>`)
          .join("")}</ul>`
      : ""
  }
</section>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Goldsainte">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(DEFAULT_OG)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(meta.title)}">
<meta name="twitter:description" content="${esc(meta.description)}">
<meta name="twitter:image" content="${esc(DEFAULT_OG)}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<header>
  <a href="${esc(BASE_URL)}/">Goldsainte</a>
  <nav>
    <a href="${esc(BASE_URL)}/marketplace">Marketplace</a>
    <a href="${esc(BASE_URL)}/agents">Agents</a>
    <a href="${esc(BASE_URL)}/creators">Creators</a>
    <a href="${esc(BASE_URL)}/about">About</a>
    <a href="${esc(BASE_URL)}/newsroom">Newsroom</a>
  </nav>
</header>
<main>
<h1>${esc(meta.h1)}</h1>
<p>${esc(meta.intro)}</p>
${sectionsHtml}
</main>
<footer>
  <p>&copy; 2026 Goldsainte AI Inc. The global marketplace for extraordinary travel.</p>
  <p>
    <a href="${esc(BASE_URL)}/terms">Terms</a> ·
    <a href="${esc(BASE_URL)}/trust-safety">Trust &amp; Safety</a> ·
    <a href="${esc(BASE_URL)}/help">Help Center</a>
  </p>
</footer>
</body>
</html>`;
}

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const path = normalizePath(url.searchParams.get("path"));
  if (!path) {
    return new Response("not a prerendered path", { status: 404, headers: corsHeaders });
  }

  const meta = PAGES[path];
  const html = renderHtml(path, meta);

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600",
    },
  });
});
