import { Shield, Lock, CheckCircle, Award, Clock, CreditCard } from "lucide-react";
import { Card } from "./ui/card";

export const SecuritySeals = () => {
  const guarantees = [
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "Money-Back Guarantee",
      description: "100% refund if our agent doesn't deliver as promised"
    },
    {
      icon: <Lock className="w-8 h-8 text-blue-500" />,
      title: "Secure Payments",
      description: "256-bit SSL encryption & PCI DSS compliance"
    },
    {
      icon: <Award className="w-8 h-8 text-purple-500" />,
      title: "Price Match Promise",
      description: "Found a better price? We'll match it or refund the difference"
    },
    {
      icon: <Clock className="w-8 h-8 text-orange-500" />,
      title: "24/7 Support",
      description: "Round-the-clock assistance for any travel emergency"
    },
    {
      icon: <CreditCard className="w-8 h-8 text-indigo-500" />,
      title: "Flexible Cancellation",
      description: "Free cancellation up to 24 hours before departure"
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-teal-500" />,
      title: "Verified Agents Only",
      description: "All agents undergo background checks & certification"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Peace of Mind, Guaranteed
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We protect every booking with industry-leading security and customer guarantees
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guarantees.map((guarantee, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {guarantee.icon}
                </div>
                <div>
                  <h3 className="font-bold mb-2">{guarantee.title}</h3>
                  <p className="text-sm text-muted-foreground">{guarantee.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Security badges row */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 p-6 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-500" />
            <span className="font-semibold">SSL Secured</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <span className="font-semibold">PCI Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-500" />
            <span className="font-semibold">GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span className="font-semibold">SOC 2 Certified</span>
          </div>
        </div>
      </div>
    </section>
  );
};
