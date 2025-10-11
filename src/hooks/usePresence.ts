import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserPresence {
  user_id: string;
  status: 'online' | 'offline';
  last_seen_at: string;
}

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [presenceData, setPresenceData] = useState<Map<string, UserPresence>>(new Map());

  useEffect(() => {
    if (!user) return;

    // Create presence channel
    const channel = supabase.channel('online-users');

    // Subscribe to presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        const presenceMap = new Map<string, UserPresence>();

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            online.add(presence.user_id);
            presenceMap.set(presence.user_id, presence);
          });
        });

        setOnlineUsers(online);
        setPresenceData(presenceMap);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          setOnlineUsers(prev => new Set(prev).add(presence.user_id));
          setPresenceData(prev => new Map(prev).set(presence.user_id, presence));
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          setOnlineUsers(prev => {
            const next = new Set(prev);
            next.delete(presence.user_id);
            return next;
          });
          setPresenceData(prev => {
            const next = new Map(prev);
            next.delete(presence.user_id);
            return next;
          });
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user_id: user.id,
            status: 'online',
            last_seen_at: new Date().toISOString(),
          });

          // Update database presence
          await supabase
            .from('user_presence')
            .upsert({
              user_id: user.id,
              status: 'online',
              last_seen_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });
        }
      });

    // Update presence every 30 seconds
    const interval = setInterval(async () => {
      await channel.track({
        user_id: user.id,
        status: 'online',
        last_seen_at: new Date().toISOString(),
      });

      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: 'online',
          last_seen_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });
    }, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      
      // Mark as offline
      supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: 'offline',
          last_seen_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .then(() => {
          channel.untrack();
          supabase.removeChannel(channel);
        });
    };
  }, [user]);

  const isUserOnline = (userId: string) => onlineUsers.has(userId);
  
  const getUserPresence = (userId: string) => presenceData.get(userId);

  const getLastSeen = (userId: string) => {
    const presence = presenceData.get(userId);
    if (!presence) return null;
    
    const lastSeen = new Date(presence.last_seen_at);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return {
    isUserOnline,
    getUserPresence,
    getLastSeen,
    onlineUsers: Array.from(onlineUsers),
  };
};
