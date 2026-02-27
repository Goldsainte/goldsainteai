import { Mic, Users2, Megaphone, Wallet, Rocket, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const benefits = [
  {
    icon: Mic,
    title: "Voice-Activated, AI-Driven Discovery",
    bullets: [
      "Travelers use AI-powered search and matching to discover and book — effortlessly",
      "Your services are surfaced in real-time conversations about flights, hotels, and transportation",
      "Personalized AI agents match your offerings with traveler preferences and budgets"
    ]
  },
  {
    icon: Users2,
    title: "Integrated into Agent & Creator Experiences",
    bullets: [
      "Be included in agent-built itineraries and influencer-led CoCurated™ trips",
      "Show up in interactive trip plans shared on social feeds",
      "Gain trust by being part of fully packaged, luxury travel experiences"
    ]
  },
  {
    icon: Megaphone,
    title: "Premium Placement & Sponsored Visibility",
    bullets: [
      "Upgrade to Promoted Vendor for top search and planner placement",
      "Launch Sponsored Posts to appear in the social feed and booking flow",
      "Boost visibility where travelers, agents, and creators spend their time"
    ]
  },
  {
    icon: Wallet,
    title: "Multi-Channel Booking & Smart Payments",
    bullets: [
      "Bookings through agents, creators, AI, and direct customer searches",
      "Support for group bookings, split payments, and secure milestone-based payouts",
      "Real-time messaging and status updates keep everything transparent"
    ]
  },
  {
    icon: Rocket,
    title: "Built for Brand & Business Growth",
    bullets: [
      "Create a vendor profile with photos, service areas, reviews, and fleet details",
      "Collaborate with creators and agents directly through their dashboards",
      "Access analytics and insights to optimize performance and visibility",
      "Be part of a curated marketplace that values quality and luxury"
    ]
  },
  {
    icon: Tag,
    title: "Launch Your Own Curated Specials",
    bullets: [
      "Build and promote limited-time offers or premium ride packages",
      "Feature them on the homepage or within search as native ads",
      "Drive targeted bookings and brand recognition through curated campaigns"
    ]
  }
];

export const ValueProposition = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="font-secondary text-3xl md:text-4xl font-bold mb-4">Why Partner with Goldsainte?</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
            Goldsainte offers more than just a place to list your transportation services. We've built an intelligent travel commerce ecosystem where your business becomes part of fully curated, bookable experiences — powered by AI, elevated by creators, and trusted by travel professionals.
          </p>
          <p className="text-base font-semibold text-foreground max-w-2xl mx-auto">
            Here's what makes Goldsainte unlike anything else in travel:
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
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
              <h3 className="font-secondary text-xl font-bold mb-3">{benefit.title}</h3>
              <ul className="list-disc ml-5 space-y-2 text-muted-foreground leading-relaxed">
                {benefit.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center max-w-4xl mx-auto">
          <p className="text-lg text-foreground mb-6 leading-relaxed">
            🚀 Goldsainte is where the future of luxury travel is being built. Whether you're a boutique operator or regional fleet, partnering with us puts your brand at the center of curated, high-value travel experiences — promoted by creators, booked by agents, and powered by AI.
          </p>
          <Button 
            size="lg" 
            className="px-8"
            onClick={() => navigate('/transportation-vendor-application')}
          >
            Apply Now to Become a Goldsainte Vendor
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
