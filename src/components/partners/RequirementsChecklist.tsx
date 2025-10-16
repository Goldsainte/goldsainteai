import { CheckCircle2 } from "lucide-react";

const requirements = [
  {
    title: "Valid Business License",
    description: "Active transportation or livery business registration in your operating region"
  },
  {
    title: "Commercial Insurance",
    description: "Minimum $1M liability coverage for commercial passenger transportation"
  },
  {
    title: "Professional Drivers",
    description: "Licensed, background-checked drivers with clean driving records"
  },
  {
    title: "Well-Maintained Vehicles",
    description: "Late-model vehicles (5 years or newer) in excellent condition"
  },
  {
    title: "Clean Safety Record",
    description: "No major safety violations or serious incidents in the past 3 years"
  },
  {
    title: "Professional Standards",
    description: "Commitment to exceptional customer service and punctuality"
  }
];

export const RequirementsChecklist = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-secondary text-3xl md:text-4xl font-bold mb-4">Partnership Requirements</h2>
            <p className="text-lg text-muted-foreground">
              To maintain our luxury standard and protect all ecosystem participants (travelers, agents, creators), we require:
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-8 md:p-12">
            <div className="space-y-6">
              {requirements.map((req, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-secondary text-lg font-bold mb-1">{req.title}</h3>
                    <p className="text-muted-foreground">{req.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> All requirements must be met before approval. 
                Our verification process typically takes 3-5 business days. We're committed to transparency 
                and will communicate clearly throughout the onboarding process.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
