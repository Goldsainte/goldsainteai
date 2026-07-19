// ResidenceSelect — shared state-of-residence attestation control (2026-07-19)
//
// Rendered on every TRIP purchase surface (marketplace sidebar, agent
// payment-link panel, chat-proposal accept card). Collects the traveler's
// (or, agent-side, the client's) US state of residence and shows the
// Seller-of-Travel availability notice when a gated state is selected.
// The selection is stamped into booking metadata and enforced server-side
// in trip-checkout-create — this control is the honest front door, not
// the lock.
//
// Deliberately a native <select>: zero portal/z-index issues inside chat
// message cards and compact panels, and fully keyboard/mobile native.

import {
  US_RESIDENCE_OPTIONS,
  isSotBlockedState,
  SOT_BLOCKED_MESSAGE,
} from "@/lib/residency";

interface ResidenceSelectProps {
  value: string;
  onChange: (code: string) => void;
  /** Label above the select. Agent-side surfaces pass "Client's state of residence". */
  label?: string;
  /** Tighter spacing for compact surfaces (message cards, side panels). */
  compact?: boolean;
  id?: string;
}

export function ResidenceSelect({
  value,
  onChange,
  label = "Your state of residence",
  compact = false,
  id = "residence-state",
}: ResidenceSelectProps) {
  const blocked = isSotBlockedState(value);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wide text-[#7A7151]"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-white px-3 text-sm text-[#0a2225] focus:outline-none focus:ring-1 focus:ring-[#0C4D47] ${
          compact ? "py-2" : "py-2.5"
        } ${blocked ? "border-[#C7A962]" : "border-[#E5DFC6]"}`}
      >
        <option value="">Select…</option>
        {US_RESIDENCE_OPTIONS.map((o) => (
          <option key={o.code} value={o.code}>
            {o.name}
          </option>
        ))}
      </select>
      {blocked && (
        <p className="rounded-lg bg-[#FDF9F0] px-3 py-2 text-xs leading-relaxed text-[#7A7151]">
          {SOT_BLOCKED_MESSAGE}
        </p>
      )}
    </div>
  );
}
