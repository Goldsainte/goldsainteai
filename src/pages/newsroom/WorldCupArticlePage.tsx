import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { newsroomPageShellClass } from "./ui";

// ─── ARTICLE DATA ────────────────────────────────────────────────────────────
const article = {
  category: "Travel & Industry",
  title: "The World Cup Reality Check: When Hype Meets the Hotel Bill",
  subtitle: "Why mega-events don't guarantee great travel — and how Goldsainte AI helps you plan smarter.",
  excerpt:
    "Eighty percent of U.S. hotels say World Cup bookings are falling short — and the reason why reveals everything wrong with how we plan travel around hype. Here's what smart travelers do differently, and how Goldsainte AI helps you build trips around experience, not buzz.",
  date: "May 2026",
  readTime: "5 min read",
  tags: [
    "World Cup",
    "Travel Planning",
    "Hotel Industry",
    "Luxury Travel",
    "Travel Tips",
    "Mega Events",
    "Trip Planning",
    "Consumer Spending",
    "Travel Intelligence",
    "Tourism Economy",
    "AI Travel",
    "Goldsainte",
    "Travel Trends",
    "Smart Travel",
    "Experiential Travel",
  ],
};

// ─── STAT CARD COMPONENT ─────────────────────────────────────────────────────
function StatCard({
  value,
  label,
  sub,
  accent = false,
}: {
  value: string;
  label: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8"
      style={{
        background: accent ? "#0c4d47" : "#FDF9F0",
        border: "1px solid #E5DFC6",
      }}
    >
      <span
        className="block mb-2"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(42px, 5vw, 64px)",
          fontWeight: 300,
          lineHeight: 1,
          color: accent ? "#C7A962" : "#0c4d47",
        }}
      >
        {value}
      </span>
      <span
        className="block"
        style={{
          fontSize: "10px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: accent ? "rgba(253,249,240,0.7)" : "#6b7280",
          lineHeight: 1.5,
          maxWidth: "180px",
        }}
      >
        {label}
      </span>
      {sub && (
        <span
          className="block mt-2"
          style={{
            fontSize: "11px",
            color: accent ? "rgba(199,169,98,0.9)" : "#0c4d47",
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── PULL QUOTE COMPONENT ────────────────────────────────────────────────────
function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      className="my-10"
      style={{
        background: "#F6F0E4",
        borderLeft: "3px solid #C7A962",
        padding: "28px 32px",
      }}
    >
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "16px",
          fontStyle: "italic",
          fontWeight: 400,
          lineHeight: 1.55,
          color: "#0c4d47",
          margin: 0,
        }}
      >
        {children}
      </p>
    </blockquote>
  );
}

// ─── INSIGHT LIST ITEM ───────────────────────────────────────────────────────
function InsightItem({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <li
      className="flex gap-4 py-4"
      style={{ borderBottom: "1px solid #E5DFC6" }}
    >
      <span
        style={{
          color: "#C7A962",
          fontSize: "8px",
          marginTop: "7px",
          flexShrink: 0,
        }}
      >
        ◆
      </span>
      <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#0a2225", fontWeight: 300 }}>
        <strong style={{ fontWeight: 500 }}>{label}</strong> — {description}
      </p>
    </li>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function WorldCupArticlePage() {
  return (
    <div style={{ background: "#FDF9F0", minHeight: "100vh", color: "#0a2225" }}>

      {/* ── HERO (matches ArticleDetail) ── */}
      <article className={`${newsroomPageShellClass} max-w-[680px] pb-6 md:pb-8 animate-fade-in`}>
        <Link
          to="/newsroom"
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-[#0c4d47] hover:text-[#0a3d39] transition"
        >
          <ArrowLeft size={14} strokeWidth={1.75} /> Back to Newsroom
        </Link>

        <h1
          className="font-secondary mt-6 sm:mt-8 md:mt-10 text-[28px] sm:text-[34px] md:text-[42px] leading-[1.06] text-[#0a2225]"
          style={{ letterSpacing: "-0.01em" }}
        >
          {article.title}
        </h1>

        <div className="mt-4 sm:mt-5 md:mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] sm:text-[14px] text-[#0a2225]/70">
          <span>By Goldsainte AI Newsroom</span>
          <span className="text-[#0a2225]/30">·</span>
          <span>{article.date}</span>
          <span className="text-[#0a2225]/30">·</span>
          <span>{article.readTime}</span>
          <span className="inline-flex items-center bg-[#0c4d47]/10 text-[#0c4d47] px-3 py-0.5 rounded-full text-[11px] tracking-wide uppercase">
            {article.category}
          </span>
        </div>

        <div className="mt-8 md:mt-10 border-l-2 border-[#C7A962] pl-4 sm:pl-5 py-1">
          <p className="text-[14px] sm:text-[15px] italic text-[#0a2225]/75 leading-relaxed">
            <span className="font-semibold not-italic text-[#0a2225]">Editor's Note:</span>{" "}
            {article.subtitle}
          </p>
        </div>
      </article>

      {/* ── BODY ── */}
      <article className="max-w-3xl mx-auto px-6 pb-24">

        {/* STAT ROW */}
        <div
          className="flex flex-col sm:flex-row gap-px my-10"
          style={{ background: "#E5DFC6" }}
        >
          <StatCard
            value="80%"
            label="of U.S. hotels reporting World Cup bookings below expectations"
            accent
          />
          <StatCard
            value="↓"
            label="Spending on hotels, dining, flights & shopping — all declining"
            sub="Fans cut everywhere after tickets"
          />
          <StatCard
            value="$$$"
            label="Ticket costs consuming the bulk of travel budgets before check-in"
          />
        </div>

        <p style={{ fontSize: "16px", lineHeight: 1.9, fontWeight: 300, marginBottom: "24px" }}>
          The World Cup was supposed to be the great economic gift to American
          hospitality. Sold-out stadiums. Full hotels. Overflowing restaurants.
          The kind of mega-event that fills city coffers and rewards investors
          who moved early. But as the tournament unfolds across U.S. venues, a
          quieter story is emerging from behind the front desks and reservation
          systems of hotels nationwide — and it is far more instructive than the
          headlines suggested.
        </p>

        <p style={{ fontSize: "16px", lineHeight: 1.9, fontWeight: 300, marginBottom: "24px" }}>
          Roughly 80 percent of U.S. hotels report that their World Cup-related
          bookings are falling short of projections. The gap between anticipation
          and reality is not a minor rounding error. It represents a structural
          problem — one that many in the events industry, tourism sector, and
          broader investment community failed to account for.
        </p>

        <PullQuote>
          "When fans spend massive amounts just to enter the stadium, they cut
          spending everywhere else."
        </PullQuote>

        {/* SECTION */}
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: 500,
            color: "#0a2225",
            marginTop: "48px",
            marginBottom: "16px",
            letterSpacing: "0.01em",
          }}
        >
          The Ticket Price Trap
        </h2>

        <p style={{ fontSize: "16px", lineHeight: 1.9, fontWeight: 300, marginBottom: "24px" }}>
          World Cup tickets have reached prices that, for many fans, consume the
          bulk of a travel budget before a single hotel night is booked. When
          the stadium experience alone costs thousands of dollars, travelers
          begin making ruthless cuts everywhere else. Shorter trips. Cheaper
          accommodations. Fewer restaurant dinners. Less shopping. In some
          cases, fans are choosing to watch from home rather than attempt the
          logistical and financial complexity of attending in person.
        </p>

        <p style={{ fontSize: "16px", lineHeight: 1.9, fontWeight: 300, marginBottom: "24px" }}>
          This is not a new phenomenon, but it is one that planners consistently
          underestimate. The assumption is that a passionate fan will find a way
          to spend — that love of the sport overrides financial restraint. What
          actually happens is different: fans prioritize the core experience and
          compress or eliminate everything surrounding it.
        </p>

        {/* SECTION */}
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: 500,
            color: "#0a2225",
            marginTop: "48px",
            marginBottom: "16px",
          }}
        >
          The Broader Lesson Nobody Wanted to Learn
        </h2>

        <p style={{ fontSize: "16px", lineHeight: 1.9, fontWeight: 300, marginBottom: "24px" }}>
          The World Cup hotel story is, at its core, a story about the gap
          between attention and behavior. A mega-event creates attention. It
          generates headlines, booking inquiries, social media conversation, and
          investor confidence. What it does not automatically generate is spend.
          The variables that determine whether attention converts into economic
          activity are far more granular — and far less glamorous — than the
          event itself.
        </p>

        <ul className="list-none p-0 m-0 my-6">
          <InsightItem
            label="Pricing accessibility"
            description="Can the target consumer actually afford the full experience, or only a part of it?"
          />
          <InsightItem
            label="Consumer confidence"
            description="What is the broader economic environment? Are people spending freely or cautiously?"
          />
          <InsightItem
            label="Trip architecture"
            description="Have organizers made it easy, affordable, and logical to extend a visit beyond the core event?"
          />
          <InsightItem
            label="Local execution"
            description="Are transportation, accommodation, and hospitality options priced to capture incremental spend?"
          />
          <InsightItem
            label="Timing"
            description="Does the event align with when people have the time and financial bandwidth to travel?"
          />
        </ul>

        <p style={{ fontSize: "16px", lineHeight: 1.9, fontWeight: 300, marginBottom: "24px" }}>
          When these variables are not addressed, even the most coveted event in
          the world will disappoint the balance sheet.
        </p>

        {/* SECTION */}
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: 500,
            color: "#0a2225",
            marginTop: "48px",
            marginBottom: "16px",
          }}
        >
          What This Means for Travel Planning
        </h2>

        <p style={{ fontSize: "16px", lineHeight: 1.9, fontWeight: 300, marginBottom: "24px" }}>
          For travelers, the World Cup situation offers a practical signal:
          mega-events are often the worst time to visit a destination if value
          is a priority. The crowds are real. The infrastructure strain is real.
          But the authentic experience — the food, the neighborhoods, the culture
          that draws people to a city in the first place — is frequently
          overwhelmed or priced out during peak event windows.
        </p>

        <p style={{ fontSize: "16px", lineHeight: 1.9, fontWeight: 300, marginBottom: "24px" }}>
          The travelers who navigate major events best are those who plan with
          intentionality rather than impulse. They build trips around behavior —
          what they actually want to experience — rather than the buzz of being
          present for a marquee moment.
        </p>

        {/* SECTION */}
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: 500,
            color: "#0a2225",
            marginTop: "48px",
            marginBottom: "16px",
          }}
        >
          The Smarter Way to Travel — With or Without the World Cup
        </h2>

        <p style={{ fontSize: "16px", lineHeight: 1.9, fontWeight: 300, marginBottom: "24px" }}>
          This is precisely the problem Goldsainte AI was built to solve. Most
          travelers don't lack desire — they lack a system for making decisions
          that align with what they actually want to experience versus what they
          feel pressured to attend. Booking a trip because everyone else is?
          That's buzz. Designing a journey around your taste, your timeline, and
          your budget — guided by people who have actually been there? That's
          behavior.
        </p>

        <p style={{ fontSize: "16px", lineHeight: 1.9, fontWeight: 300, marginBottom: "24px" }}>
          Goldsainte AI connects travelers directly with TikTok travel creators
          and certified travel agents through an AI-powered platform. Before you
          book a single night, you can build a visual storyboard of your trip —
          pulling in real creator content, curated experiences, and destination
          inspiration — so you see the journey before you ever commit. No
          guesswork. No overpaying for proximity to an event you'll experience
          from the outside anyway.
        </p>

        <PullQuote>
          The best trips aren't built around events. They're built around
          experiences — and the difference is everything.
        </PullQuote>

        <p style={{ fontSize: "16px", lineHeight: 1.9, fontWeight: 300, marginBottom: "24px" }}>
          Whether you are planning around the World Cup, after it, or entirely
          away from it, the Goldsainte approach is the same: start with what you
          genuinely want, build a visual blueprint, and let a certified agent
          engineer the logistics behind it. Creators bring the inspiration.
          Agents handle the execution. You arrive knowing exactly what you're
          walking into.
        </p>

        {/* CTA BLOCK */}
        <div
          className="mt-12 p-8"
          style={{ background: "#0a2225" }}
        >
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "16px",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#FDF9F0",
              lineHeight: 1.6,
              marginBottom: "24px",
            }}
          >
            The World Cup taught the hospitality industry a hard lesson about
            the difference between hype and demand.{" "}
            <span style={{ color: "#C7A962" }}>Goldsainte AI</span> exists so
            that lesson never has to be yours.
          </p>
          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.8,
              color: "rgba(253,249,240,0.75)",
              fontWeight: 300,
              marginBottom: "28px",
            }}
          >
            Build your trip around behavior — your behavior — with creators
            who've lived it and agents who know how to deliver it.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
            style={{
              background: "#C7A962",
              color: "#0a2225",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "14px 28px",
              borderRadius: "999px",
              textDecoration: "none",
            }}
          >
            Start Planning
            <ArrowUpRight size={13} strokeWidth={2} />
          </Link>
        </div>

        {/* TAGS */}
        <div className="mt-12 pt-8" style={{ borderTop: "1px solid #E5DFC6" }}>
          <p
            style={{
              fontSize: "10px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: "14px",
            }}
          >
            Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  color: "#0a2225",
                  border: "1px solid #E5DFC6",
                  padding: "5px 12px",
                  borderRadius: "2px",
                  background: "#FDF9F0",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* BACK LINK */}
        <div className="mt-12">
          <Link
            to="/newsroom"
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-60"
            style={{
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#0a2225",
            }}
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Back to Newsroom
          </Link>
        </div>

      </article>
    </div>
  );
}
