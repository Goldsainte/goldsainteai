import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export type CreateNotificationInput = {
  user_id: string;
  type: string;
  title: string;
  message?: string | null;
  action_url?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
};

export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    action_url: input.action_url ?? null,
    entity_type: input.entity_type ?? null,
    entity_id: input.entity_id ?? null,
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
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    action_url: input.action_url ?? null,
    entity_type: input.entity_type ?? null,
    entity_id: input.entity_id ?? null,
    is_read: false,
  }));

  const { error } = await supabase.from('notifications').insert(rows);

  if (error) {
    console.error('Error creating notifications:', error);
    throw new Error('Failed to create notifications');
  }
}
