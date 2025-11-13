import { useState } from "react";
import { Lightbox } from "../media/Lightbox";

interface Media {
  id: string;
  thumbUrl: string;
  kind: "image" | "video";
  author: {
    username: string;
    avatar: string;
  };
  caption: string;
  likes: number;
  commentCount: number;
}

interface ExploreGridProps {
  items: Media[];
}

export default function ExploreGrid({ items }: ExploreGridProps) {
  const [selectedPost, setSelectedPost] = useState<Media | null>(null);

  return (
    <>
      <div className="columns-3 gap-3 [@media(min-width:1200px)]:columns-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedPost(item)}
            className="mb-3 break-inside-avoid w-full cursor-pointer hover:opacity-90 transition-opacity"
            aria-label={`View post by ${item.author.username}`}
          >
            <img
              src={item.thumbUrl}
              className="w-full h-auto rounded-lg"
              alt=""
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {selectedPost && (
        <Lightbox
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
          post={{
            id: selectedPost.id,
            media: { type: selectedPost.kind, url: selectedPost.thumbUrl },
            author: selectedPost.author,
            caption: selectedPost.caption,
            likes: selectedPost.likes,
            commentCount: selectedPost.commentCount,
          }}
        />
      )}
    </>
  );
}
