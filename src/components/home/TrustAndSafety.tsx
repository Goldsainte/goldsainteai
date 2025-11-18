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
    <section className="bg-[#f7f3ea] py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center font-display text-[28px] leading-snug text-[#0a2225] md:text-[34px] mb-12">
          Trust, safety & payments
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 rounded-2xl border border-[#E5DFC6] bg-white/70 p-6"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0c4d47]/10">
                    <Icon className="h-5 w-5 text-[#0c4d47]" />
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-[#4a4a4a]">
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
