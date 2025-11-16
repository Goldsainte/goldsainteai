// src/services/adminSafetyService.ts
import { supabase } from "@/integrations/supabase/client";

export type AdminReport = {
  id: string;
  created_at: string;
  report_type: string;
  description: string | null;
  status: string;
  reporter_id: string;
  reported_user_id: string | null;
  conversation_id: string | null;
  booking_id: string | null;
};

export type AdminSafetyEvent = {
  id: string;
  created_at: string;
  event_type: string;
  reasons: string[];
  original_text: string;
  conversation_id: string;
  sender_id: string;
};

export async function getRecentReports(): Promise<AdminReport[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error loading reports", error);
    throw new Error("Could not load reports.");
  }

  return (data || []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    report_type: row.report_type,
    description: row.description,
    status: row.status,
    reporter_id: row.reporter_id,
    reported_user_id: row.reported_user_id,
    conversation_id: row.conversation_id,
    booking_id: row.booking_id,
  }));
}

export async function getRecentSafetyEvents(): Promise<AdminSafetyEvent[]> {
  const { data, error } = await supabase
    .from("chat_safety_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error loading safety events", error);
    throw new Error("Could not load safety events.");
  }

  return (data || []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    event_type: row.event_type,
    reasons: row.reasons || [],
    original_text: row.original_text,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
  }));
}
