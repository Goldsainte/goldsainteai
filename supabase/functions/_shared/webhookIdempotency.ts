/**
 * Webhook Idempotency Utility
 * Prevents duplicate processing of webhook events
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

export interface WebhookEventRecord {
  event_id: string;
  event_type: string;
  provider?: string;
  payload: Record<string, any>;
  processing_status?: 'success' | 'failed' | 'pending';
  error_message?: string;
}

/**
 * Check if webhook event has already been processed
 */
export async function isEventProcessed(
  supabase: SupabaseClient,
  eventId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return false;
      }
      console.error('[WEBHOOK] Error checking event:', error);
      return false;
    }

    console.log(`[WEBHOOK] Event ${eventId} already processed`);
    return true;
  } catch (error) {
    console.error('[WEBHOOK] Exception checking event:', error);
    return false;
  }
}

/**
 * Record webhook event processing
 */
export async function recordWebhookEvent(
  supabase: SupabaseClient,
  event: WebhookEventRecord
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('webhook_events')
      .insert({
        event_id: event.event_id,
        event_type: event.event_type,
        provider: event.provider || 'stripe',
        payload: event.payload,
        processing_status: event.processing_status || 'success',
        error_message: event.error_message,
        processed_at: new Date().toISOString()
      });

    if (error) {
      // If duplicate key error, event was already processed by another instance
      if (error.code === '23505') {
        console.log(`[WEBHOOK] Event ${event.event_id} already recorded (race condition)`);
        return false;
      }
      console.error('[WEBHOOK] Error recording event:', error);
      return false;
    }

    console.log(`[WEBHOOK] Recorded event ${event.event_id}`);
    return true;
  } catch (error) {
    console.error('[WEBHOOK] Exception recording event:', error);
    return false;
  }
}

/**
 * Idempotent webhook handler wrapper
 * Returns true if event should be processed, false if already processed
 */
export async function checkAndRecordWebhook(
  supabase: SupabaseClient,
  eventId: string,
  eventType: string,
  payload: Record<string, any>,
  provider: string = 'stripe'
): Promise<{ shouldProcess: boolean; isNew: boolean }> {
  // Check if already processed
  const alreadyProcessed = await isEventProcessed(supabase, eventId);
  
  if (alreadyProcessed) {
    console.log(`[WEBHOOK] Skipping duplicate event ${eventId}`);
    return { shouldProcess: false, isNew: false };
  }

  // Try to record the event (atomic operation via unique constraint)
  const recorded = await recordWebhookEvent(supabase, {
    event_id: eventId,
    event_type: eventType,
    provider,
    payload,
    processing_status: 'pending'
  });

  if (!recorded) {
    // Another instance already recorded it (race condition)
    console.log(`[WEBHOOK] Event ${eventId} recorded by another instance`);
    return { shouldProcess: false, isNew: false };
  }

  console.log(`[WEBHOOK] New event ${eventId}, proceeding with processing`);
  return { shouldProcess: true, isNew: true };
}

/**
 * Update webhook event status after processing
 */
export async function updateWebhookStatus(
  supabase: SupabaseClient,
  eventId: string,
  status: 'success' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    await supabase
      .from('webhook_events')
      .update({
        processing_status: status,
        error_message: errorMessage,
        processed_at: new Date().toISOString()
      })
      .eq('event_id', eventId);
    
    console.log(`[WEBHOOK] Updated event ${eventId} status to ${status}`);
  } catch (error) {
    console.error('[WEBHOOK] Error updating status:', error);
  }
}
