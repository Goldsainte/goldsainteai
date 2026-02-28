import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        if (error) {
          console.error("Error loading notifications", error);
          setNotifications([]);
        } else {
          setNotifications(data?.map((n: any) => ({
            id: n.id,
            user_id: n.user_id,
            type: n.type || 'general',
            title: n.title || '',
            message: n.message || '',
            action_url: n.action_url || null,
            entity_type: n.entity_type || null,
            entity_id: n.entity_id || null,
            read: n.is_read ?? false,
            created_at: n.created_at
          })) ?? []);
        }
        setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => { load(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAsRead(notificationId: string) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? {...n, read: true} : n));
  }

  async function markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
