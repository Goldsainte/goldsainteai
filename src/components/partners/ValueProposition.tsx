import { Crown, Smartphone, TrendingUp } from "lucide-react";

const benefits = [
  {
    icon: Crown,
    title: "Premium Clientele",
    description: "Access to luxury travelers and corporate clients seeking high-end transportation services.",
    stat: "85% repeat customers"
  },
  {
    icon: Smartphone,
    title: "Technology Platform",
    description: "Advanced booking management tools, real-time notifications, and seamless payment processing.",
    stat: "99.9% uptime guarantee"
  },
  {
    icon: TrendingUp,
    title: "Revenue Growth",
    description: "Our partners see an average 40% increase in bookings within the first 6 months.",
    stat: "40% avg. growth"
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

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
