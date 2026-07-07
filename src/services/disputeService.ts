// Dispute service for booking issues and cancellations
import { supabase } from "@/integrations/supabase/client";

export async function createDispute(params: {
  bookingId: string;
  reason: string;
}) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be signed in.");

  const { data, error } = await supabase
    .from("disputes")
    .insert({
      booking_id: params.bookingId,
      raised_by: user.id,
      reason: params.reason,
      status: "open",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error(error);
    throw new Error("Could not create dispute.");
  }

  // Update booking status to disputed. Real bookings live in trip_bookings
  // (the `bookings` table is legacy/empty), so update there.
  await supabase
    .from("trip_bookings")
    .update({ status: "disputed" })
    .eq("id", params.bookingId);

  return data;
}

export async function getBookingDisputes(bookingId: string) {
  const { data, error } = await supabase
    .from("disputes")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("Could not load disputes.");
  }
  
  return data ?? [];
}
