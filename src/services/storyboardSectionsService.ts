import { supabase } from "@/integrations/supabase/client";

export interface StoryboardSection {
  id: string;
  storyboard_id: string;
  title: string;
  section_type: string;
  position: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Get all sections for a storyboard
export async function getSections(storyboardId: string): Promise<StoryboardSection[]> {
  const { data, error } = await supabase
    .from("storyboard_sections")
    .select("*")
    .eq("storyboard_id", storyboardId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data || []) as StoryboardSection[];
}

// Create a section
export async function createSection(params: {
  storyboardId: string;
  title: string;
  sectionType?: string;
  description?: string;
  position?: number;
}): Promise<StoryboardSection> {
  let position = params.position;
  if (position === undefined) {
    const { data: existing } = await supabase
      .from("storyboard_sections")
      .select("position")
      .eq("storyboard_id", params.storyboardId)
      .order("position", { ascending: false })
      .limit(1);
    position = existing?.[0]?.position != null ? existing[0].position + 1 : 0;
  }

  const { data, error } = await supabase
    .from("storyboard_sections")
    .insert({
      storyboard_id: params.storyboardId,
      title: params.title,
      section_type: params.sectionType || "day",
      description: params.description || null,
      position,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as StoryboardSection;
}

// Update a section
export async function updateSection(
  id: string,
  updates: Partial<Pick<StoryboardSection, "title" | "description" | "section_type" | "position">>
): Promise<StoryboardSection> {
  const { data, error } = await supabase
    .from("storyboard_sections")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as StoryboardSection;
}

// Delete a section
export async function deleteSection(id: string): Promise<void> {
  const { error } = await supabase
    .from("storyboard_sections")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
