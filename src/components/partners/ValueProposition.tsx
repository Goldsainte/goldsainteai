import { Mic, Users2, Megaphone, Wallet, Rocket, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const benefits = [
  {
    icon: Mic,
    title: "Be Discoverable Through AI & Voice Search",
    description: "With our voice-activated AI concierge, travelers can simply say 'Hey Goldsainte' from anywhere on the platform to start planning their journey. Your services become voice-searchable and bookable within conversations about flights, hotels, dining, and — most importantly — transportation. Goldsainte's personal AI agents learn each traveler's style, budget, and preferences, ensuring your offering reaches the right audience at the right time — hands-free and hyper-personalized."
  },
  {
    icon: Users2,
    title: "Get Pulled into Creator & Agent-Built Experiences",
    description: "Become a trusted part of CoCurated™ travel packages, where verified agents and top creators design end-to-end itineraries featuring your services — from airport pickups to all-day private drivers. Whether it's a honeymoon in the Maldives or a girls' trip to Tulum, your brand travels with them. You can also be featured directly in creator content, trip planners, and interactive itineraries—building visibility and bookings through trusted recommendations."
  },
  {
    icon: Megaphone,
    title: "Unlock Premium Placement & Sponsored Exposure",
    description: "As a Promoted Vendor, you'll receive elevated placement in our search results, trip-building tools, and social feed. Want even more visibility? Launch Sponsored Posts that appear alongside curated travel content from influencers, agents, and the Goldsainte editorial team. Position your brand directly in front of luxury travelers, with full control over your messaging and promotion strategy."
  },
  {
    icon: Wallet,
    title: "Earn Through a Multi-Channel Booking Engine",
    description: "You're not just joining a marketplace — you're plugging into a smart commerce platform where your service can be booked through: Agent-curated trips with milestone-based payments • Creator-led experiences and social itineraries • AI recommendations tailored to individual users • Group bookings with built-in split payment handling • A real-time communication hub for updates and traveler messaging. Every interaction is transparent, secure, and designed for high-value clientele."
  },
  {
    icon: Rocket,
    title: "Join a Travel Ecosystem Built for Growth",
    description: "Goldsainte is built from the ground up to empower not just travelers, but the vendors, creators, and agents behind the scenes. Transportation providers benefit from: Full-service vendor profiles with branding, reviews, and fleet showcases • Integration into creator dashboards for seamless collab setup • Potential revenue-sharing with creators and agents for featured inclusion • Access to performance analytics to track your visibility and conversion • A growing user base of travelers who value luxury, trust, and personalization."
  },
  {
    icon: Tag,
    title: "Create Curated Specials with Homepage Ads",
    description: "Just like travel agents, vendors can build limited-time transportation packages or special offers—from event transfers to seasonal VIP experiences. These curated specials can be featured directly on the Goldsainte homepage, appear in search results, and run as native ads across the platform, driving bookings and brand awareness."
  }
];

export const ValueProposition = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Partner with Goldsainte?</h2>
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
              <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
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
