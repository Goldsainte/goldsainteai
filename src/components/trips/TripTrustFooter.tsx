import { Shield, CreditCard, MessageCircle, FileCheck } from "lucide-react";

export function TripTrustFooter() {
  const trustPoints = [
    {
      icon: Shield,
      title: "Identity Verified",
      description: "All hosts pass our verification process",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Your payment is protected until after your trip",
    },
    {
      icon: MessageCircle,
      title: "24/7 Support",
      description: "Our team is here to help before, during, and after",
    },
    {
      icon: FileCheck,
      title: "Clear Policies",
      description: "Transparent cancellation and refund terms",
    },
  ];

  return (
    <section className="mt-12 border-t border-[#E5DFC6]/50 bg-[#0a2225] py-12">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C7B892]">
          Trust & Safety
        </p>
        <h3 className="mt-2 text-center font-secondary text-xl font-semibold text-white">
          Book with confidence
        </h3>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-xl bg-white/5 p-5 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#C7B892]/20">
                <point.icon className="h-5 w-5 text-[#C7B892]" />
              </div>
              <h4 className="mt-3 text-[15px] font-semibold text-white">
                {point.title}
              </h4>
              <p className="mt-1 text-[13px] leading-relaxed text-white/70">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
