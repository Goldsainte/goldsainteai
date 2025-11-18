// src/components/home/StoryboardsHighlight.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function StoryboardsHighlight() {
  const sampleStoryboards = [
    {
      id: 1,
      title: "Amalfi Coast Long Weekend",
      subtitle: "Creator + Agent collab",
      image: "/home/jack-ward-rknrvCrfS1k-unsplash.jpg",
    },
    {
      id: 2,
      title: "Cape Town & Winelands",
      subtitle: "Agent-curated journey",
      image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&auto=format&fit=crop",
    },
    {
      id: 3,
      title: "Tokyo for Food Lovers",
      subtitle: "Creator + Agent collab",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop",
    },
    {
      id: 4,
      title: "Swiss Alps Ski Escape",
      subtitle: "Agent-curated journey",
      image: "https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800&auto=format&fit=crop",
    },
    {
      id: 5,
      title: "Moroccan Desert Adventure",
      subtitle: "Creator + Agent collab",
      image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800&auto=format&fit=crop",
    },
    {
      id: 6,
      title: "Bali Wellness Retreat",
      subtitle: "Agent-curated journey",
      image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop",
    },
  ];

  return (
    <section className="bg-white border-y border-[#E5DFC6]/30 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl leading-snug text-[#0a2225] md:text-4xl lg:text-[42px] mb-4">
            Storyboards: where every Goldsainte trip begins
          </h2>
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-[#4a4a4a] md:text-base">
            Every trip on Goldsainte starts as a storyboard—a visual brief that blends your saved TikToks, 
            creator content, mood images and curated experiences. It's how travelers express what they want 
            to feel, and how creators and agents collaborate without chaos.
          </p>
        </div>

        {/* Storyboard tiles grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          {sampleStoryboards.map((storyboard) => (
            <div
              key={storyboard.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm border border-[#E5DFC6] transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={storyboard.image}
                  alt={storyboard.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display text-base text-[#0a2225] mb-1">
                  {storyboard.title}
                </h3>
                <p className="text-xs text-[#8D8D8D]">{storyboard.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331] shadow-sm"
          >
            <Link to="/concierge">
              <Sparkles className="mr-2 h-4 w-4" />
              Start a storyboard with Madison
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-[#0c4d47] text-[#0c4d47] hover:bg-[#0c4d47]/5"
          >
            <Link to="/marketplace">
              Explore creator and agent storyboards
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
