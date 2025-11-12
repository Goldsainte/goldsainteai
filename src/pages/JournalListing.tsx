import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { ArticleFilters } from "@/components/journal/ArticleFilters";
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
  const [filteredArticles, setFilteredArticles] = useState<JournalArticle[]>([]);
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
      setFilteredArticles(transformedData);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: {
    category: string;
    location: string;
    search: string;
  }) => {
    let filtered = [...articles];

    // Filter by category
    if (filters.category && filters.category !== "All") {
      filtered = filtered.filter((article) =>
        article.categories.includes(filters.category)
      );
    }

    // Filter by location (search in title, dek, or location tags if we add them)
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(locationLower) ||
          article.dek.toLowerCase().includes(locationLower)
      );
    }

    // Filter by search text
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.dek.toLowerCase().includes(searchLower)
      );
    }

    setFilteredArticles(filtered);
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

        {/* Filters */}
        <div className="container mx-auto px-4 pt-8">
          <ArticleFilters onFilterChange={handleFilterChange} />
        </div>

        {/* Articles Grid */}
        <div className="container mx-auto px-4 pb-12">
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
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                {articles.length === 0
                  ? "No articles published yet"
                  : "No articles match your filters"}
              </p>
              <p className="text-muted-foreground">
                {articles.length === 0
                  ? "Check back soon for travel stories and inspiration"
                  : "Try adjusting your filters to see more results"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
