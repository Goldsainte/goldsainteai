import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Pin } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PinnedPost {
  id: string;
  media_url: string | null;
  caption: string | null;
  created_at: string;
}

interface PinnedPostsProps {
  userId: string;
}

export const PinnedPosts = ({ userId }: PinnedPostsProps) => {
  const [pinnedPosts, setPinnedPosts] = useState<PinnedPost[]>([]);

  useEffect(() => {
    fetchPinnedPosts();
  }, [userId]);

  const fetchPinnedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts' as any)
        .select('id, media_url, caption, created_at')
        .eq('user_id', userId)
        .eq('is_pinned', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setPinnedPosts((data as unknown as PinnedPost[]) || []);
    } catch (error) {
      console.error('Error fetching pinned posts:', error);
    }
  };

  if (pinnedPosts.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Pin className="w-4 h-4" />
        <h3 className="font-semibold">Pinned Posts</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {pinnedPosts.map(post => (
          <Card key={post.id} className="overflow-hidden">
            {post.media_url && (
              <OptimizedImage
                src={post.media_url}
                alt={post.caption || 'Pinned post'}
                className="w-full aspect-square object-cover"
              />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};