import { useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPresenceSnapshot,
  markOffline,
  PresenceSnapshot,
  sendPresenceHeartbeat,
  subscribeToPresenceStream,
} from '@/lib/realtime/presence-service';

interface UserPresence {
  user_id: string;
  status: 'online' | 'offline';
  last_seen_at: string;
}

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [presenceData, setPresenceData] = useState<Map<string, UserPresence>>(new Map());
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const HEARTBEAT_INTERVAL_MS = 120000; // 2 minutes between heartbeats
  const MAX_HEARTBEAT_INTERVAL_MS = 600000; // cap exponential backoff at 10 minutes
  const SNAPSHOT_INTERVAL_MS = 300000; // 5-minute snapshot safeguard when SSE is unavailable

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
    let currentHeartbeatInterval = HEARTBEAT_INTERVAL_MS;
    let unsubscribeStream: (() => void) | null = null;

    const clearHeartbeat = () => {
      if (heartbeatTimeout) {
        clearTimeout(heartbeatTimeout);
        heartbeatTimeout = null;
      }
    };

    const applySnapshot = (snapshot: PresenceSnapshot) => {
      const nextOnline = new Set<string>();
      const nextPresence = new Map<string, UserPresence>();

      Object.values(snapshot).forEach((value) => {
        if (!value) return;
        const presence = value as UserPresence;
        nextOnline.add(presence.user_id);
        nextPresence.set(presence.user_id, presence);
      });

      setOnlineUsers(nextOnline);
      setPresenceData(nextPresence);
    };

    const handleSnapshotUpdate = (update: PresenceSnapshot[keyof PresenceSnapshot]) => {
      if (!update) return;
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.add((update as UserPresence).user_id);
        return next;
      });
      setPresenceData(prev => new Map(prev).set((update as UserPresence).user_id, update as UserPresence));
    };

    const removePresence = (update: PresenceSnapshot[keyof PresenceSnapshot]) => {
      if (!update) return;
      const userId = (update as UserPresence).user_id;
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setPresenceData(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    };

    const primeStream = async () => {
      unsubscribeStream = await subscribeToPresenceStream((message) => {
        switch (message.type) {
          case 'snapshot':
            applySnapshot(message.payload as PresenceSnapshot);
            break;
          case 'upsert':
            handleSnapshotUpdate(message.payload as PresenceSnapshot[keyof PresenceSnapshot]);
            break;
          case 'delete':
            removePresence(message.payload as PresenceSnapshot[keyof PresenceSnapshot]);
            break;
          default:
            break;
        }
      });
    };

    const sendHeartbeat = async (status: 'online' | 'offline') => {
      try {
        const heartbeatResponse = await sendPresenceHeartbeat(status);
        if (heartbeatResponse?.nextRecommendedHeartbeatMs) {
          currentHeartbeatInterval = Math.min(
            heartbeatResponse.nextRecommendedHeartbeatMs,
            MAX_HEARTBEAT_INTERVAL_MS,
          );
        } else {
          currentHeartbeatInterval = HEARTBEAT_INTERVAL_MS;
        }
      } catch (error) {
        Sentry.captureException(error, {
          level: 'warning',
          tags: { scope: 'presence', operation: 'heartbeat' },
        });
        currentHeartbeatInterval = Math.min(
          currentHeartbeatInterval * 2,
          MAX_HEARTBEAT_INTERVAL_MS,
        );
      }
    };

    const scheduleHeartbeat = () => {
      clearHeartbeat();
      heartbeatTimeout = setTimeout(async () => {
        if (!isMounted) return;
        await sendHeartbeat('online');
        if (isMounted) {
          scheduleHeartbeat();
        }
      }, currentHeartbeatInterval);
    };

    const bootstrapPresence = async () => {
      try {
        const snapshot = await fetchPresenceSnapshot();
        if (!isMounted || !snapshot) {
          return;
        }
        applySnapshot(snapshot);
      } catch (error) {
        Sentry.captureException(error, {
          level: 'warning',
          tags: { scope: 'presence', operation: 'bootstrap' },
        });
      }
    };

    void bootstrapPresence();
    void primeStream();

    const startSnapshotInterval = () => {
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }

      snapshotIntervalRef.current = setInterval(async () => {
        try {
          const snapshot = await fetchPresenceSnapshot();
          if (!isMounted || !snapshot) {
            return;
          }
          applySnapshot(snapshot);
        } catch (error) {
          Sentry.captureException(error, {
            level: 'info',
            tags: { scope: 'presence', operation: 'poll' },
          });
        }
      }, SNAPSHOT_INTERVAL_MS);
    };

    startSnapshotInterval();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void sendHeartbeat('offline');
      } else {
        void sendHeartbeat('online');
        void bootstrapPresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    void sendHeartbeat('online');
    scheduleHeartbeat();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      clearHeartbeat();
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
        snapshotIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribeStream?.();

      // Mark as offline and cleanup asynchronously
      void sendHeartbeat('offline')
        .catch(() => undefined)
        .finally(() => {
          void markOffline();
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
