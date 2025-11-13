import { useEffect, useRef } from "react";
import { PostCard } from "./PostCard";

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

interface VirtualizedFeedProps {
  posts: Post[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function VirtualizedFeed({ posts, onLoadMore, hasMore }: VirtualizedFeedProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(0);

  // Keyboard navigation: J/K for next/prev post
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndexRef.current + 1, posts.length - 1);
        const nextElement = document.querySelector(`[data-post-index="${nextIndex}"]`);
        if (nextElement) {
          nextElement.scrollIntoView({ behavior: "smooth", block: "center" });
          currentIndexRef.current = nextIndex;
        }
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndexRef.current - 1, 0);
        const prevElement = document.querySelector(`[data-post-index="${prevIndex}"]`);
        if (prevElement) {
          prevElement.scrollIntoView({ behavior: "smooth", block: "center" });
          currentIndexRef.current = prevIndex;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [posts.length]);

  // Infinite scroll with intersection observer
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "400px" } // Prefetch when 400px away
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore]);

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <div key={post.id} data-post-index={index}>
          <PostCard post={post} />
        </div>
      ))}
      
      {hasMore && (
        <div ref={sentinelRef} className="h-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
}
