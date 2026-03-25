import { Send, PenTool, CreditCard } from "lucide-react";

export function HowCreatorWorks() {
  const steps = [
    {
      icon: Send,
      title: "Submit your request",
      description: "Share your destination, dates, budget, and travel preferences.",
    },
    {
      icon: PenTool,
      title: "Custom itinerary",
      description: "Your creator builds a personalized trip just for you.",
    },
    {
      icon: CreditCard,
      title: "Review & book",
      description: "Refine the plan and book securely through Goldsainte.",
    },
  ];

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
        How It Works
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
    </section>
  );
}
