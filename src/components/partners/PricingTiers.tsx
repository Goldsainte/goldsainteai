import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const tiers = [
  {
    name: "Basic",
    price: "Free",
    description: "Get started with basic listing",
    features: [
      "Standard listing in vendor directory",
      "Basic profile page",
      "Customer reviews",
      "Booking management",
      "Payment processing"
    ],
    cta: "Start Free",
    highlighted: false
  },
  {
    name: "Featured",
    price: "$49",
    period: "/month",
    description: "Stand out with priority placement",
    features: [
      "Everything in Basic",
      "Priority placement in search results",
      "Featured badge on profile",
      "Enhanced analytics",
      "Priority customer support",
      "Social media promotion"
    ],
    cta: "Get Featured",
    highlighted: true
  },
  {
    name: "Premium",
    price: "$99",
    period: "/month",
    description: "Maximum visibility and growth",
    features: [
      "Everything in Featured",
      "Homepage carousel presence",
      "Advanced analytics dashboard",
      "Dedicated account manager",
      "Custom marketing campaigns",
      "API access",
      "White-label options"
    ],
    cta: "Go Premium",
    highlighted: false
  }
];

export const PricingTiers = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Promotion Packages</h2>
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
                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
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
