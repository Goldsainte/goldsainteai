import { Card } from "./ui/card";
import { Star, Quote } from "lucide-react";
import { Avatar } from "./ui/avatar";

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
  tripType: string;
  agentName: string;
  avatar?: string;
  verified: boolean;
}

export const TestimonialsSection = () => {
  const testimonials: Testimonial[] = [
    {
      name: "Sarah Mitchell",
      location: "New York, USA",
      rating: 5,
      text: "Our agent Emma went above and beyond to plan our honeymoon in Santorini. Every detail was perfect, from the private sunset cruise to the cave suite with a view. Worth every penny!",
      tripType: "Honeymoon to Greece",
      agentName: "Emma L.",
      verified: true
    },
    {
      name: "James Rodriguez",
      location: "London, UK",
      rating: 5,
      text: "The AI matched me with Michael who specializes in adventure travel. Our two-week trek through Patagonia was flawlessly organized. The milestone payment system made me feel secure throughout.",
      tripType: "Adventure Trek",
      agentName: "Michael R.",
      verified: true
    },
    {
      name: "Olivia Chen",
      location: "Singapore",
      rating: 5,
      text: "As someone who travels frequently for business, having Sophia as my dedicated agent has been game-changing. She knows my preferences and always finds the best options within budget.",
      tripType: "Business Travel",
      agentName: "Sophia T.",
      verified: true
    },
    {
      name: "David Thompson",
      location: "Sydney, Australia",
      rating: 5,
      text: "The split payment feature for our group trip to Bali was brilliant! Isabella organized everything for our party of 8, and everyone could pay their share directly. No awkward money conversations!",
      tripType: "Group Getaway",
      agentName: "Isabella C.",
      verified: true
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Loved by Travelers Worldwide
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real stories from real travelers who experienced exceptional journeys
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all relative overflow-hidden">
              <Quote className="absolute top-4 right-4 w-12 h-12 text-primary/10" />
              
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
                  {testimonial.name.charAt(0)}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold">{testimonial.name}</h4>
                    {testimonial.verified && (
                      <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-foreground mb-4 leading-relaxed">
                "{testimonial.text}"
              </p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{testimonial.tripType}</span>
                <span className="text-primary font-medium">with {testimonial.agentName}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Overall stats */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-muted/50 px-8 py-4 rounded-full">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <span className="text-2xl font-bold">4.9/5.0</span>
            <span className="text-muted-foreground">from 12,547 verified reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
};
