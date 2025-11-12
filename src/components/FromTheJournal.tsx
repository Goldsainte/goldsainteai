import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import veniceSunset from "@/assets/luxury-venice-sunset.jpg";
import tropicalHideaway from "@/assets/luxury-tropical-hideaway.jpg";
import resortPool from "@/assets/luxury-resort-pool.jpg";

interface JournalEntry {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  creator: string;
  destination: string;
  imageUrl: string;
  readTime: string;
}

const getMockJournalEntries = (t: any): JournalEntry[] => [
  {
    id: "mock-1",
    slug: "venice-hidden-gems",
    title: t('home.journal.entries.entry1.title'),
    excerpt: t('home.journal.entries.entry1.excerpt'),
    creator: t('home.journal.entries.entry1.creator'),
    destination: t('home.journal.entries.entry1.destination'),
    imageUrl: veniceSunset,
    readTime: t('home.journal.entries.entry1.readTime')
  },
  {
    id: "mock-2",
    slug: "tropical-paradise",
    title: t('home.journal.entries.entry2.title'),
    excerpt: t('home.journal.entries.entry2.excerpt'),
    creator: t('home.journal.entries.entry2.creator'),
    destination: t('home.journal.entries.entry2.destination'),
    imageUrl: tropicalHideaway,
    readTime: t('home.journal.entries.entry2.readTime')
  },
  {
    id: "mock-3",
    slug: "luxury-resort-escape",
    title: t('home.journal.entries.entry3.title'),
    excerpt: t('home.journal.entries.entry3.excerpt'),
    creator: t('home.journal.entries.entry3.creator'),
    destination: t('home.journal.entries.entry3.destination'),
    imageUrl: resortPool,
    readTime: t('home.journal.entries.entry3.readTime')
  },
  {
    id: "mock-4",
    slug: "mountain-adventure",
    title: t('home.journal.entries.entry4.title'),
    excerpt: t('home.journal.entries.entry4.excerpt'),
    creator: t('home.journal.entries.entry4.creator'),
    destination: t('home.journal.entries.entry4.destination'),
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    readTime: t('home.journal.entries.entry4.readTime')
  }
];

export const FromTheJournal = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJournalArticles();
  }, [t]);

  const fetchJournalArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("journal_articles" as any)
        .select(`
          id,
          title,
          slug,
          dek,
          hero_image_url,
          read_time_minutes,
          location_tags,
          creator:journal_creators(name)
        `)
        .eq("status", "published")
        .order("publish_date", { ascending: false })
        .limit(4);

      if (error) throw error;

      if (data && data.length > 0) {
        const transformedEntries: JournalEntry[] = data.map((article: any) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          excerpt: article.dek || "",
          creator: Array.isArray(article.creator) 
            ? article.creator[0]?.name || "Goldsainte"
            : article.creator?.name || "Goldsainte",
          destination: article.location_tags?.[0] || "",
          imageUrl: article.hero_image_url,
          readTime: `${article.read_time_minutes || 5} min read`,
        }));
        setJournalEntries(transformedEntries);
      } else {
        // Use mock data if no articles exist
        setJournalEntries(getMockJournalEntries(t));
      }
    } catch (error) {
      console.error("Error fetching journal articles:", error);
      // Fallback to mock data on error
      setJournalEntries(getMockJournalEntries(t));
    } finally {
      setLoading(false);
    }
  };

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
            onClick={() => navigate('/journal')}
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
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted aspect-[4/5] rounded mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            ))
          ) : (
            journalEntries.map((entry) => (
              <article
                key={entry.id}
                role="article"
                className="group cursor-pointer overflow-hidden bg-transparent hover:-translate-y-1 transition-all duration-700 ease-out"
                onClick={() => navigate(`/journal/${entry.slug}`)}
                data-article-slug={entry.slug}
                data-testid="journal-card"
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
            ))
          )}
        </div>

        <div className="mt-12 text-center md:hidden">
          <button 
            onClick={() => navigate('/journal')}
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
