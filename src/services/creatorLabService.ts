// src/services/creatorLabService.ts
import { supabase } from "@/integrations/supabase/client";

export type CreatorLabMetrics = {
  storyboard_views_30d: number;
  trip_requests_from_storyboards_30d: number;
  proposals_sent_30d: number;
  bookings_confirmed_30d: number;
  estimated_earnings_30d: number;
  currency: string;
};

export async function getCreatorLabMetrics(): Promise<CreatorLabMetrics> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not signed in.");

  try {
    // Call the RPC function to get metrics
    const { data, error } = await supabase.rpc(
      "get_creator_tiktok_lab_metrics" as any,
      { creator_id_input: user.id }
    );

    if (error) {
      console.error("Error loading creator lab metrics", error);
      // Fallback with zeros rather than throwing
      return {
        storyboard_views_30d: 0,
        trip_requests_from_storyboards_30d: 0,
        proposals_sent_30d: 0,
        bookings_confirmed_30d: 0,
        estimated_earnings_30d: 0,
        currency: "USD",
      };
    }

    // Parse the JSONB response
    const metrics = typeof data === 'string' ? JSON.parse(data) : data;
    
    return {
      storyboard_views_30d: metrics?.storyboard_views_30d ?? 0,
      trip_requests_from_storyboards_30d:
        metrics?.trip_requests_from_storyboards_30d ?? 0,
      proposals_sent_30d: metrics?.proposals_sent_30d ?? 0,
      bookings_confirmed_30d: metrics?.bookings_confirmed_30d ?? 0,
      estimated_earnings_30d: metrics?.estimated_earnings_30d ?? 0,
      currency: metrics?.currency || "USD",
    };
  } catch (err) {
    console.error("Error in getCreatorLabMetrics", err);
    // Fallback with zeros rather than throwing
    return {
      storyboard_views_30d: 0,
      trip_requests_from_storyboards_30d: 0,
      proposals_sent_30d: 0,
      bookings_confirmed_30d: 0,
      estimated_earnings_30d: 0,
      currency: "USD",
    };
  }
}
