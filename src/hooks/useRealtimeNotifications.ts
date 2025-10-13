import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRealtimeNotifications = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    // Subscribe to notifications for this user
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const notification = payload.new as any;
        
        // Show toast notification
        toast.info(notification.message, {
          description: new Date(notification.created_at).toLocaleString(),
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};