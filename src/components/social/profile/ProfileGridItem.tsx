interface Media {
  id: string;
  thumbUrl: string;
  kind: "image" | "video" | "carousel";
}

interface ProfileGridItemProps {
  media: Media;
  onClick?: () => void;
}

export function ProfileGridItem({ media, onClick }: ProfileGridItemProps) {
  return (
    <button
      onClick={onClick}
      className="relative aspect-square overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity w-full"
      aria-label={`View ${media.kind}`}
    >
      <img 
        src={media.thumbUrl} 
        alt="" 
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {media.kind !== "image" && (
        <span className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded px-1.5 py-0.5 font-medium">
          {media.kind === "video" ? "▶︎" : "▦"}
        </span>
      )}
    </button>
  );
}
