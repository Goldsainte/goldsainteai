import { Users2, Globe, Star, Megaphone } from "lucide-react";
import creatorImage from "@/assets/partners/city-services.webp";
import technologyImage from "@/assets/partners/technology-platform.webp";
import growthImage from "@/assets/partners/success-growth.webp";
import marketingImage from "@/assets/partners/corporate-services.webp";

const benefits = [
  {
    icon: Users2,
    title: "Creator Collaborations",
    subtitle: "Become Part of Influencer Travel Stories",
    description: "Partner with travel influencers who feature your rides in their content. Your service gets linked to creator-led travel packages (e.g., 'Ride to the Amalfi Coast with @TravelLuxe'). Track engagement, conversions, and ROI from every collaboration.",
    image: creatorImage,
    imagePosition: "left" as const
  },
  {
    icon: Globe,
    title: "Agent & Traveler Ecosystem",
    subtitle: "Power Professional Trip Planning",
    description: "Certified travel agents pull your services into custom itineraries. Travelers discover you through AI-powered search and curated recommendations. Your brand appears in full trip contexts—not just isolated ride searches.",
    image: technologyImage,
    imagePosition: "right" as const
  },
  {
    icon: Star,
    title: "Promoted Vendor Status",
    subtitle: "Stand Out From the Crowd",
    description: "Upgrade to Promoted Vendor for featured placement in agent and creator trip planners, priority listing in AI voice search results, and a promoted badge on your profile. Access exclusive creator collabs and sponsorship opportunities.",
    image: growthImage,
    imagePosition: "left" as const
  },
  {
    icon: Megaphone,
    title: "Sponsored Posts & Marketing",
    subtitle: "Launch Campaigns Inside the Platform",
    description: "Promote your service directly inside Goldsainte. Launch targeted campaigns, partner with influencers, and track engagement. Your brand reaches travelers at the moment they're planning luxury trips.",
    image: marketingImage,
    imagePosition: "right" as const
  }
];

export const BenefitsSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="font-secondary text-3xl md:text-4xl font-bold mb-4">Partner Benefits</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to succeed and grow your transportation business
          </p>
        </div>

        <div className="max-w-7xl mx-auto space-y-24">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className={`grid md:grid-cols-2 gap-12 items-center ${
                benefit.imagePosition === 'right' ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Image */}
              <div className={`${benefit.imagePosition === 'right' ? 'md:order-2' : ''}`}>
                <div className="relative rounded-lg overflow-hidden shadow-2xl">
                  <img 
                    src={benefit.image} 
                    alt={benefit.title}
                    className="w-full h-[400px] object-cover"
                  loading="lazy"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </div>

              {/* Content */}
              <div className={`${benefit.imagePosition === 'right' ? 'md:order-1' : ''}`}>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-primary font-semibold mb-2">{benefit.subtitle}</div>
                <h3 className="font-secondary text-2xl md:text-3xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
