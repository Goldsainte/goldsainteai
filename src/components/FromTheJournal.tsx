import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="container px-4">
        <div className="flex items-end justify-between mb-16 md:mb-20">
          <div>
            <h2 className="font-secondary text-5xl md:text-6xl lg:text-7xl font-light mb-4 text-foreground tracking-tight">
              {t('home.journal.title')}
            </h2>
            <p className="text-xl md:text-2xl font-light text-muted-foreground/80">
              {t('home.journal.subtitle')}
            </p>
            <div className="w-20 h-1 bg-luxury-gold mt-4"></div>
          </div>
          <button 
            onClick={() => navigate('/journeys')}
            className="hidden md:flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors group"
          >
            <span className="relative">
              {t('home.journal.viewAll')}
              <span className="absolute bottom-0 left-0 w-full h-px bg-foreground scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
          {journalEntries.map((entry) => (
            <article
              key={entry.id}
              role="article"
              className="group cursor-pointer overflow-hidden bg-transparent hover:-translate-y-1 transition-all duration-700 ease-out"
              onClick={() => navigate('/journeys')}
            >
              <div className="relative h-80 md:h-96 overflow-hidden">
                <img
                  src={entry.imageUrl}
                  alt={`${entry.title} - ${entry.destination}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-700"></div>
              </div>

              <div className="pt-6 space-y-3">
                <div className="text-[10px] text-luxury-gold/70 font-semibold tracking-[0.2em] uppercase">
                  {entry.destination}
                </div>
                
                <h3 className="font-secondary text-2xl md:text-3xl font-bold text-foreground/90 leading-tight group-hover:text-luxury-gold transition-colors duration-300">
                  {entry.title}
                </h3>
                
                <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-1">
                  {entry.excerpt}
                </p>

                <div className="flex items-center pt-4">
                  <span className="text-sm text-muted-foreground/70">
                    {entry.creator} · {entry.readTime.replace(' read', '')}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <button 
            onClick={() => navigate('/journeys')}
            className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors group"
          >
            <span className="relative">
              {t('home.journal.viewAll')}
              <span className="absolute bottom-0 left-0 w-full h-px bg-foreground scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </section>
  );
};
