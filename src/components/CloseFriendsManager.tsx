import { useState, useEffect } from 'react';
import { useCloseFriends } from '@/hooks/useCloseFriends';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Search, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CloseFriendsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export const CloseFriendsManager = ({ open, onOpenChange }: CloseFriendsManagerProps) => {
  const { user } = useAuth();
  const { closeFriends, toggleCloseFriend, isCloseFriend } = useCloseFriends();
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchFollowers();
    }
  }, [open, user]);

  const fetchFollowers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get users who follow you
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', user.id);

      if (followError) throw followError;

      const followerIds = followData?.map(f => f.follower_id) || [];

      if (followerIds.length === 0) {
        setFollowers([]);
        return;
      }

      // Get profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', followerIds);

      if (profilesError) throw profilesError;

      setFollowers(profiles || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFollowers = followers.filter(profile =>
    profile.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-dashboard-bg fill-dashboard-bg" />
            Close Friends
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Share stories with your close friends only. They won't be notified that you added them.
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredFollowers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No results found' : 'No followers yet'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFollowers.map((profile) => {
                  const inCloseFriends = isCloseFriend(profile.id);
                  
                  return (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>
                            {profile.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{profile.username || 'Anonymous'}</p>
                        </div>
                      </div>

                      <Button
                        variant={inCloseFriends ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleCloseFriend(profile.id)}
                        className={inCloseFriends ? 'gap-2' : ''}
                      >
                        {inCloseFriends ? (
                          <>
                            <Star className="h-4 w-4 fill-current" />
                            Remove
                          </>
                        ) : (
                          'Add'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
