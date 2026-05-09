import type { StoryboardTemplate } from "@/lib/storyboard-templates";

interface ContentBlock {
  id: string;
  imageUrl: string;
  caption: string;
}

interface StoryboardLivePreviewProps {
  template: StoryboardTemplate;
  title: string;
  destination: string;
  coverImage: string | null;
  blocks: ContentBlock[];
}

export function StoryboardLivePreview({
  template,
  title,
  destination,
  coverImage,
  blocks,
}: StoryboardLivePreviewProps) {
  const t = template;

  return (
    <div
      className="rounded-2xl overflow-hidden border shadow-sm min-h-[400px]"
      style={{
        backgroundColor: t.colors.bg,
        borderColor: t.colors.muted + "40",
        fontFamily: t.fonts.body,
        color: t.colors.text,
      }}
    >
      {/* Cover */}
      {coverImage ? (
        <div className={`relative ${t.coverStyle === "framed" ? "p-3" : ""}`}>
          <img
            src={coverImage}
            alt="Cover"
            className={`w-full object-cover ${
              t.coverStyle === "framed"
                ? "rounded-xl aspect-[16/9]"
                : t.coverStyle === "split"
                ? "aspect-[21/9]"
                : "aspect-[16/9]"
            }`}
          loading="lazy"/>
          {t.coverStyle === "split" && title && (
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
              <h2
                className="text-white text-xl font-bold"
                style={{ fontFamily: t.fonts.heading }}
              >
                {title || "Untitled"}
              </h2>
            </div>
          )}
        </div>
      ) : (
        <div
          className="aspect-[16/9] flex items-center justify-center"
          style={{ backgroundColor: t.colors.muted + "15" }}
        >
          <span className="text-xs" style={{ color: t.colors.muted }}>
            Cover image
          </span>
        </div>
      )}

      {/* Title area (if not split) */}
      {t.coverStyle !== "split" && (
        <div className="px-5 pt-4 pb-2 space-y-1">
          <h2
            className="text-lg font-bold leading-tight"
            style={{ fontFamily: t.fonts.heading }}
          >
            {title || "Your Storyboard Title"}
          </h2>
          {destination && (
            <p className="text-xs" style={{ color: t.colors.muted }}>
              📍 {destination}
            </p>
          )}
        </div>
      )}

      {/* Content grid */}
      {blocks.length > 0 && (
        <div className="px-5 pb-5 pt-2">
          {t.layout === "magazine" && (
            <div className="columns-2 gap-3 space-y-3">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className={`break-inside-avoid overflow-hidden ${
                    t.cardStyle === "polaroid"
                      ? "bg-white p-1.5 pb-6 shadow-sm"
                      : t.cardStyle === "rounded"
                      ? "rounded-lg"
                      : ""
                  }`}
                >
                  <img
                    src={b.imageUrl}
                    alt={b.caption}
                    className={`w-full object-cover ${
                      t.cardStyle === "rounded" ? "rounded-lg" : ""
                    }`}
                  loading="lazy"/>
                  {b.caption && (
                    <p
                      className="text-[10px] mt-1 leading-tight"
                      style={{ color: t.colors.muted }}
                    >
                      {b.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {t.layout === "minimal" && (
            <div className="space-y-4 max-w-[80%] mx-auto">
              {blocks.map((b) => (
                <div key={b.id} className="space-y-1">
                  <img
                    src={b.imageUrl}
                    alt={b.caption}
                    className="w-full rounded-lg object-cover"
                  loading="lazy"/>
                  {b.caption && (
                    <p
                      className="text-[10px] text-center"
                      style={{ color: t.colors.muted }}
                    >
                      {b.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {t.layout === "editorial" && (
            <div className="space-y-3">
              {blocks.map((b, i) => (
                <div
                  key={b.id}
                  className={i % 3 === 0 ? "" : "grid grid-cols-2 gap-3"}
                >
                  {i % 3 === 0 ? (
                    <div>
                      <img
                        src={b.imageUrl}
                        alt={b.caption}
                        className={`w-full object-cover aspect-[16/9] ${
                          t.cardStyle === "rounded" ? "rounded-lg" : ""
                        }`}
                      loading="lazy"/>
                      {b.caption && (
                        <p
                          className="text-[10px] mt-1"
                          style={{ color: t.colors.muted }}
                        >
                          {b.caption}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <img
                        src={b.imageUrl}
                        alt={b.caption}
                        className={`w-full object-cover aspect-square ${
                          t.cardStyle === "rounded" ? "rounded-lg" : ""
                        }`}
                      loading="lazy"/>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {t.layout === "bold" && (
            <div className="grid grid-cols-2 gap-2">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className={`overflow-hidden ${
                    t.cardStyle === "rounded" ? "rounded-lg" : ""
                  }`}
                >
                  <img
                    src={b.imageUrl}
                    alt={b.caption}
                    className="w-full aspect-square object-cover"
                  loading="lazy"/>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {blocks.length === 0 && (
        <div
          className="px-5 pb-5 pt-2 flex items-center justify-center h-20"
        >
          <span className="text-[10px]" style={{ color: t.colors.muted }}>
            Add photos to see them here
          </span>
        </div>
      )}
    </div>
  );
}
