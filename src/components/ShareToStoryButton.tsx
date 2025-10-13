import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShareToStoryButtonProps {
  postId: string;
  postImage?: string;
  postCaption?: string;
}

export const ShareToStoryButton = ({ postId, postImage, postCaption }: ShareToStoryButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShareToStory = async () => {
    if (!postImage) {
      toast.error("No image to share");
      return;
    }

    setSharing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create a moment with the reposted content
      const { error } = await supabase
        .from('moments' as any)
        .insert({
          user_id: user.id,
          media_url: postImage,
          media_type: 'image',
          caption: `Repost: ${postCaption || ''}`,
          duration_seconds: 10,
          visibility: 'public',
          reposted_from_post_id: postId,
        } as any);

      if (error) throw error;

      toast.success("Shared to your story!");
      setShowDialog(false);
    } catch (error) {
      console.error('Error sharing to story:', error);
      toast.error("Failed to share to story");
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share to Story
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share to Your Story?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a moment in your story with this post's content.
              Your followers will be able to see it for 24 hours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleShareToStory} disabled={sharing}>
              {sharing ? 'Sharing...' : 'Share'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};