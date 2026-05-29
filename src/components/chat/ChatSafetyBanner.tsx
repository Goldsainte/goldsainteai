
// src/components/chat/ChatSafetyBanner.tsx
//
// A quiet footnote — not a banner. Lives below the message input.
// The full "what stays on platform" reasoning is in /community-guidelines.
 
export function ChatSafetyBanner() {
  return (
    <p className="text-[10px] leading-relaxed text-[#0a2225]/45 mt-3">
      Keep booking discussions on Goldsainte — phone numbers, emails, and
      off-platform payment links don&apos;t belong here, so we can step in if
      anything goes off-plan.
    </p>
  );
}
 