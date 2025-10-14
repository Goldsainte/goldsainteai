import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface SuggestedUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_following: boolean;
}

export const SuggestedUsers = () => {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get users the current user is following
      const { data: following } = await supabase
        .from('follows' as any)
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = (following as any[])?.map(f => f.following_id) || [];

      // Get suggested users (users not currently followed, with posts)
      let query = supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .neq('id', user.id)
        .limit(5);
      
      // Only add the not filter if there are actual following IDs
      if (followingIds.length > 0) {
        query = query.not('id', 'in', `(${followingIds.join(',')})`);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      const usersWithFollowStatus = data?.map(u => ({
        ...u,
        is_following: false,
      })) || [];

      setUsers(usersWithFollowStatus);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to follow users");
        return;
      }

      await supabase
        .from('follows' as any)
        .insert({
          follower_id: user.id,
          following_id: userId,
        } as any);

      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_following: true } : u
      ));
      
      toast.success("Followed user!");
    } catch (error) {
      console.error('Error following user:', error);
      toast.error("Failed to follow user");
    }
  };

  if (loading || users.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Suggested For You
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => navigate(`/travel-profile/${user.username || user.id}`)}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user.username || 'User'}
                </p>
                {user.bio && (
                  <p className="text-sm text-muted-foreground truncate">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant={user.is_following ? "outline" : "default"}
              onClick={() => handleFollow(user.id)}
              disabled={user.is_following}
            >
              {user.is_following ? 'Following' : 'Follow'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};