// Shared notification service for push, web, email, and SMS notifications
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: 'booking' | 'payment' | 'message' | 'milestone' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  data?: Record<string, any>;
}

export interface NotificationChannel {
  push: boolean;
  web: boolean;
  email: boolean;
  sms: boolean;
}

/**
 * Send notification through multiple channels based on user preferences
 */
export async function sendNotification(
  supabase: SupabaseClient,
  payload: NotificationPayload,
  channels?: Partial<NotificationChannel>
): Promise<{ success: boolean; channels: string[]; errors: any[] }> {
  const sentChannels: string[] = [];
  const errors: any[] = [];

  const defaultChannels: NotificationChannel = {
    push: true,
    web: true,
    email: payload.priority === 'high' || payload.priority === 'urgent',
    sms: payload.priority === 'urgent',
    ...channels,
  };

  // Get user notification preferences
  const { data: userPrefs } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', payload.userId)
    .single();

  // Web notification (in-app)
  if (defaultChannels.web && userPrefs?.web_notifications !== false) {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: payload.userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        priority: payload.priority,
        action_url: payload.actionUrl,
        data: payload.data,
        read: false,
      });

      if (error) throw error;
      sentChannels.push('web');
    } catch (error) {
      errors.push({ channel: 'web', error });
    }
  }

  // Push notification (mobile/web push)
  if (defaultChannels.push && userPrefs?.push_notifications !== false) {
    try {
      // Get user's push tokens
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token, platform')
        .eq('user_id', payload.userId)
        .eq('active', true);

      if (tokens && tokens.length > 0) {
        // Send to each registered device
        // Note: Actual push sending would integrate with FCM/APNS
        // For now, we log the intent
        console.log(`[PUSH] Sending to ${tokens.length} devices for user ${payload.userId}`);
        sentChannels.push('push');
      }
    } catch (error) {
      errors.push({ channel: 'push', error });
    }
  }

  // Email notification
  if (defaultChannels.email && userPrefs?.email_notifications !== false) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', payload.userId)
        .single();

      if (profile?.email) {
        // Queue email for sending
        const { error } = await supabase.from('email_queue').insert({
          to_email: profile.email,
          subject: payload.title,
          body: payload.body,
          template: 'notification',
          data: {
            ...payload.data,
            actionUrl: payload.actionUrl,
            type: payload.type,
          },
          priority: payload.priority,
        });

        if (error) throw error;
        sentChannels.push('email');
      }
    } catch (error) {
      errors.push({ channel: 'email', error });
    }
  }

  // SMS notification (for urgent only by default)
  if (defaultChannels.sms && userPrefs?.sms_notifications !== false) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', payload.userId)
        .single();

      if (profile?.phone) {
        // Queue SMS for sending
        const { error } = await supabase.from('sms_queue').insert({
          to_phone: profile.phone,
          message: `${payload.title}: ${payload.body}`,
          data: payload.data,
          priority: payload.priority,
        });

        if (error) throw error;
        sentChannels.push('sms');
      }
    } catch (error) {
      errors.push({ channel: 'sms', error });
    }
  }

  return {
    success: sentChannels.length > 0,
    channels: sentChannels,
    errors,
  };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  return count || 0;
}

/**
 * Mark notification as read
 */
export async function markAsRead(
  supabase: SupabaseClient,
  notificationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  return !error;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('read', false);

  return !error;
}
