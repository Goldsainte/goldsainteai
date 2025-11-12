import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { Helmet } from "react-helmet-async";

interface JournalArticle {
  id: string;
  title: string;
  slug: string;
  dek: string;
  hero_image_url: string;
  hero_image_alt: string;
  publish_date: string;
  read_time_minutes: number;
  categories: string[];
  creator: {
    name: string;
    avatar_url: string;
  };
}

export default function JournalListing() {
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("journal_articles")
        .select(`
          id,
          title,
          slug,
          dek,
          hero_image_url,
          hero_image_alt,
          publish_date,
          read_time_minutes,
          categories,
          creator:journal_creators(name, avatar_url)
        `)
        .eq("status", "published")
        .order("publish_date", { ascending: false })
        .limit(12);

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = data?.map((article: any) => ({
        ...article,
        creator: Array.isArray(article.creator) ? article.creator[0] : article.creator,
      })) || [];

      setArticles(transformedData);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Journal | Goldsainte - Travel Stories & Inspiration</title>
        <meta
          name="description"
          content="Discover travel stories, destination guides, and insider tips from Goldsainte's curated journal."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-b from-luxury-ivory to-background border-b border-border">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <h1 className="font-secondary text-4xl sm:text-5xl lg:text-6xl text-primary mb-4">
              The Journal
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
              Stories, guides, and inspiration for your next extraordinary journey
            </p>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted aspect-[4/3] rounded-xl mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                No articles published yet
              </p>
              <p className="text-muted-foreground">
                Check back soon for travel stories and inspiration
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
