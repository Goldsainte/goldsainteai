import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * The Registry chrome — a slim dark bar in the Two-Tier language that every
 * admin tool page inherits automatically (mounted once inside AdminGuard).
 * Gives all twenty-plus tools a shared identity and an always-available way
 * back to the Registry hub, without touching any page's internals.
 * Hidden on /admin itself — the hub IS the Registry.
 */

const ROOM_TITLES: Array<[prefix: string, title: string]> = [
  ["/admin/applications", "Applications"],
  ["/admin/safety", "Safety dashboard"],
  ["/admin/agents", "Agents"],
  ["/admin/creators", "Creators"],
  ["/admin/users", "Users"],
  ["/admin/bookings", "Bookings"],
  ["/admin/disputes", "Disputes"],
  ["/admin/trips", "Trips"],
  ["/admin/guides", "Guides"],
  ["/admin/waitlist", "Waitlist"],
  ["/admin/email-dlq", "Email queue"],
  ["/admin/newsroom/authors", "Newsroom · Authors"],
  ["/admin/newsroom/new", "Newsroom · New article"],
  ["/admin/newsroom", "Newsroom"],
  ["/admin/escrow", "Escrow"],
  ["/admin/analytics/cancellations", "Cancellation analytics"],
  ["/admin/cancellations", "Cancellations"],
  ["/admin/customer-verifications", "Customer verifications"],
  ["/admin/inquiries", "Inquiries"],
  ["/admin/platform-analytics", "Platform analytics"],
  ["/admin/trust-safety", "Trust & safety"],
  ["/admin/seed-concierge-desks", "Seed concierge desks"],
  ["/email-preview", "Email preview"],
];

export function RegistryBar() {
  const { pathname } = useLocation();

  // The hub carries its own identity — no bar needed on the Registry itself.
  if (pathname === "/admin" || pathname === "/admin/") return null;

  const room =
    ROOM_TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Administration";

  return (
    <div className="bg-[#083530]">
      <div className="mx-auto flex h-[46px] max-w-6xl items-center gap-3 px-5 md:px-6">
        <Link
          to="/admin"
          aria-label="Back to the Registry"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#E5DFC6] transition-colors hover:bg-white/20"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C7A962]">
          The Registry
        </span>
        <span className="text-[#E5DFC6]/30">·</span>
        <span className="font-secondary text-[15px] text-[#E5DFC6]">{room}</span>
      </div>
    </div>
  );
}
