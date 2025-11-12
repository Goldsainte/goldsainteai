import { ArticleCard } from "./ArticleCard";

interface RelatedArticlesProps {
  articles: Array<{
    id: string;
    slug: string;
    title: string;
    dek: string;
    hero_image_url: string;
    hero_image_alt?: string;
    publish_date: string;
    read_time_minutes: number;
    categories: string[];
    creator: {
      name: string;
      avatar_url: string;
    };
  }>;
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="my-16 border-t border-border pt-12">
      <h2 className="font-secondary text-3xl text-primary mb-8 text-center">
        More Stories You'll Love
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
