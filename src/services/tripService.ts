// src/services/tripService.ts
import { supabase } from "@/integrations/supabase/client";

export type Trip = {
  id: string;
  traveler_id: string;
  title: string | null;
  description: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  travelers_count: number | null;
  budget_range: string | null;
  status: "open" | "matched" | "in_progress" | "completed" | "canceled";
  created_at: string;
  updated_at: string;
};

export async function createTrip(input: {
  title: string;
  description: string;
  destination: string;
  start_date?: string;
  end_date?: string;
  travelers_count?: number;
  budget_range?: string;
}) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("You must be signed in to post a trip.");
  }

  const { data, error } = await supabase
    .from("trips" as any)
    .insert({
      traveler_id: user.id,
      title: input.title,
      description: input.description,
      destination: input.destination,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      travelers_count: input.travelers_count ?? null,
      budget_range: input.budget_range || null,
    } as any)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating trip", error);
    throw new Error("Could not create trip.");
  }

  // Create chat thread for this trip
  const { error: threadError } = await supabase
    .from("chat_threads" as any)
    .insert({ trip_id: (data as any).id } as any);

  if (threadError) {
    console.warn("Chat thread creation failed", threadError);
  }

  // Optionally: notify the traveler themself
  await supabase.from("notifications" as any).insert({
    user_id: user.id,
    type: "trip_posted",
    payload: { trip_id: (data as any).id, title: input.title },
  } as any);

  // Later we'll add AI matching & notify agents/creators here.

  return data as unknown as Trip;
}

export async function getMyTrips(): Promise<Trip[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("trips" as any)
    .select("*")
    .eq("traveler_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading trips", error);
    throw new Error("Could not load your trips.");
  }

  return (data ?? []) as unknown as Trip[];
}

export async function getOpenTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips" as any)
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading open trips", error);
    throw new Error("Could not load open trips.");
  }

  return (data ?? []) as unknown as Trip[];
}
