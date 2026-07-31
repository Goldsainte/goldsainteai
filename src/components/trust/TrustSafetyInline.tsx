// src/components/trust/TrustSafetyInline.tsx
export function TrustSafetyInline() {
  return (
    /* Editorial restyle 31 Jul — shared by trip request + both proposal
       pages, so all three shed the 10px card at once. Copy unchanged. */
    <div className="border-l-2 border-[#C7A962] pl-5 py-1">
      <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F] mb-2">
        Stay protected on Goldsainte
      </p>
      <p className="text-[14px] leading-relaxed text-[#0a2225]/70">
        Please keep trip details and payment discussion in this chat. Avoid
        sharing phone numbers, email addresses, direct payment links or bank
        details. When trips move off-platform, we&apos;re no longer able to
        protect bookings or payouts.
      </p>
    </div>
  );
}
