import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Trash2, Send } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";

interface DraftPost {
  id: string;
  caption: string | null;
  media_url: string | null;
  created_at: string;
}

export const DraftPostsManager = () => {
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('travel_posts')
        .select('id, caption, video_url, image_urls, created_at')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map to DraftPost format with first image or video as media_url
      const mappedDrafts = (data || []).map(post => ({
        id: post.id,
        caption: post.caption,
        media_url: post.image_urls?.[0] || post.video_url || null,
        created_at: post.created_at
      }));
      
      setDrafts(mappedDrafts);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const publishDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('travel_posts')
        .update({ status: 'active' })
        .eq('id', draftId);

      if (error) throw error;

      setDrafts(drafts.filter(d => d.id !== draftId));
      toast.success("Draft published!");
    } catch (error) {
      console.error('Error publishing draft:', error);
      toast.error("Failed to publish draft");
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('travel_posts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;

      setDrafts(drafts.filter(d => d.id !== draftId));
      toast.success("Draft deleted!");
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error("Failed to delete draft");
    }
  };

  if (loading || drafts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Your Drafts ({drafts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {drafts.map(draft => (
          <div key={draft.id} className="flex gap-3 items-start">
            {draft.media_url && (
              <OptimizedImage
                src={draft.media_url}
                alt="Draft"
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2">
                {draft.caption || 'No caption'}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(draft.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => publishDraft(draft.id)}
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteDraft(draft.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};