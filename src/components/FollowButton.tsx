import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEngagementFraud } from "@/hooks/useEngagementFraud";

interface FollowButtonProps {
  targetUserId: string;
  onFollowSuccess?: () => void;
  /** Overrides the default full-width sizing (e.g. inline pill in the profile hero). */
  className?: string;
}

const FollowButton = ({ targetUserId, onFollowSuccess, className }: FollowButtonProps) => {
  const { user } = useAuth();
  const { checkEngagement } = useEngagementFraud();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, [targetUserId, user]);

  const checkFollowStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error('Sign in to follow users');
      return;
    }

    if (user.id === targetUserId) {
      toast.error("You can't follow yourself");
      return;
    }

    // Check fraud prevention before following (not for unfollows)
    if (!isFollowing) {
      const allowed = await checkEngagement('follow');
      if (!allowed) return;
    }

    setActionLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        toast.success('Unfollowed');
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;
        setIsFollowing(true);
        toast.success('Following!');
        
        // Call the success callback if provided
        if (onFollowSuccess) {
          onFollowSuccess();
        }
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error(error.message || 'Failed to update follow status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" className={className || "w-full"} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      className={className || "w-full"}
      onClick={handleFollow}
      disabled={actionLoading}
    >
      {actionLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </>
      ) : (
        isFollowing ? 'Following' : 'Follow'
      )}
    </Button>
  );
};

export default FollowButton;
