// src/components/chat/ChatSafetyBanner.tsx
import { Shield } from "lucide-react";

export function ChatSafetyBanner() {
  return (
    <div className="mb-2 rounded-2xl bg-[#f7f3ea] border border-[#E5DFC6] px-3 py-2 flex gap-2 items-start text-[10px]">
      <div className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0c4d47]">
        <Shield className="h-3 w-3 text-[#E5DFC6]" />
      </div>
      <div>
        <p className="font-semibold text-[10px]">
          Keep everything on Goldsainte
        </p>
        <p className="text-[#4a4a4a]">
          For your safety, don&apos;t share phone numbers, email addresses or
          payment links here. Use Goldsainte chat and checkout so we can
          support you if anything doesn&apos;t go to plan.
        </p>
      </div>
    </div>
  );
}
