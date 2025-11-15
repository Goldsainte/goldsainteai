import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import FollowButton from "./FollowButton";
import { SuggestedUsers } from "./SuggestedUsers";
import { DraftPostsManager } from "./DraftPostsManager";
import { InstagramVerifiedBadge } from "@/components/badges/InstagramVerifiedBadge";
import { BusinessVerifiedBadge } from "@/components/badges/BusinessVerifiedBadge";

interface SuggestedUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_verified?: boolean;
  is_business_verified?: boolean;
}

export function FeedSuggestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchCurrentUserProfile();
      fetchSuggestions();
    }
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();
    
    setCurrentUserProfile(data);
  };

  const fetchSuggestions = async () => {
    if (!user) return;

    // Get users that the current user is NOT following
    const { data: following } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = following?.map(f => f.following_id) || [];

    let query = supabase
      .from('profiles')
      .select('id, username, avatar_url, is_verified, is_business_verified')
      .neq('id', user.id);

    // Only apply the filter if there are users being followed
    if (followingIds.length > 0) {
      query = query.not('id', 'in', `(${followingIds.join(',')})`);
    }

    const { data } = await query.limit(5);

    if (data) {
      setSuggestions(data);
    }
  };

  const handleFollowSuccess = (userId: string) => {
    // Remove the followed user from suggestions
    setSuggestions(prev => prev.filter(user => user.id !== userId));
  };

  if (!user) return null;

  return (
    <aside className="w-80 h-screen sticky top-0 p-6">
      <div className="space-y-6">
        {/* Current User */}
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80"
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) navigate(`/creator/${user.id}`);
            }}
          >
            <Avatar className="h-11 w-11">
              <AvatarImage src={currentUserProfile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {currentUserProfile?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{currentUserProfile?.username || 'goldsainteai'}</p>
              <p className="text-xs text-muted-foreground">Goldsainte</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs font-semibold hover:text-primary/80"
            onClick={() => navigate('/auth')}
          >
            Switch
          </Button>
        </div>

        {/* Suggestions Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Suggested for you
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-semibold hover:text-foreground"
          >
            See All
          </Button>
        </div>

        {/* Suggested Users */}
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 flex-1 min-w-0"
                onClick={() => navigate(`/creator/${suggestion.id}`)}
              >
                <Avatar className="h-11 w-11 flex-shrink-0">
                  <AvatarImage src={suggestion.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10">
                    {suggestion.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold truncate">
                      {suggestion.username || 'User'}
                    </p>
                    {suggestion.is_business_verified ? (
                      <BusinessVerifiedBadge />
                    ) : suggestion.is_verified ? (
                      <InstagramVerifiedBadge />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Suggested for you
                  </p>
                </div>
              </div>
              <div className="w-24 flex-shrink-0">
                <FollowButton 
                  targetUserId={suggestion.id} 
                  onFollowSuccess={() => handleFollowSuccess(suggestion.id)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Draft Posts */}
        <DraftPostsManager />

      </div>
    </aside>
  );
}
