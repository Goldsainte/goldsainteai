import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import veniceSunset from "@/assets/luxury-venice-sunset.jpg";
import tropicalHideaway from "@/assets/luxury-tropical-hideaway.jpg";
import resortPool from "@/assets/luxury-resort-pool.jpg";

interface JournalEntry {
  id: string;
  title: string;
  excerpt: string;
  creator: string;
  destination: string;
  imageUrl: string;
  readTime: string;
}

const journalEntries: JournalEntry[] = [
  {
    id: "1",
    title: "European City Breaks: A Romance Renaissance",
    excerpt: "Discover the timeless elegance of Venice, where gondolas glide through centuries of history and modern luxury...",
    creator: "Sophie Anderson",
    destination: "Venice, Italy",
    imageUrl: veniceSunset,
    readTime: "8 min read"
  },
  {
    id: "2",
    title: "Eco-Luxury Escapes: Jungle Hideaways",
    excerpt: "Experience the perfect blend of nature and sophistication in Bali's most exclusive eco-resorts...",
    creator: "Marco Rossi",
    destination: "Bali, Indonesia",
    imageUrl: tropicalHideaway,
    readTime: "6 min read"
  },
  {
    id: "3",
    title: "Top Beach Resorts for 2025",
    excerpt: "Our expertly curated selection of the world's most stunning beachfront properties, from Maldives to Caribbean...",
    creator: "Isabella Laurent",
    destination: "Global Collection",
    imageUrl: resortPool,
    readTime: "10 min read"
  },
  {
    id: "4",
    title: "Safari Under the Stars",
    excerpt: "An intimate look at luxury camping in the Serengeti, where wildlife encounters meet five-star service...",
    creator: "David Chen",
    destination: "Tanzania",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    readTime: "7 min read"
  }
];

export const FromTheJournal = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-secondary text-4xl md:text-5xl font-bold mb-3 text-foreground tracking-wide">
              From the Journal
            </h2>
            <p className="text-lg text-muted-foreground">
              Curated stories from our creator community
            </p>
          </div>
          <button 
            onClick={() => navigate('/journeys')}
            className="hidden md:flex items-center gap-2 text-luxury-gold hover:text-luxury-gold/80 transition-colors font-semibold"
          >
            View All Stories
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {journalEntries.map((entry) => (
            <Card
              key={entry.id}
              className="group cursor-pointer border-0 overflow-hidden bg-card hover:shadow-2xl transition-all duration-500"
              onClick={() => navigate('/journeys')}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={entry.imageUrl}
                  alt={entry.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-4 right-4 bg-luxury-gold/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                  {entry.readTime}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="text-xs text-luxury-gold font-semibold tracking-wider uppercase">
                  {entry.destination}
                </div>
                
                <h3 className="font-secondary text-xl font-bold text-foreground leading-tight group-hover:text-luxury-gold transition-colors">
                  {entry.title}
                </h3>
                
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {entry.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    by {entry.creator}
                  </span>
                  <ArrowRight className="w-4 h-4 text-luxury-gold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <button 
            onClick={() => navigate('/journeys')}
            className="inline-flex items-center gap-2 text-luxury-gold hover:text-luxury-gold/80 transition-colors font-semibold"
          >
            View All Stories
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
