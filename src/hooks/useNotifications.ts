import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'booking' | 'payment' | 'message' | 'milestone' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  data?: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch notifications
  const fetchNotifications = async (unreadOnly = false) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-notifications', {
        body: { action: 'list', unread: unreadOnly },
      });
      if (error) throw error;
      setNotifications((data as any)?.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-notifications', {
        body: { action: 'count' },
      });
      if (error) throw error;
      setUnreadCount((data as any)?.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.functions.invoke('get-notifications', {
        body: { action: 'markRead', id: notificationId },
      });
      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.functions.invoke('get-notifications', {
        body: { action: 'markAllRead' },
      });
      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    let channel: any = null;
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await fetchNotifications();
          await fetchUnreadCount();

          // Subscribe to new notifications
          channel = supabase
            .channel('notifications')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${session.user.id}`,
              },
              (payload) => {
                const newNotification = payload.new as Notification;
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Show toast for high priority notifications
                if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
                  toast({
                    title: newNotification.title,
                    description: newNotification.body,
                  });
                }
              }
            )
            .subscribe();
        } else if (event === 'SIGNED_OUT') {
          setNotifications([]);
          setUnreadCount(0);
          if (channel) {
            channel.unsubscribe();
            channel = null;
          }
        }
      }
    );

    return () => {
      authSubscription.unsubscribe();
      if (channel) channel.unsubscribe();
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
}
