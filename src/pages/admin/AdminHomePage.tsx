import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

/**
 * The Registry — the admin hub, redesigned Jul 10 (founder-approved mockup)
 * to join the console family (Atelier / Bureau / Maison): eyebrow, serif
 * welcome, stat strip, "Needs attention" band, and a complete directory of
 * every admin tool grouped into five rooms. All tool pages are unchanged;
 * this shell just makes them reachable.
 */

type Counts = {
  applications: number;
  disputes: number;
  upcomingTrips: number;
  revenueCents: number;
  emailDlq: number;
  inquiries: number;
};

const ZERO: Counts = {
  applications: 0,
  disputes: 0,
  upcomingTrips: 0,
  revenueCents: 0,
  emailDlq: 0,
  inquiries: 0,
};

type DirectoryLink = { label: string; to: string; countKey?: keyof Counts };
type DirectoryGroup = {
  numeral: string;
  title: string;
  blurb: string;
  wide?: boolean;
  links: DirectoryLink[];
};

const DIRECTORY: DirectoryGroup[] = [
  {
    numeral: "i.",
    title: "People",
    blurb: "Everyone on the platform — travelers, partners, and the pipeline of applicants.",
    links: [
      { label: "Users", to: "/admin/users" },
      { label: "Agents", to: "/admin/agents" },
      { label: "Creators", to: "/admin/creators" },
      { label: "Applications", to: "/admin/applications", countKey: "applications" },
      { label: "Customer verifications", to: "/admin/customer-verifications" },
      { label: "Waitlist", to: "/admin/waitlist" },
    ],
  },
  {
    numeral: "ii.",
    title: "Commerce",
    blurb: "The money paths — bookings, escrow, and what happens when trips change.",
    links: [
      { label: "Bookings", to: "/admin/bookings" },
      { label: "Escrow", to: "/admin/escrow" },
      { label: "Trips", to: "/admin/trips" },
      { label: "Disputes", to: "/admin/disputes", countKey: "disputes" },
      { label: "Cancellations", to: "/admin/cancellations" },
      { label: "Cancellation analytics", to: "/admin/analytics/cancellations" },
    ],
  },
  {
    numeral: "iii.",
    title: "Marketplace",
    blurb: "The shopfront — published guides, trip imagery, and storefront inquiries.",
    links: [
      { label: "Guides", to: "/admin/guides" },
      { label: "Trip photos", to: "/admin/trips" },
      { label: "Inquiries", to: "/admin/inquiries", countKey: "inquiries" },
    ],
  },
  {
    numeral: "iv.",
    title: "Trust & systems",
    blurb: "The machinery — safety reviews, platform analytics, and the email queue.",
    links: [
      { label: "Safety dashboard", to: "/admin/safety" },
      { label: "Trust & safety", to: "/admin/trust-safety" },
      { label: "Email queue", to: "/admin/email-dlq", countKey: "emailDlq" },
      { label: "Platform analytics", to: "/admin/platform-analytics" },
    ],
  },
  {
    numeral: "v.",
    title: "Newsroom",
    blurb: "The house voice — articles and authors.",
    wide: true,
    links: [
      { label: "All articles", to: "/admin/newsroom" },
      { label: "New article", to: "/admin/newsroom/new" },
      { label: "Authors", to: "/admin/newsroom/authors" },
    ],
  },
];

const countOf = (res: { count?: number | null; error?: { message: string } | null }, label: string) => {
  if (res?.error) {
    console.warn(`Registry count "${label}" unavailable:`, res.error.message);
    return 0;
  }
  return res?.count ?? 0;
};

export default function AdminHomePage() {
  const [counts, setCounts] = useState<Counts>(ZERO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const today = new Date().toISOString().split("T")[0];

        const [agentApps, brandApps, disputes, upcoming, revenueRows, dlq, inquiries] =
          await Promise.all([
            supabase
              .from("agent_applications")
              .select("id", { count: "exact", head: true })
              .not("status", "in", "(approved,rejected)"),
            supabase
              .from("brand_applications")
              .select("id", { count: "exact", head: true })
              .not("status", "in", "(approved,rejected)"),
            supabase
              .from("disputes")
              .select("id", { count: "exact", head: true })
              .in("status", ["OPEN", "UNDER_REVIEW"]),
            supabase
              .from("bookings")
              .select("id, status, trips!inner (start_date)")
              .eq("status", "confirmed")
              .gte("trips.start_date", today),
            supabase
              .from("bookings")
              .select("platform_fee, created_at")
              .gte("created_at", thirtyDaysAgo.toISOString()),
            supabase.from("email_dlq").select("id", { count: "exact", head: true }),
            supabase
              .from("brand_inquiries")
              .select("id", { count: "exact", head: true })
              .neq("status", "replied"),
          ]);

        if (cancelled) return;

        const revenueCents = (revenueRows.data || []).reduce(
          (sum, row) => sum + (row.platform_fee ?? 0),
          0,
        );

        setCounts({
          applications:
            countOf(agentApps, "agent applications") + countOf(brandApps, "brand applications"),
          disputes: countOf(disputes, "disputes"),
          upcomingTrips: upcoming.data?.length || 0,
          revenueCents,
          emailDlq: countOf(dlq, "email dlq"),
          inquiries: countOf(inquiries, "inquiries"),
        });
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load Registry counts", err);
          setError(err.message || "Could not load platform counts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fmt = (n: number) => (loading ? "—" : n.toLocaleString());
  const revenue = loading
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format((counts.revenueCents || 0) / 100);

  const attention: Array<{ label: string; to: string; count: number }> = [
    { label: "Applications awaiting review", to: "/admin/applications", count: counts.applications },
    { label: "Open disputes", to: "/admin/disputes", count: counts.disputes },
    { label: "Failed emails in queue", to: "/admin/email-dlq", count: counts.emailDlq },
    { label: "Unreplied inquiries", to: "/admin/inquiries", count: counts.inquiries },
  ].filter((a) => a.count > 0);

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-5 py-10 text-[#0a2225] md:px-6">
      <div className="mx-auto max-w-6xl">
        {/* ── Welcome ── */}
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
          Goldsainte Administration
        </p>
        <h1 className="mt-2 font-secondary text-[30px] leading-tight md:text-[34px]">
          The Registry
        </h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[#0a2225]/55">
          Oversight of the house — people, money, and trust. Everything auto-runs; this is
          where you watch, and where you step in.
        </p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        {/* ── The platform today ── */}
        <div className="mt-7 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {[
            { k: "Pending applications", v: fmt(counts.applications), d: "auto-approval fallback", to: "/admin/applications" },
            { k: "Open disputes", v: fmt(counts.disputes), d: counts.disputes === 0 && !loading ? "nothing needs you" : "require intervention", to: "/admin/disputes" },
            { k: "Upcoming trips", v: fmt(counts.upcomingTrips), d: "confirmed, dates ahead", to: "/admin/bookings" },
            { k: "Revenue (30d)", v: revenue, d: "platform fees collected", to: "/admin/bookings" },
          ].map((s) => (
            <Link
              key={s.k}
              to={s.to}
              className="rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-transform hover:-translate-y-0.5"
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#8D6B2F]">{s.k}</p>
              <p className="mt-1.5 font-secondary text-[28px] leading-none">{s.v}</p>
              <p className="mt-1.5 text-[11.5px] text-[#0a2225]/45">{s.d}</p>
            </Link>
          ))}
        </div>

        {/* ── Needs attention ── */}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-gradient-to-br from-[#0a2225] to-[#0c4d47] px-6 py-4">
          <span className="text-[10px] uppercase tracking-[0.24em] text-[#C7A962]">
            Needs attention
          </span>
          {loading ? (
            <span className="text-[13px] text-[#E5DFC6]/60">Checking the house…</span>
          ) : attention.length === 0 ? (
            <span className="text-[13.5px] text-[#E5DFC6]/70">
              Nothing needs you — the house is running itself.
            </span>
          ) : (
            attention.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="inline-flex items-center gap-2 text-[13.5px] text-[#E5DFC6] transition-colors hover:text-white"
              >
                {a.label}
                <span className="rounded-full border border-[#C7A962]/50 bg-[#C7A962]/25 px-2 py-px text-[11.5px]">
                  {a.count}
                </span>
              </Link>
            ))
          )}
        </div>

        {/* ── The directory ── */}
        <div className="mt-8 grid gap-3.5 md:grid-cols-2">
          {DIRECTORY.map((group) => (
            <section
              key={group.title}
              className={`rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)] ${group.wide ? "md:col-span-2" : ""}`}
            >
              <p className="font-secondary text-[15px] italic text-[#C7A962]">{group.numeral}</p>
              <h2 className="mt-0.5 font-secondary text-[20px]">{group.title}</h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#0a2225]/50">{group.blurb}</p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {group.links.map((link) => {
                  const n = link.countKey ? counts[link.countKey] : 0;
                  return (
                    <Link
                      key={link.label + link.to}
                      to={link.to}
                      className="whitespace-nowrap rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-[13px] text-[#6B7280] transition-colors hover:border-[#C7A962] hover:text-[#0a2225]"
                    >
                      {link.label}
                      {typeof n === "number" && n > 0 && (
                        <span className="ml-1.5 font-semibold text-[#8D6B2F]">{n}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* ── Utilities ── */}
        <p className="mt-7 text-[12px] text-[#0a2225]/40">
          One-time utilities:{" "}
          <Link to="/admin/seed-concierge-desks" className="text-[#8D6B2F] hover:underline">
            Seed concierge desks
          </Link>
        </p>
      </div>
    </main>
  );
}
