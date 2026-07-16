import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Sparkles, Map, BookOpen, Plane, Briefcase, MessageCircle,
  Banknote, Camera, ChevronRight, Users, Lock, TrendingUp,
} from "lucide-react";

// ============================================================================
// CreatorHandbookPage v2 — tutorial-style: flow diagram, icon sections, and
// "where to find it" path pills. Route: /creator-handbook.
// ============================================================================

const P = "mt-3 leading-relaxed text-[#0a2225]/85";

function Path({ steps }: { steps: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8D6B2F]">Find it:</span>
      {steps.map((s, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="rounded-full border border-[#C7B892]/60 bg-white px-3 py-1 text-[12px] text-[#0a2225]">{s}</span>
          {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-[#C7A962]" />}
        </span>
      ))}
    </div>
  );
}

function Flow() {
  const steps: [React.ElementType, string, string][] = [
    [Camera, "Your content", "Guides, reels, your map — travelers discover you"],
    [Users, "Trip request", "They tap Design my trip or Request to join"],
    [Lock, "Escrow", "They pay Goldsainte — money held safely"],
    [Banknote, "You're paid", "Released to your bank as the trip happens"],
  ];
  return (
    <div className="mt-8 grid gap-4 rounded-3xl bg-[#0c4d47]/[0.06] p-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-start">
      {steps.map(([Icon, t, d], i) => (
        <div key={t} className="contents">
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0c4d47] text-[#E5DFC6]">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-2 text-[14px] font-semibold text-[#0a2225]">{t}</p>
            <p className="mt-1 text-[12px] leading-snug text-[#0a2225]/65">{d}</p>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="mt-3 hidden h-5 w-5 shrink-0 text-[#C7A962] sm:block" />
          )}
        </div>
      ))}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
      <h2 className="flex items-center gap-3 font-secondary text-2xl text-[#0a2225]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C7A962]/20">
          <Icon className="h-4.5 w-4.5 h-[18px] w-[18px] text-[#8D6B2F]" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function CreatorHandbookPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-24">
      <Helmet><title>Creator Handbook · Goldsainte</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 pt-14">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8D6B2F]">Creator handbook</p>
        <h1 className="mt-3 font-secondary text-5xl leading-tight text-[#0a2225]">How Goldsainte works for you</h1>
        <p className="mt-5 text-[18px] leading-relaxed text-[#0a2225]/80">
          You make travel content people love — Goldsainte turns that love into booked trips, and you
          earn from every one. Here's the whole machine, in five minutes.
        </p>

        <Flow />
        <p className="mt-3 text-center text-[13px] text-[#0a2225]/60">
          Your fee is a flat 3.5% — you keep 96.5% of your price. Travelers pay their own 3.5%. No invoicing, ever.
        </p>

        <Section icon={Sparkles} title="Your profile — the storefront">
          <p className={P}>
            Everything travelers see is edited in one place, and the <strong>Profile strength meter</strong>{" "}
            at the top tells you exactly what to add next. Complete profiles also rank higher in the
            creators directory — finishing your profile is literally how you climb.
          </p>
          <Path steps={["Avatar menu", "Account Settings"]} />
        </Section>

        <Section icon={Map} title="Your travel map">
          <p className={P}>
            Every country you add lights up gold, one by one, when someone opens your page — and your
            Countries count shows on your card. Ninety seconds after every trip.
          </p>
          <Path steps={["Account Settings", "My travel map", "type a country", "Save"]} />
        </Section>

        <Section icon={BookOpen} title="Travel guides — stories that sell you">
          <p className={P}>
            Editorial destination guides that appear as <em>Travel ideas</em> on your profile. The AI
            writer drafts a full guide in <strong>your voice</strong> — real places, real photos — in
            about 15 seconds; you edit, swap in your own photos, publish. Every guide keeps a live view
            count, and your bell rings at milestones (100 views, 1,000…).
          </p>
          <Path steps={["Account Settings", "Travel guides", "New guide", "Write it with AI"]} />
          <p className="mt-4 text-[14px] text-[#0a2225]/70">
            Different thing: <strong>Sellable guides</strong> — priced itineraries travelers buy via
            Stripe. Those live in your Dashboard's Catalog (Settings → Sellable guides).
          </p>
        </Section>

        <Section icon={Plane} title="Trips — where the real money is">
          <p className={P}>
            <strong>Trips inspired by this creator</strong> shows your published, bookable trip
            packages. <strong>Upcoming trips</strong> are ones you're planning ("Patagonia — December
            2026") — travelers tap Request to join and the request lands in your pipeline with your
            name and destination already attached.
          </p>
          <Path steps={["Account Settings", "Upcoming trips", "+ Add trip"]} />
        </Section>

        <Section icon={Briefcase} title="Work with brands">
          <p className={P}>
            Flip on collaborations, list your formats, upload a media kit — your profile grows a{" "}
            <strong>For brands & partners</strong> section with a media-kit download.
          </p>
          <Path steps={["Account Settings", "Work with brands"]} />
        </Section>

        <Section icon={MessageCircle} title="Messages">
          <p className={P}>
            Travelers message you from the button on your card; everything lives in your Goldsainte
            inbox. On-platform chat is what makes escrow protection and dispute support possible.
          </p>
        </Section>

        <Section icon={TrendingUp} title="The weekly rhythm">
          <p className={P}>
            Post where your audience lives — then here: add new countries, publish one AI-assisted
            guide, check your view counts and requests, answer messages. More guides → more views →
            more requests → more booked trips. It compounds.
          </p>
        </Section>

        <div className="mt-12 rounded-3xl bg-[#0c4d47]/[0.06] p-8 text-center">
          <p className="font-secondary text-2xl text-[#0a2225]">Ready?</p>
          <button type="button" onClick={() => navigate("/creator-settings")}
            className="mt-5 rounded-full bg-[#0c4d47] px-9 py-4 text-[15px] font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225]">
            Open your Creator Settings
          </button>
        </div>
      </div>
    </div>
  );
}
