import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

interface SuggestedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  followers_count: number;
}

export function FeedSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);

  useEffect(() => {
    if (user) {
      fetchSuggestedUsers();
    }
  }, [user]);

  const fetchSuggestedUsers = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, followers_count')
        .neq('id', user.id)
        .order('followers_count', { ascending: false })
        .limit(5);

      if (data) {
        setSuggestedUsers(data);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  if (!user) return null;

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto px-8 py-6">
      {/* Profile Switch Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/travel-profile')}>
          <Avatar className="h-11 w-11">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{user.user_metadata?.username || 'User'}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {user.user_metadata?.username || user.email?.split('@')[0]}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-primary text-xs font-semibold">
          Switch
        </Button>
      </div>

      {/* Suggested For You */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Suggested for you</h3>
          <Button variant="link" size="sm" className="text-xs font-semibold p-0 h-auto">
            See All
          </Button>
        </div>

        {/* Suggested Users List */}
        <div className="space-y-3">
          {suggestedUsers.map((suggestedUser) => (
            <div key={suggestedUser.id} className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1" 
                onClick={() => navigate(`/travel-profile/${suggestedUser.id}`)}
              >
                <Avatar className="h-11 w-11">
                  <AvatarImage src={suggestedUser.avatar_url || undefined} />
                  <AvatarFallback>
                    {suggestedUser.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-semibold truncate">{suggestedUser.username}</span>
                  <span className="text-xs text-muted-foreground">Suggested for you</span>
                </div>
              </div>
              <Button variant="link" size="sm" className="text-primary text-xs font-semibold">
                Follow
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <a href="/community-guidelines" className="hover:underline">About</a>
          <span>·</span>
          <a href="/community-guidelines" className="hover:underline">Help</a>
          <span>·</span>
          <a href="/community-guidelines" className="hover:underline">API</a>
          <span>·</span>
          <a href="/community-guidelines" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="/community-guidelines" className="hover:underline">Terms</a>
        </div>
        <p className="text-xs text-muted-foreground mt-4">© 2025 GOLDSAINTE</p>
      </div>
    </aside>
  );
}
