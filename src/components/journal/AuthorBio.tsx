import { Instagram, Twitter, Globe } from "lucide-react";

interface AuthorBioProps {
  author: {
    name: string;
    avatar_url: string;
    bio?: string;
    social_links?: {
      instagram?: string;
      twitter?: string;
      website?: string;
    };
  };
}

export function AuthorBio({ author }: AuthorBioProps) {
  return (
    <div className="bg-luxury-ivory/50 border border-border rounded-xl p-6 sm:p-8 my-12">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={author.avatar_url}
            alt={author.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
          loading="lazy"/>
        </div>

        {/* Bio Content */}
        <div className="flex-1">
          <div className="mb-2">
            <span className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
              Written by
            </span>
          </div>
          <h3 className="font-secondary text-2xl text-primary mb-3">
            {author.name}
          </h3>
          {author.bio && (
            <p className="text-muted-foreground leading-relaxed mb-4">
              {author.bio}
            </p>
          )}

          {/* Social Links */}
          {author.social_links && (
            <div className="flex items-center gap-4">
              {author.social_links.instagram && (
                <a
                  href={author.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {author.social_links.twitter && (
                <a
                  href={author.social_links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {author.social_links.website && (
                <a
                  href={author.social_links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Website"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
