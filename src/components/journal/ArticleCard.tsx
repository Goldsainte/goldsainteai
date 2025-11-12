import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { OptimizedImage } from "./OptimizedImage";

interface ArticleCardProps {
  article: {
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
    };
  };
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      to={`/journal/${article.slug}`}
      className="group block"
      data-testid="journal-card"
      data-article-slug={article.slug}
    >
      <article className="h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded-xl">
          <OptimizedImage
            src={article.hero_image_url}
            alt={article.hero_image_alt || article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Category badge */}
          {article.categories.length > 0 && (
            <div className="absolute top-4 left-4">
              <span className="bg-white/90 backdrop-blur-sm text-primary text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wider">
                {article.categories[0]}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-secondary text-xl sm:text-2xl text-primary mb-2 leading-tight group-hover:text-accent transition-colors">
            {article.title}
          </h3>

          {/* Dek */}
          {article.dek && (
            <p className="text-muted-foreground mb-4 line-clamp-2 leading-relaxed flex-1">
              {article.dek}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
            <span className="font-medium">{article.creator.name}</span>
            <div className="flex items-center gap-3">
              <span>
                {article.publish_date 
                  ? formatDistanceToNow(new Date(article.publish_date), {
                      addSuffix: true,
                    })
                  : '—'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.read_time_minutes ?? 5}m
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
