import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type NotificationPayload = {
  id?: string;
  message: string;
  created_at?: string;
};

const RATE_LIMIT_MS = Number(import.meta.env.VITE_NOTIFICATION_THROTTLE_MS ?? '2000');
const MAX_QUEUE_LENGTH = Number(import.meta.env.VITE_NOTIFICATION_QUEUE_SIZE ?? '5');

export const useRealtimeNotifications = (userId: string | undefined) => {
  const queueRef = useRef<NotificationPayload[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const lastShownRef = useRef<number>(0);

  useEffect(() => {
    if (!userId) return;

    const flushQueue = () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }

      if (queueRef.current.length === 0) {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastShownRef.current;

      if (elapsed < RATE_LIMIT_MS) {
        flushTimerRef.current = setTimeout(flushQueue, RATE_LIMIT_MS - elapsed);
        return;
      }

      const next = queueRef.current.shift();
      if (!next) {
        return;
      }

      lastShownRef.current = Date.now();
      toast.info(next.message, {
        description: next.created_at
          ? new Date(next.created_at).toLocaleString()
          : undefined,
      });

      if (queueRef.current.length > 0) {
        flushTimerRef.current = setTimeout(flushQueue, RATE_LIMIT_MS);
      }
    };

    const enqueueNotification = (notification: NotificationPayload) => {
      const id = notification.id || `${notification.message}-${notification.created_at}`;
      if (id && seenRef.current.has(id)) {
        return;
      }

      if (id) {
        seenRef.current.add(id);
        if (seenRef.current.size > 100) {
          const [first] = Array.from(seenRef.current);
          seenRef.current.delete(first);
        }
      }

      queueRef.current.push(notification);

      if (queueRef.current.length > MAX_QUEUE_LENGTH) {
        queueRef.current.splice(0, queueRef.current.length - MAX_QUEUE_LENGTH);
      }

      flushQueue();
    };

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const notification = payload.new as NotificationPayload;
        enqueueNotification(notification);
      })
      .subscribe();

    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      queueRef.current = [];
      supabase.removeChannel(channel);
    };
  }, [userId]);
};