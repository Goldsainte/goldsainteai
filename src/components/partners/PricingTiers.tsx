import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const tiers = [
  {
    name: "Basic",
    price: "Free",
    description: "Perfect for getting started",
    features: [
      "Profile listing on platform",
      "Discoverable by agents, creators, and AI matching",
      "Access to all booking requests",
      "Basic analytics dashboard",
      "Email support",
      "Standard payment processing"
    ],
    cta: "Get Started Free",
    highlighted: false
  },
  {
    name: "Promoted Vendor",
    price: "$49",
    period: "/month",
    description: "Premium visibility across the ecosystem",
    features: [
      "Everything in Basic",
      "Featured placement in agent and creator trip planners",
      "Priority listing in AI voice search results",
      "Promoted badge on your vendor profile",
      "Access to exclusive creator collabs",
      "Enhanced analytics",
      "Priority customer support"
    ],
    cta: "Start Free Trial",
    highlighted: true
  },
  {
    name: "Sponsored Posts + Promoted",
    price: "$99",
    period: "/month",
    description: "Maximum visibility with sponsored campaigns",
    features: [
      "Everything in Promoted Vendor",
      "Sponsored Posts in social feed",
      "Creator collaboration campaigns",
      "Advanced campaign analytics & ROI tracking",
      "Dedicated account manager",
      "Custom marketing campaigns",
      "API access (optional)"
    ],
    cta: "Contact Sales",
    highlighted: false
  }
];

export const PricingTiers = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="font-secondary text-3xl md:text-4xl font-bold mb-4">Promotion Packages</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the package that fits your business goals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative rounded-lg border ${
                tier.highlighted
                  ? 'border-primary shadow-xl scale-105'
                  : 'border-border'
              } bg-card p-8 hover:shadow-lg transition-all duration-300`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-secondary text-xl font-bold mb-2">{tier.name}</h3>
                <div className="mb-3">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.period && (
                    <span className="text-muted-foreground">{tier.period}</span>
                  )}
                </div>
                <p className="text-muted-foreground">{tier.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={tier.highlighted ? "default" : "outline"}
                size="lg"
                onClick={() => navigate('/transportation-vendor-application')}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include our standard commission structure. 
            <span className="block mt-1">Contact us for enterprise solutions and custom packages.</span>
          </p>
        </div>
      </div>
    </section>
  );
};
