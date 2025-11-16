// src/services/accountHealthService.ts
import { supabase } from "@/integrations/supabase/client";

export type AccountHealthSummary = {
  user_id: string;
  reports_against_count: number;
  safety_events_count: number;
  last_report_at: string | null;
  last_safety_event_at: string | null;
};

export async function getAccountHealthSummary(): Promise<AccountHealthSummary | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const userId = user.id;

  const [{ data: reportsData }, { data: safetyData }] = await Promise.all([
    supabase
      .from("reports")
      .select("id, created_at")
      .eq("reported_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("chat_safety_events")
      .select("id, created_at")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const reports = reportsData || [];
  const events = safetyData || [];

  return {
    user_id: userId,
    reports_against_count: reports.length,
    safety_events_count: events.length,
    last_report_at: reports[0]?.created_at ?? null,
    last_safety_event_at: events[0]?.created_at ?? null,
  };
}
