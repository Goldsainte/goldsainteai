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
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center font-display text-3xl leading-snug text-[#0a2225] md:text-4xl lg:text-[42px] mb-12">
          Trust, safety & payments
        </h2>

        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 rounded-xl border border-[#E5DFC6]/30 bg-white p-5 shadow-sm"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0c4d47]/10">
                    <Icon className="h-4 w-4 text-[#0c4d47]" />
                  </div>
                </div>
                <p className="text-xs leading-[1.7] text-[#4a4a4a]">
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
