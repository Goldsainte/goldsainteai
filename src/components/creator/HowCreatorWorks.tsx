import { Send, PenTool, CreditCard, Clock, ShieldCheck } from "lucide-react";

interface HowCreatorWorksProps {
  creatorName?: string;
}

export function HowCreatorWorks({ creatorName = "Your creator" }: HowCreatorWorksProps) {
  const steps = [
    {
      icon: Send,
      title: "Post your trip request",
      description: "Tell us your destination, dates, and budget.",
    },
    {
      icon: PenTool,
      title: "Get a personalized plan",
      description: `${creatorName} reviews your request and crafts a trip within 24–48 hours.`,
    },
    {
      icon: CreditCard,
      title: "Review & book",
      description: "Refine your plan and book securely on Goldsainte.",
    },
  ];

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
        How to Book With This Creator
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="relative rounded-xl border border-[#E5DFC6] bg-white p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0c4d47] text-white text-xs font-bold">
                {i + 1}
              </div>
              <step.icon className="h-5 w-5 text-[#C7A962]" />
            </div>
            <h3 className="text-sm font-semibold text-[#0a2225] mb-1">
              {step.title}
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Urgency microcopy */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-[#6B7280]">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#C7A962]" />
          Takes 2 minutes · No commitment
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0c4d47]" />
          Response within 24 hours
        </span>
      </div>
    </section>
  );
}
