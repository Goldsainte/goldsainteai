// src/services/storyboardService.ts
import { supabase } from "@/integrations/supabase/client";

export type Storyboard = {
  id: string;
  trip_id: string | null;
  owner_id: string;
  owner_role: "creator" | "agent" | "traveler" | null;
  title: string | null;
  description: string | null;
  theme_tags: string[] | null;
  visibility: "private" | "trip" | "public_template";
};

export type StoryboardItem = {
  id: string;
  storyboard_id: string;
  order_index: number;
  layout_type: "masonry" | "full" | "half" | "third";
  media_url: string | null;
  media_attribution: string | null;
  caption: string | null;
  location_label: string | null;
  day_number: number | null;
  time_of_day: string | null;
  category_tag: string | null;
};

export async function getOrCreateTripStoryboard(tripId: string): Promise<Storyboard> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Authentication required.");

  // Try existing storyboard
  const { data: existing, error: existingError } = await supabase
    .from("storyboards")
    .select("*")
    .eq("trip_id", tripId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("Error loading storyboard", existingError);
  }
  if (existing) return existing as Storyboard;

  // Create one
  const ownerRole =
    (user.user_metadata?.account_type as Storyboard["owner_role"]) ?? null;

  const { data, error } = await supabase
    .from("storyboards")
    .insert({
      trip_id: tripId,
      owner_id: user.id,
      owner_role: ownerRole,
      title: "Trip storyboard",
      visibility: "trip",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating storyboard", error);
    throw new Error("Could not create storyboard.");
  }

  return data as Storyboard;
}

export async function getStoryboardItems(storyboardId: string): Promise<StoryboardItem[]> {
  const { data, error } = await supabase
    .from("storyboard_items")
    .select("*")
    .eq("storyboard_id", storyboardId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error loading storyboard items", error);
    throw new Error("Could not load storyboard items.");
  }

  return (data ?? []) as StoryboardItem[];
}

export async function addStoryboardItem(params: {
  storyboardId: string;
  mediaUrl: string;
  caption?: string;
  categoryTag?: string;
}) {
  const { data, error } = await supabase
    .from("storyboard_items")
    .insert({
      storyboard_id: params.storyboardId,
      media_url: params.mediaUrl,
      caption: params.caption ?? null,
      category_tag: params.categoryTag ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error adding storyboard item", error);
    throw new Error("Could not add tile.");
  }

  return data as StoryboardItem;
}

export async function updateStoryboardItemOrder(
  storyboardId: string,
  items: { id: string; order_index: number }[],
) {
  const updates = items.map((i) =>
    supabase
      .from("storyboard_items")
      .update({ order_index: i.order_index })
      .eq("id", i.id)
      .eq("storyboard_id", storyboardId)
  );

  await Promise.all(updates);
}

export async function deleteStoryboardItem(itemId: string) {
  const { error } = await supabase
    .from("storyboard_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Error deleting storyboard item", error);
    throw new Error("Could not delete item.");
  }
}

export async function updateStoryboardItem(
  itemId: string,
  updates: Partial<Omit<StoryboardItem, "id" | "storyboard_id">>
) {
  const { data, error } = await supabase
    .from("storyboard_items")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating storyboard item", error);
    throw new Error("Could not update item.");
  }

  return data as StoryboardItem;
}
