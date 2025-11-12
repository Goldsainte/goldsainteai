interface ArticleBlock {
  id: string;
  block_type: string;
  content: any;
}

interface ArticleBodyProps {
  blocks: ArticleBlock[];
}

export function ArticleBody({ blocks }: ArticleBodyProps) {
  const renderBlock = (block: ArticleBlock) => {
    switch (block.block_type) {
      case "paragraph":
        return (
          <p
            key={block.id}
            className="text-lg leading-relaxed mb-6 text-foreground"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {block.content.text}
          </p>
        );

      case "h2":
        return (
          <h2
            key={block.id}
            className="font-secondary text-3xl text-primary mt-12 mb-6 leading-tight"
          >
            {block.content.text}
          </h2>
        );

      case "h3":
        return (
          <h3
            key={block.id}
            className="font-secondary text-2xl text-primary mt-8 mb-4 leading-tight"
          >
            {block.content.text}
          </h3>
        );

      case "pullquote":
        return (
          <blockquote
            key={block.id}
            className="my-12 pl-6 border-l-4 border-accent"
          >
            <p
              className="text-2xl italic text-primary mb-2 leading-relaxed"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {block.content.text}
            </p>
            {block.content.attribution && (
              <cite className="text-sm text-muted-foreground not-italic">
                — {block.content.attribution}
              </cite>
            )}
          </blockquote>
        );

      case "image":
        return (
          <figure key={block.id} className="my-12">
            <img
              src={block.content.url}
              alt={block.content.alt || ""}
              className="w-full rounded-xl object-cover"
              loading="lazy"
              decoding="async"
            />
            {(block.content.caption || block.content.credit) && (
              <figcaption className="mt-3 flex justify-between items-start gap-4">
                {block.content.caption && (
                  <span className="text-sm text-muted-foreground">
                    {block.content.caption}
                  </span>
                )}
                {block.content.credit && (
                  <span className="text-xs text-muted-foreground text-right whitespace-nowrap">
                    {block.content.credit}
                  </span>
                )}
              </figcaption>
            )}
          </figure>
        );

      case "gallery":
        return (
          <div key={block.id} className="my-12">
            <div className="grid grid-cols-2 gap-4">
              {block.content.images?.map((img: any, idx: number) => (
                <figure key={idx}>
                  <img
                    src={img.url}
                    alt={img.alt || ""}
                    className="w-full rounded-xl object-cover aspect-square"
                    loading="lazy"
                    decoding="async"
                  />
                  {img.caption && (
                    <figcaption className="mt-2 text-sm text-muted-foreground">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        );

      case "embed": {
        const url = (block.content.url || '').trim();
        
        try {
          const u = new URL(url);
          const host = u.hostname.replace(/^www\./, '');
          
          // YouTube - strict hostname check
          if (host === 'youtu.be' || host === 'youtube.com') {
            const id = host === 'youtu.be' 
              ? u.pathname.slice(1)
              : new URLSearchParams(u.search).get('v') || '';
            if (!id) throw new Error('no id');
            
            return (
              <div key={block.id} className="my-12">
                <iframe
                  className="aspect-video w-full rounded-xl"
                  src={`https://www.youtube.com/embed/${id}`}
                  title="Embedded video"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }
          
          // Vimeo - strict hostname check
          if (host === 'vimeo.com') {
            const id = u.pathname.split('/')[1];
            if (!id) throw new Error('no id');
            
            return (
              <div key={block.id} className="my-12">
                <iframe
                  className="aspect-video w-full rounded-xl"
                  src={`https://player.vimeo.com/video/${id}`}
                  title="Embedded video"
                  loading="lazy"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }
          
          // Block untrusted sources
          throw new Error('unsupported provider');
        } catch {
          return (
            <div
              key={block.id}
              className="my-12 p-6 border border-border rounded-xl bg-muted/30 text-center"
            >
              <p className="text-muted-foreground">
                Embed from untrusted source blocked for security
              </p>
            </div>
          );
        }
      }

      case "cta":
        return (
          <div
            key={block.id}
            className="my-12 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-8"
          >
            <h3 className="font-secondary text-2xl text-primary mb-3">
              {block.content.title}
            </h3>
            {block.content.description && (
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {block.content.description}
              </p>
            )}
            {block.content.buttonText && (
              <button
                onClick={() => {
                  // Will integrate with Expedia modal in future
                  console.log("CTA clicked:", block.content.destination);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {block.content.buttonText}
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="prose prose-lg max-w-none">
      {blocks.map((block) => renderBlock(block))}
    </div>
  );
}
