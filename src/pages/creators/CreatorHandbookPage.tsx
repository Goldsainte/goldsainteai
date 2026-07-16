import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

// ============================================================================
// CreatorHandbookPage — "How Goldsainte works for creators" (Jul 16).
// The plain-language manual for every creator capability, in one place.
// Route: /creator-handbook. Linked from Creator Settings ("How it works").
// ============================================================================

const H2 = "font-secondary text-3xl text-[#0a2225] mt-14";
const P = "mt-4 leading-relaxed text-[#0a2225]/85";
const CARD = "mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8";

export default function CreatorHandbookPage() {
  const navigate = useNavigate();
  const go = (to: string, label: string) => (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="mt-4 inline-flex rounded-full border border-[#0a2225]/25 px-5 py-2.5 text-[14px] text-[#0a2225] transition-colors hover:bg-white"
    >
      {label} →
    </button>
  );

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-24">
      <Helmet><title>How Goldsainte Works for Creators · Goldsainte</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 pt-14">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8D6B2F]">Creator handbook</p>
        <h1 className="mt-3 font-secondary text-5xl leading-tight text-[#0a2225]">
          How Goldsainte works for you
        </h1>
        <p className="mt-5 text-[18px] leading-relaxed text-[#0a2225]/80">
          The short version: you make travel content people love — Goldsainte turns that love into
          booked trips, and you earn from every one. Everything below explains each piece of your
          toolkit, what it does, and where to manage it.
        </p>

        {/* The big picture */}
        <h2 className={H2}>The big picture: content → trips → income</h2>
        <p className={P}>
          A traveler discovers you (through your profile, a guide, or your socials), gets inspired,
          and requests a trip. You design it with them, they pay through Goldsainte — the money is
          held safely in escrow — and it's released to you as the trip happens. You never invoice
          anyone, chase payments, or handle card details. Goldsainte's fee is a flat 3.5% on your
          side; travelers pay their own 3.5%.
        </p>

        {/* Profile */}
        <h2 className={H2}>Your public profile — your storefront</h2>
        <div className={CARD}>
          <p className="leading-relaxed text-[#0a2225]/85">
            Every section on your profile is edited from one place: <strong>Creator Settings</strong>{" "}
            (your avatar menu → Account Settings, or the Edit public profile button on your own card).
            Photo, name, handle, price, story, travel style, the tags travelers filter by, your social
            links, and everything below — one hub, one Save button, and a{" "}
            <strong>Profile strength meter</strong> at the top telling you exactly what to add next.
          </p>
          {go("/creator-settings", "Open Creator Settings")}
        </div>

        {/* Map */}
        <h2 className={H2}>Your travel map</h2>
        <p className={P}>
          The gold map on your profile is your travel identity — every country you've visited lights
          up, one by one, when someone opens your page, and your <strong>Countries</strong> count
          shows on your card. Add countries in Settings → My travel map after every trip; it takes
          ninety seconds and your world grows for everyone to see.
        </p>

        {/* Guides — the disambiguation */}
        <h2 className={H2}>Two kinds of guides (worth 30 seconds to understand)</h2>
        <div className={CARD}>
          <p className="text-[15px] font-semibold text-[#0a2225]">1 · Travel guides — free stories that sell YOU</p>
          <p className="mt-2 leading-relaxed text-[#0a2225]/85">
            Editorial destination guides ("Tokyo Unveiled…") that appear as <em>Travel ideas</em> on
            your profile. Readers finish them and contact you to book. The AI writer drafts a full
            guide in <strong>your voice</strong> — real places, real photos matched to the destination —
            in about 15 seconds; you edit, add your own photos, and publish. Every guide shows a live
            view count, and your bell rings when one crosses a milestone (100 views, 1,000 views…).
          </p>
          <p className="mt-5 text-[15px] font-semibold text-[#0a2225]">2 · Sellable guides — digital products travelers buy</p>
          <p className="mt-2 leading-relaxed text-[#0a2225]/85">
            Itineraries and PDF-style guides sold for a price through Stripe checkout — passive
            income from your expertise. Managed in your Dashboard's Catalog.
          </p>
          {go("/creator-guides", "Write a travel guide")}
        </div>

        {/* Trips */}
        <h2 className={H2}>Trips — where the real money is</h2>
        <p className={P}>
          <strong>Trips inspired by this creator</strong> on your profile shows the trip packages
          you've published to the marketplace — bookable, escrow-protected. <strong>Upcoming trips</strong>{" "}
          is different: trips you're <em>planning</em> to lead ("Patagonia — December 2026"). Travelers
          tap Request to join, and the request lands in your pipeline with your name and the
          destination already attached. Add upcoming trips in Settings; build bookable packages from
          your Dashboard.
        </p>

        {/* Brands */}
        <h2 className={H2}>Work with brands</h2>
        <p className={P}>
          Flip on "Open to collaborations" in Settings, list your formats (sponsored posts, hotel
          reviews, press trips…), and upload a media kit — your profile grows a{" "}
          <strong>For brands & partners</strong> section with a media-kit download. Brands browsing
          Goldsainte can see at a glance that you're open for business.
        </p>

        {/* AI toolkit */}
        <h2 className={H2}>Your AI toolkit</h2>
        <div className={CARD}>
          <p className="leading-relaxed text-[#0a2225]/85">
            <strong>Guide writer</strong> — full destination guides in your voice (in the guide editor).{" "}
            <strong>AI summary</strong> — a short third-person introduction built from your real
            stats, shown as a card on your profile; regenerate it as your numbers grow (in Settings).{" "}
            <strong>Content tools</strong> — caption generator, hashtag suggester, and description
            rewriter for promoting your trips on social (in your Dashboard, or the Content tools
            button in Settings). None of these invent facts — they only work from your real data.
          </p>
        </div>

        {/* Messaging */}
        <h2 className={H2}>Messaging</h2>
        <p className={P}>
          Travelers message you directly from your profile — the Message button on your card — and
          every conversation lives in your Goldsainte inbox. Keeping chats on-platform is what makes
          the escrow protection and dispute support possible, for you and for them.
        </p>

        {/* Money */}
        <h2 className={H2}>Getting paid</h2>
        <p className={P}>
          Connect your payout account once (Dashboard → Earnings → Stripe Connect). When a traveler
          books, their payment is held in escrow; your payout releases in milestones as the trip is
          confirmed and completed, landing in your bank in 1–2 business days. Sellable guides pay out
          through the same account.
        </p>

        {/* Rhythm */}
        <h2 className={H2}>The weekly rhythm that works</h2>
        <p className={P}>
          Post your content where your audience lives — then, on Goldsainte: add any new country to
          your map, publish one guide (the AI makes this a 10-minute job), check your view counts and
          requests, and answer messages. Your profile compounds: more guides → more views → more
          requests → more booked trips.
        </p>

        <div className="mt-14 rounded-3xl bg-[#0c4d47]/[0.06] p-8 text-center">
          <p className="font-secondary text-2xl text-[#0a2225]">Ready?</p>
          <button
            type="button"
            onClick={() => navigate("/creator-settings")}
            className="mt-5 rounded-full bg-[#0c4d47] px-9 py-4 text-[15px] font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225]"
          >
            Open your Creator Settings
          </button>
        </div>
      </div>
    </div>
  );
}
