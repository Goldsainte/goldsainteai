import { FileText, ShieldCheck, Rocket, Star } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Apply",
    description: "Submit your vendor application with business credentials, insurance, licenses, and fleet details."
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Get Verified",
    description: "Our team reviews your documentation to approve you as a Standard or Preferred Vendor, depending on service quality and compliance."
  },
  {
    number: "03",
    icon: Rocket,
    title: "Go Live",
    description: "Your profile becomes discoverable by creators, agents, and travelers. Set your availability, update your fleet, and start accepting bookings."
  },
  {
    number: "04",
    icon: Star,
    title: "Get Promoted",
    description: "Choose to run Sponsored Posts or upgrade to Promoted Vendor status for top placement in trip-building tools and the social feed."
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="font-secondary text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to start growing your transportation business
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-primary to-primary/20" />
                )}
                
                <div className="text-center">
                  <div className="mb-4">
                    <div className="text-5xl font-bold text-primary/20 mb-2">
                      {step.number}
                    </div>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-secondary text-lg font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
