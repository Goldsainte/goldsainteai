import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { MediaFrame } from "../media/MediaFrame";
import { useState } from "react";
import { Lightbox } from "../media/Lightbox";

interface Post {
  id: string;
  author: {
    username: string;
    avatar: string;
  };
  media: {
    type: "image" | "video";
    url: string;
  };
  caption: string;
  likes: number;
  commentCount: number;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <article className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        {/* Header */}
        <header className="flex items-center gap-3 p-3">
          <img src={post.author.avatar} className="w-8 h-8 rounded-full" alt={post.author.username} />
          <div className="text-sm font-medium">{post.author.username}</div>
        </header>

        {/* Media */}
        <div className="bg-black cursor-pointer" onClick={() => setLightboxOpen(true)}>
          <MediaFrame media={post.media} />
        </div>

        {/* Actions (below the image) */}
        <div className="px-3 py-2 border-t border-border">
          <div className="flex items-center gap-4">
            <button className="hover:opacity-70 transition-opacity">
              <Heart className="w-6 h-6" />
            </button>
            <button className="hover:opacity-70 transition-opacity">
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="hover:opacity-70 transition-opacity">
              <Share2 className="w-6 h-6" />
            </button>
            <div className="ml-auto">
              <button className="hover:opacity-70 transition-opacity">
                <Bookmark className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm font-semibold">{post.likes.toLocaleString()} likes</div>
          <p className="text-sm mt-1">
            <span className="font-semibold">{post.author.username}</span> {post.caption}
          </p>
          {post.commentCount > 0 && (
            <button className="text-xs text-muted-foreground mt-1 hover:opacity-70">
              View all {post.commentCount} comments
            </button>
          )}
        </div>
      </article>

      <Lightbox open={lightboxOpen} onOpenChange={setLightboxOpen} post={post} />
    </>
  );
}
