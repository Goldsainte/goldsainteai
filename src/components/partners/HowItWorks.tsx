import { FileText, ShieldCheck, DollarSign, Bell } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Apply Online",
    description: "Complete our simple 5-minute application with your business details and fleet information."
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Get Verified",
    description: "Our team conducts quality and safety checks to ensure premium standards are met."
  },
  {
    number: "03",
    icon: DollarSign,
    title: "Set Your Rates",
    description: "You have full control over your pricing structure and service offerings."
  },
  {
    number: "04",
    icon: Bell,
    title: "Start Earning",
    description: "Receive instant booking notifications and start serving premium clients immediately."
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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
                    <div className="text-6xl font-bold text-primary/20 mb-2">
                      {step.number}
                    </div>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
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
