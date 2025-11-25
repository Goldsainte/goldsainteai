// src/services/notificationService.ts
import { supabase } from "@/integrations/supabase/client";

export type Notification = {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: any;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export async function fetchNotifications(limit = 20): Promise<Notification[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error loading notifications", error);
    throw new Error("Could not load notifications.");
  }

  return (data || []).map(n => ({
    id: n.id,
    notification_type: n.type || '',
    title: n.title || '',
    message: n.message,
    link: n.action_url || null,
    metadata: n.entity_type ? { entity_type: n.entity_type, entity_id: n.entity_id } : null,
    is_read: n.is_read,
    read_at: n.read_at,
    created_at: n.created_at,
    updated_at: n.created_at,
    user_id: n.user_id
  }));
}

export async function fetchUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error loading unread count", error);
    return 0;
  }

  return count || 0;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) {
    console.error("Error marking notification read", error);
    throw new Error("Could not mark notification as read.");
  }
}
