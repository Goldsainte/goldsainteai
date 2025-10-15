import { Users, Network, Megaphone, CreditCard, Mic } from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Connect with Luxury Travelers",
    description: "Be part of high-end, personalized itineraries booked by discerning travelers seeking seamless door-to-door experiences.",
    stat: "Premium clientele"
  },
  {
    icon: Network,
    title: "Power Creator & Agent Packages",
    description: "Get pulled into custom trips crafted by travel creators and certified agents—combining your services with hotels, experiences, and dining.",
    stat: "Ecosystem integration"
  },
  {
    icon: Megaphone,
    title: "Promote Your Brand, Not Just a Service",
    description: "Run Sponsored Posts, get featured as a Promoted Vendor, and showcase your fleet and reputation directly to target audiences.",
    stat: "Marketing tools"
  },
  {
    icon: CreditCard,
    title: "Streamlined, Secure Payments",
    description: "Enjoy milestone-based payouts, group payment handling, and transparent billing through Goldsainte's smart payment system.",
    stat: "Secure transactions"
  },
  {
    icon: Mic,
    title: "Hands-Free Booking via AI Concierge",
    description: "Your services are voice-accessible through our 'Hey Goldsainte' AI concierge, making you bookable in seconds—anytime, anywhere.",
    stat: "Voice discovery"
  }
];

export const ValueProposition = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Partner with Goldsainte?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the leading platform connecting premium transportation providers with discerning travelers
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="bg-card p-8 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
            >
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {benefit.description}
              </p>
              <div className="text-primary font-semibold">
                {benefit.stat}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
