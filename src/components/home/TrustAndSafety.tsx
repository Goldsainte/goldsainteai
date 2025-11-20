// src/components/home/TrustAndSafety.tsx
import { ShieldCheck, Lock, MessageSquare, Scale } from "lucide-react";

export function TrustAndSafety() {
  const features = [
    {
      icon: ShieldCheck,
      text: "Identity verification for professionals: agents complete Stripe Identity and license checks before taking bookings.",
    },
    {
      icon: Lock,
      text: "Escrowed payments: your money is held securely and released in milestones, with a post-trip protection window.",
    },
    {
      icon: MessageSquare,
      text: "On-platform messaging only: for your safety, all booking details and approvals stay inside Goldsainte.",
    },
    {
      icon: Scale,
      text: "Structured dispute process: if something doesn't go to plan, we have a clear path for review and resolution.",
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center font-display text-2xl leading-snug sm:text-3xl text-[#0a2225] md:text-4xl lg:text-[42px] mb-8 sm:mb-12 max-w-full px-2">
          Trust, safety & payments
        </h2>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 md:gap-10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 sm:gap-4 rounded-xl border border-[#E5DFC6]/30 bg-white p-4 sm:p-5 shadow-sm"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#0c4d47]/10">
                    <Icon className="h-4 w-4 text-[#0c4d47]" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm leading-[1.6] text-[#4a4a4a]">
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
