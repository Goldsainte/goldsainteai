import { Shield, Users, CheckCircle, Award, Globe, Clock } from "lucide-react";
import { Card } from "./ui/card";
import { useEffect, useState } from "react";

interface Stat {
  icon: React.ReactNode;
  value: string;
  label: string;
  suffix?: string;
}

export const TrustStatsSection = () => {
  const [totalBookings, setTotalBookings] = useState(0);
  const [verifiedAgents, setVerifiedAgents] = useState(0);

  // Animated counter effect
  useEffect(() => {
    const bookingsTarget = 12547;
    const agentsTarget = 324;
    const duration = 2000; // 2 seconds
    const steps = 60;
    const bookingsIncrement = bookingsTarget / steps;
    const agentsIncrement = agentsTarget / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setTotalBookings(Math.floor(bookingsIncrement * currentStep));
        setVerifiedAgents(Math.floor(agentsIncrement * currentStep));
      } else {
        clearInterval(timer);
        setTotalBookings(bookingsTarget);
        setVerifiedAgents(agentsTarget);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  const stats: Stat[] = [
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      value: totalBookings.toLocaleString(),
      label: "Bookings Completed",
      suffix: "+"
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      value: verifiedAgents.toLocaleString(),
      label: "Verified Agents",
      suffix: "+"
    },
    {
      icon: <Award className="w-6 h-6 text-amber-500" />,
      value: "4.9",
      label: "Average Rating",
      suffix: "/5.0"
    },
    {
      icon: <Globe className="w-6 h-6 text-blue-500" />,
      value: "150",
      label: "Countries Served",
      suffix: "+"
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-500" />,
      value: "$2.5M",
      label: "Protected by Escrow",
      suffix: "+"
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-500" />,
      value: "< 2h",
      label: "Avg Response Time"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by Luxury Travelers Worldwide
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of discerning travelers who choose Goldsainte for exceptional experiences
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold mb-2">
                {stat.value}
                {stat.suffix && <span className="text-xl text-muted-foreground">{stat.suffix}</span>}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </Card>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="font-medium">256-bit SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-medium">PCI DSS Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="font-medium">Money-Back Guarantee</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="font-medium">24/7 Support</span>
          </div>
        </div>
      </div>
    </section>
  );
};
