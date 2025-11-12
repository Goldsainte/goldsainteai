import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArticleBody } from "@/components/journal/ArticleBody";
import { AuthorBio } from "@/components/journal/AuthorBio";
import { RelatedArticles } from "@/components/journal/RelatedArticles";
import { ArticleSEO } from "@/components/journal/ArticleSEO";
import { ShareButtons } from "@/components/journal/ShareButtons";
import { SponsorRibbon } from "@/components/journal/SponsorRibbon";
import { useArticleAnalytics } from "@/hooks/useArticleAnalytics";
import { formatDistanceToNow } from "date-fns";
import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Article {
  id: string;
  title: string;
  slug: string;
  dek: string;
  hero_image_url: string;
  hero_image_alt: string;
  hero_image_credit: string;
  publish_date: string;
  read_time_minutes: number;
  categories: string[];
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  is_sponsored: boolean;
  sponsor_name?: string;
  sponsor_logo_url?: string;
  sponsor_link_url?: string;
  creator: {
    id: string;
    name: string;
    avatar_url: string;
    bio: string;
    social_links?: {
      instagram?: string;
      twitter?: string;
      website?: string;
    };
  };
}

interface ArticleBlock {
  id: string;
  block_type: string;
  block_order: number;
  content: any;
}

export default function JournalArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [blocks, setBlocks] = useState<ArticleBlock[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Track analytics
  useArticleAnalytics({
    articleId: article?.id || "",
  });

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      // Fetch article
      const { data: articleData, error: articleError } = await supabase
        .from("journal_articles" as any)
        .select(`
          id,
          title,
          slug,
          dek,
          hero_image_url,
          hero_image_alt,
          hero_image_credit,
          publish_date,
          read_time_minutes,
          categories,
          meta_title,
          meta_description,
          og_image_url,
          is_sponsored,
      sponsor_name,
      sponsor_logo_url,
      sponsor_link_url,
          creator:journal_creators(id, name, avatar_url, bio, social_links)
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (articleError) throw articleError;

      // Transform creator data
      const transformedArticle: any = {
        ...(articleData as any),
        creator: Array.isArray((articleData as any).creator)
          ? (articleData as any).creator[0]
          : (articleData as any).creator,
      };

      setArticle(transformedArticle);

      // Fetch article blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from("journal_article_blocks" as any)
        .select("*")
        .eq("article_id", (articleData as any).id)
        .order("block_order", { ascending: true });

      if (blocksError) throw blocksError;

      setBlocks((blocksData as any) || []);

      // Fetch related articles (by shared categories)
      if ((articleData as any).categories && (articleData as any).categories.length > 0) {
        const { data: relatedData } = await supabase
          .from("journal_articles" as any)
          .select(
            `
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
          `
          )
          .eq("status", "published")
          .neq("id", (articleData as any).id)
          .contains("categories", (articleData as any).categories)
          .limit(6);

        if (relatedData) {
          const transformedRelated = relatedData.map((item: any) => ({
            ...item,
            creator: Array.isArray(item.creator)
              ? item.creator[0]
              : item.creator,
          }));
          setRelatedArticles(transformedRelated);
        }
      }

      // Track view (analytics)
      await supabase.from("journal_analytics" as any).insert({
        article_id: (articleData as any).id,
        session_id: crypto.randomUUID(),
        referrer: document.referrer,
      } as any);
    } catch (error) {
      console.error("Error fetching article:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-8" />
            <div className="aspect-[16/9] bg-muted rounded-xl mb-8" />
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Article not found</h1>
          <Link to="/journal">
            <Button variant="outline">Back to Journal</Button>
          </Link>
        </div>
      </div>
    );
  }

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.dek,
    image: article.hero_image_url,
    datePublished: article.publish_date,
    author: {
      "@type": "Person",
      name: article.creator.name,
    },
    publisher: {
      "@type": "Organization",
      name: "Goldsainte",
      logo: {
        "@type": "ImageObject",
        url: "https://goldsainte.ai/logo.png",
      },
    },
  };

  return (
    <>
      <ArticleSEO
        title={article.title}
        dek={article.dek}
        heroImageUrl={article.hero_image_url}
        publishDate={article.publish_date}
        authorName={article.creator.name}
        slug={article.slug}
        categories={article.categories}
        readTime={article.read_time_minutes}
      />

      <article className="min-h-screen bg-background" data-testid="article-hero">
        {/* Back button */}
        <div className="container mx-auto px-4 pt-8">
          <Link to="/journal">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Journal
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Category */}
          {article.categories.length > 0 && (
            <div className="flex gap-2 mb-4">
              {article.categories.slice(0, 2).map((category) => (
                <span
                  key={category}
                  className="text-xs font-medium text-accent uppercase tracking-wider"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-secondary text-4xl sm:text-5xl lg:text-6xl text-primary mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Dek */}
          {article.dek && (
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {article.dek}
            </p>
          )}

          {/* Byline */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
            {article.creator.avatar_url && (
              <img
                src={article.creator.avatar_url}
                alt={article.creator.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-medium text-primary">{article.creator.name}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(article.publish_date), {
                    addSuffix: true,
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.read_time_minutes} min read
                </span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mb-12">
            <img
              src={article.hero_image_url}
              alt={article.hero_image_alt || article.title}
              className="w-full rounded-xl object-cover aspect-[16/9]"
              loading="eager"
            />
            {article.hero_image_credit && (
              <p className="text-xs text-muted-foreground text-right mt-2">
                {article.hero_image_credit}
              </p>
            )}
          </div>
        </div>

        {/* Sponsor Ribbon */}
        {article.is_sponsored && (
          <SponsorRibbon
            sponsorName={article.sponsor_name}
            sponsorLogo={article.sponsor_logo_url}
            sponsorUrl={article.sponsor_link_url}
          />
        )}

        {/* Article Body */}
        <div className="container mx-auto px-4 pb-16 max-w-3xl">
          <ArticleBody blocks={blocks} />

          {/* Share Buttons */}
          <div className="border-t border-b border-border py-6 my-8">
            <ShareButtons title={article.title} slug={article.slug} />
          </div>

          {/* Author Bio */}
          <AuthorBio author={article.creator} />
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="container mx-auto px-4 pb-16 max-w-6xl">
            <RelatedArticles articles={relatedArticles} />
          </div>
        )}
      </article>
    </>
  );
}
