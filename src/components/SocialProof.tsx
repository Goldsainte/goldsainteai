import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  location: string;
  quote: string;
  avatar: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah K.",
    location: "New York",
    quote: "Goldsainte transformed how I travel. The AI concierge understood exactly what I wanted.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    rating: 5
  },
  {
    name: "James M.",
    location: "London",
    quote: "Working with expert agents through the platform gave me access to experiences I never knew existed.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    rating: 5
  },
  {
    name: "Emma R.",
    location: "Sydney",
    quote: "The CoCurated journeys are incredible. Real creators sharing their authentic travel secrets.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
    rating: 5
  },
  {
    name: "Michael T.",
    location: "Dubai",
    quote: "Luxury travel redefined. Every detail is thoughtfully curated with impeccable service.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
    rating: 5
  }
];

export const SocialProof = () => {
  return (
    <section className="py-20 bg-background animate-fadeIn">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="font-secondary text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-wide">
            Trusted by the World's Best Travelers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of discerning explorers who've elevated their journey with Goldsainte
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="p-8 border-luxury-gold/20 hover:border-luxury-gold/40 transition-all duration-300 hover:shadow-xl hover:scale-105 bg-card"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-luxury-gold/30"
                  />
                </div>
                
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-luxury-gold text-luxury-gold" />
                  ))}
                </div>

                <p className="font-primary text-base text-foreground leading-relaxed italic">
                  "{testimonial.quote}"
                </p>

                <div className="pt-2 border-t border-luxury-gold/20 w-full">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="font-secondary text-3xl font-bold text-luxury-gold mb-1">4.9</div>
              <div>Average Rating</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="font-secondary text-3xl font-bold text-luxury-gold mb-1">50K+</div>
              <div>Journeys Curated</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="font-secondary text-3xl font-bold text-luxury-gold mb-1">120+</div>
              <div>Countries Covered</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
