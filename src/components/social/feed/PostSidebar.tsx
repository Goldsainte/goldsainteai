import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";

interface Post {
  id: string;
  author: {
    username: string;
    avatar: string;
  };
  caption: string;
  likes: number;
  commentCount: number;
}

interface PostSidebarProps {
  post: Post;
}

export default function PostSidebar({ post }: PostSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Author */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <img src={post.author.avatar} className="w-8 h-8 rounded-full" alt={post.author.username} loading="lazy"/>
        <div className="text-sm font-medium">{post.author.username}</div>
      </div>

      {/* Caption */}
      <div className="text-sm">
        <span className="font-semibold">{post.author.username}</span> {post.caption}
      </div>

      {/* Comments section */}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">Comments section</p>
      </div>

      {/* Actions */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center gap-4">
          <button className="hover:opacity-70 transition-opacity" aria-label="Like">
            <Heart className="w-6 h-6" />
          </button>
          <button className="hover:opacity-70 transition-opacity" aria-label="Comment">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="hover:opacity-70 transition-opacity" aria-label="Share">
            <Share2 className="w-6 h-6" />
          </button>
          <div className="ml-auto">
            <button className="hover:opacity-70 transition-opacity" aria-label="Bookmark">
              <Bookmark className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="text-sm font-semibold">{post.likes.toLocaleString()} likes</div>
      </div>
    </div>
  );
}
