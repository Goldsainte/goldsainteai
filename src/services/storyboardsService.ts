// src/services/storyboardsService.ts
import { supabase } from "@/integrations/supabase/client";

export type StoryboardForPrefill = {
  id: string;
  title: string | null;
  destination: string | null;
  default_starts_on: string | null;
  default_ends_on: string | null;
  default_budget_min: number | null;
  default_budget_max: number | null;
  default_budget_level: string | null;
  default_pace: string | null;
  default_interests: string[] | null;
};

export async function getStoryboardForPrefill(
  id: string
): Promise<StoryboardForPrefill | null> {
  // Note: The storyboard table doesn't currently have prefill fields
  // This function will need database schema updates to work properly
  // For now, just fetch basic storyboard info
  const { data, error } = await supabase
    .from("storyboards")
    .select("id, title, description")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error loading storyboard for prefill", error);
    throw new Error("Could not load storyboard.");
  }

  if (!data) return null;

  // Return minimal data until schema is updated
  return {
    id: data.id,
    title: data.title,
    destination: null,
    default_starts_on: null,
    default_ends_on: null,
    default_budget_min: null,
    default_budget_max: null,
    default_budget_level: null,
    default_pace: null,
    default_interests: null,
  };
}
