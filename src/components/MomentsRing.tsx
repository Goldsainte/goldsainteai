import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { MomentsViewer } from "./MomentsViewer";
import { CreateMomentModal } from "./CreateMomentModal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface UserMoment {
  user_id: string;
  username: string;
  avatar_url: string | null;
  moment_count: number;
  latest_moment_id: string;
}

export const MomentsRing = () => {
  const [moments, setMoments] = useState<UserMoment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    fetchCurrentUser();
    fetchMoments();

    // Subscribe to new moments
    const channel = supabase
      .channel('moments_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moments'
        },
        () => {
          fetchMoments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchMoments = async () => {
    try {
      // 1) Get active moments (no embedded join)
      const { data, error } = await supabase
        .from('moments')
        .select(`user_id, id, created_at`)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setMoments([]);
        return;
      }

      // 2) Aggregate by user_id
      const userMoments: Record<string, { latest_moment_id: string; moment_count: number }> = {};
      for (const m of data as Array<{ user_id: string; id: string }>) {
        if (!userMoments[m.user_id]) {
          userMoments[m.user_id] = { latest_moment_id: m.id, moment_count: 0 };
        }
        userMoments[m.user_id].moment_count++;
      }

      const userIds = Object.keys(userMoments);
      if (userIds.length === 0) {
        setMoments([]);
        return;
      }

      // 3) Fetch profiles separately for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // 4) Build final array
      const profileMap = new Map<string, { username: string; avatar_url: string | null }>();
      profiles?.forEach((p: any) => {
        profileMap.set(p.id, { username: p.username, avatar_url: p.avatar_url });
      });

      const result: UserMoment[] = userIds.map((uid) => {
        const profile = profileMap.get(uid);
        return {
          user_id: uid,
          username: profile?.username || 'User',
          avatar_url: profile?.avatar_url || null,
          moment_count: userMoments[uid].moment_count,
          latest_moment_id: userMoments[uid].latest_moment_id,
        };
      });

      setMoments(result);
    } catch (error) {
      console.error('Error fetching moments:', error);
    }
  };

  const handleMomentClick = (userId: string) => {
    setSelectedUserId(userId);
    setViewerOpen(true);
  };

  return (
    <>
      <ScrollArea className="w-full whitespace-nowrap border-b">
        <div className="flex gap-4 p-4">
          {/* Create moment button OR show user's existing moments */}
          {currentUserId && (
            <div
              className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"
              onClick={() => {
                const userMoment = moments.find(m => m.user_id === currentUserId);
                if (userMoment) {
                  handleMomentClick(currentUserId);
                } else {
                  setCreateOpen(true);
                }
              }}
            >
              <div className="relative">
                <Avatar className={`w-16 h-16 ${moments.find(m => m.user_id === currentUserId) ? 'ring-4 ring-gradient-gold ring-offset-2 ring-offset-background' : 'ring-2 ring-muted'}`}>
                  <AvatarImage src={moments.find(m => m.user_id === currentUserId)?.avatar_url || undefined} />
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
                {!moments.find(m => m.user_id === currentUserId) && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center ring-2 ring-background">
                    <Plus className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium">
                {moments.find(m => m.user_id === currentUserId) ? 'Your Moment' : 'Add Moment'}
              </span>
            </div>
          )}

          {/* Other users' moments */}
          {moments
            .filter(m => m.user_id !== currentUserId)
            .map((moment) => (
              <div
                key={moment.user_id}
                className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"
                onClick={() => handleMomentClick(moment.user_id)}
              >
                <Avatar className="w-16 h-16 ring-2 ring-primary">
                  <AvatarImage src={moment.avatar_url || undefined} />
                  <AvatarFallback>{moment.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate max-w-[80px]">
                  {moment.username}
                </span>
                {moment.moment_count > 1 && (
                  <span className="text-xs text-muted-foreground">
                    {moment.moment_count} moments
                  </span>
                )}
              </div>
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <MomentsViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        userId={selectedUserId}
      />

      <CreateMomentModal
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
};
