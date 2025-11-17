// supabase/functions/_shared/notificationHelpers.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export type CreateNotificationInput = {
  user_id: string;
  notification_type: string;
  title: string;
  message?: string | null;
  link?: string | null;
  metadata?: any;
};

export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: input.user_id,
    notification_type: input.notification_type,
    title: input.title,
    message: input.message ?? null,
    link: input.link ?? null,
    metadata: input.metadata ?? null,
    is_read: false,
  });

  if (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
}

export async function createNotifications(
  supabase: SupabaseClient,
  inputs: CreateNotificationInput[]
) {
  const rows = inputs.map((input) => ({
    user_id: input.user_id,
    notification_type: input.notification_type,
    title: input.title,
    message: input.message ?? null,
    link: input.link ?? null,
    metadata: input.metadata ?? null,
    is_read: false,
  }));

  const { error } = await supabase.from('notifications').insert(rows);

  if (error) {
    console.error('Error creating notifications:', error);
    throw new Error('Failed to create notifications');
  }
}
