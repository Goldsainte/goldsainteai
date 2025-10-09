import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SuggestedUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_verified?: boolean;
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

    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, is_verified')
      .neq('id', user.id)
      .limit(5);

    if (data) {
      setSuggestions(data);
    }
  };

  if (!user) return null;

  return (
    <aside className="w-80 h-screen sticky top-0 p-6">
      <div className="space-y-6">
        {/* Current User */}
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80"
            onClick={() => navigate('/travel-profile')}
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
                onClick={() => navigate(`/travel-profile/${suggestion.id}`)}
              >
                <Avatar className="h-11 w-11 flex-shrink-0">
                  <AvatarImage src={suggestion.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10">
                    {suggestion.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {suggestion.username || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Suggested for you
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary text-xs font-semibold hover:text-primary/80 flex-shrink-0"
              >
                Follow
              </Button>
            </div>
          ))}
        </div>

        {/* Footer Links */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4">
          <div className="flex flex-wrap gap-1">
            <span className="hover:underline cursor-pointer">About</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">Help</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">Press</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">API</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">Jobs</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">Privacy</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="hover:underline cursor-pointer">Terms</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">Locations</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">Language</span>
          </div>
          <p className="pt-4">© 2025 GOLDSAINTE</p>
        </div>
      </div>
    </aside>
  );
}
