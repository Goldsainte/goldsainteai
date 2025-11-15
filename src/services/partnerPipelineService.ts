// src/services/partnerPipelineService.ts
import { supabase } from "@/integrations/supabase/client";

export async function getMyPartnerPipeline() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // 1) Proposals this user has sent (pipeline before booking)
  const { data: proposals, error: proposalsError } = await supabase
    .from("trip_proposals")
    .select(`
      id,
      status,
      price_from,
      message,
      created_at,
      trip_request_id,
      trips!trip_proposals_trip_request_id_fkey (
        title,
        destination,
        start_date,
        end_date,
        status
      )
    `)
    .eq("proposer_id", user.id)
    .order("created_at", { ascending: false });

  if (proposalsError) {
    console.error(proposalsError);
  }

  // 2) Bookings where this user is agent or creator
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      total_amount,
      currency,
      created_at,
      trip_id,
      trips (
        title,
        destination,
        start_date,
        end_date
      )
    `)
    .or(`agent_id.eq.${user.id},creator_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (bookingsError) {
    console.error(bookingsError);
  }

  return {
    proposals: proposals ?? [],
    bookings: bookings ?? [],
  };
}
