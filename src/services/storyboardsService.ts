import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Type exports
export type StoryboardRow = Database["public"]["Tables"]["storyboards"]["Row"];
export type StoryboardInsert = Database["public"]["Tables"]["storyboards"]["Insert"];
export type StoryboardUpdate = Database["public"]["Tables"]["storyboards"]["Update"];
export type StoryboardItemRow = Database["public"]["Tables"]["storyboard_items"]["Row"];
export type StoryboardItemInsert = Database["public"]["Tables"]["storyboard_items"]["Insert"];

export type Storyboard = StoryboardRow & {
  items?: StoryboardItemRow[];
  items_count?: number;
};

// Get all storyboards for a user
export async function getMyStoryboards(userId: string): Promise<Storyboard[]> {
  const { data, error } = await supabase
    .from("storyboards")
    .select(`
      *,
      items:storyboard_items(count)
    `)
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  
  // Transform the count response
  return (data || []).map(board => ({
    ...board,
    items_count: board.items?.[0]?.count || 0,
    items: undefined
  })) as Storyboard[];
}

// Get public storyboards (for discovery)
export async function getPublicStoryboards(): Promise<Storyboard[]> {
  const { data, error } = await supabase
    .from("storyboards")
    .select(`
      *,
      items:storyboard_items(count)
    `)
    .eq("is_public", true)
    .order("view_count", { ascending: false })
    .limit(20);

  if (error) throw error;
  
  return (data || []).map(board => ({
    ...board,
    items_count: board.items?.[0]?.count || 0,
    items: undefined
  })) as Storyboard[];
}

// Get a single storyboard by ID with all items
export async function getStoryboardById(id: string): Promise<Storyboard | null> {
  const { data, error } = await supabase
    .from("storyboards")
    .select(`
      *,
      storyboard_items(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  
  // Sort items by position
  if (data?.storyboard_items) {
    data.storyboard_items.sort((a, b) => a.position - b.position);
  }
  
  return {
    ...data,
    items: data.storyboard_items
  } as Storyboard;
}

// Create a new storyboard
export async function createStoryboard(params: {
  ownerId: string;
  role: "creator" | "traveler";
  title: string;
  description?: string;
  originalStoryboardId?: string | null;
  sourceCreatorId?: string | null;
  isPublic?: boolean;
  status?: string;
}): Promise<StoryboardRow> {
  const { data, error } = await supabase
    .from("storyboards")
    .insert({
      owner_id: params.ownerId,
      role: params.role,
      title: params.title,
      description: params.description || null,
      original_storyboard_id: params.originalStoryboardId || null,
      source_creator_id: params.sourceCreatorId || null,
      is_public: params.isPublic || false,
      status: params.status || "draft",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as StoryboardRow;
}

// Update a storyboard
export async function updateStoryboard(
  id: string,
  updates: Partial<StoryboardUpdate>
): Promise<StoryboardRow> {
  const { data, error } = await supabase
    .from("storyboards")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as StoryboardRow;
}

// Delete a storyboard
export async function deleteStoryboard(id: string): Promise<void> {
  const { error } = await supabase
    .from("storyboards")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Add an item to a storyboard
export async function addStoryboardItem(params: {
  storyboardId: string;
  itemType: "image" | "creator" | "agent" | "brand" | "note" | "video";
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  sourceType?: string;
  sourceId?: string;
  metadata?: Record<string, any>;
  position?: number;
}): Promise<StoryboardItemRow> {
  // Get the current max position if not provided
  let position = params.position;
  if (position === undefined) {
    const { data: items } = await supabase
      .from("storyboard_items")
      .select("position")
      .eq("storyboard_id", params.storyboardId)
      .order("position", { ascending: false })
      .limit(1);
    
    position = items?.[0]?.position ? items[0].position + 1 : 0;
  }

  const { data, error } = await supabase
    .from("storyboard_items")
    .insert({
      storyboard_id: params.storyboardId,
      item_type: params.itemType,
      title: params.title || null,
      subtitle: params.subtitle || null,
      description: params.description || null,
      image_url: params.imageUrl || null,
      video_url: params.videoUrl || null,
      source_type: params.sourceType || null,
      source_id: params.sourceId || null,
      metadata: params.metadata || {},
      position,
    })
    .select("*")
    .single();

  if (error) throw error;
  
  // Update the storyboard's updated_at timestamp
  await supabase
    .from("storyboards")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", params.storyboardId);

  return data as StoryboardItemRow;
}

// Remove an item from a storyboard
export async function removeStoryboardItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from("storyboard_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}

// Reorder items in a storyboard
export async function reorderStoryboardItems(
  storyboardId: string,
  itemIds: string[]
): Promise<void> {
  const updates = itemIds.map((id, index) => ({
    id,
    position: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from("storyboard_items")
      .update({ position: update.position })
      .eq("id", update.id)
      .eq("storyboard_id", storyboardId);

    if (error) throw error;
  }
}

// Fork a storyboard (copy from creator to traveler)
export async function forkStoryboard(params: {
  originalStoryboardId: string;
  userId: string;
  title?: string;
}): Promise<StoryboardRow> {
  // Get the original storyboard with items
  const original = await getStoryboardById(params.originalStoryboardId);
  if (!original) throw new Error("Original storyboard not found");

  // Create the new storyboard
  const newBoard = await createStoryboard({
    ownerId: params.userId,
    role: "traveler",
    title: params.title || `${original.title} (Copy)`,
    description: original.description,
    originalStoryboardId: original.id,
    sourceCreatorId: original.owner_id,
  });

  // Copy all items
  if (original.items && original.items.length > 0) {
    for (const item of original.items) {
      await addStoryboardItem({
        storyboardId: newBoard.id,
        itemType: item.item_type as any,
        title: item.title || undefined,
        subtitle: item.subtitle || undefined,
        description: item.description || undefined,
        imageUrl: item.image_url || undefined,
        videoUrl: item.video_url || undefined,
        sourceType: item.source_type || undefined,
        sourceId: item.source_id || undefined,
        metadata: (item.metadata as Record<string, any>) || {},
        position: item.position,
      });
    }
  }

  return newBoard;
}

// Convert storyboard to trip request
export async function convertStoryboardToTripRequest(params: {
  storyboardId: string;
  userId: string;
  destination?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  travelersCount?: number;
}): Promise<{ tripRequestId: string }> {
  const storyboard = await getStoryboardById(params.storyboardId);
  if (!storyboard) throw new Error("Storyboard not found");

  // Create trip request with storyboard data
  const { data: trip, error: tripError } = await supabase
    .from("trip_requests")
    .insert({
      user_id: params.userId,
      title: storyboard.title,
      description: storyboard.description || "Trip inspired by my Goldsainte storyboard",
      destination: params.destination || null,
      budget_min: params.budget ? Math.round(params.budget * 0.8) : null,
      budget_max: params.budget || null,
      start_date: params.startDate || null,
      end_date: params.endDate || null,
      travelers_adults: params.travelersCount || 2,
      status: "open",
      source: "storyboard",
      source_metadata: {
        storyboard_id: storyboard.id,
        items_count: storyboard.items?.length || 0,
      },
    })
    .select("id")
    .single();

  if (tripError) throw tripError;

  // Link storyboard to trip request
  await updateStoryboard(storyboard.id, {
    trip_request_id: trip.id
  });

  return { tripRequestId: trip.id };
}

// Get storyboard by slug (falls back to ID)
export async function getStoryboardBySlug(slugOrId: string): Promise<Storyboard | null> {
  // Try slug first
  const { data: bySlug, error: slugError } = await supabase
    .from("storyboards")
    .select(`*, storyboard_items(*)`)
    .eq("slug", slugOrId)
    .maybeSingle();

  if (bySlug) {
    if (bySlug.storyboard_items) {
      bySlug.storyboard_items.sort((a: any, b: any) => a.position - b.position);
    }
    return { ...bySlug, items: bySlug.storyboard_items } as Storyboard;
  }

  // Fallback to ID lookup
  return getStoryboardById(slugOrId);
}

// Increment view count
export async function incrementStoryboardViewCount(id: string): Promise<void> {
  // Simple direct increment
  const { data } = await supabase
    .from("storyboards")
    .select("view_count")
    .eq("id", id)
    .single();

  if (data) {
    await supabase
      .from("storyboards")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id);
  }
}

export type StoryboardPublic = Storyboard;

// Get public storyboard by ID (for sharing) - legacy alias
export async function getStoryboardPublicBySlugOrId(id: string): Promise<Storyboard | null> {
  return getStoryboardBySlug(id);
}

// Get or create default storyboard for a user
export async function getOrCreateDefaultStoryboard(userId: string): Promise<StoryboardRow> {
  const boards = await getMyStoryboards(userId);
  let defaultBoard = boards.find(b => b.role === "traveler");

  if (!defaultBoard) {
    defaultBoard = await createStoryboard({
      ownerId: userId,
      role: "traveler",
      title: "My Goldsainte Collection",
      description: "Inspiration for my next luxury adventure"
    });
  }

  return defaultBoard;
}
