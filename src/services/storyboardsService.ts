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
  const { data, error } = await supabase
    .from("storyboards")
    .select(
      `
      id,
      title,
      destination,
      default_starts_on,
      default_ends_on,
      default_budget_min,
      default_budget_max,
      default_budget_level,
      default_pace,
      default_interests
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error loading storyboard for prefill", error);
    throw new Error("Could not load storyboard.");
  }

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    destination: data.destination,
    default_starts_on: data.default_starts_on,
    default_ends_on: data.default_ends_on,
    default_budget_min: data.default_budget_min,
    default_budget_max: data.default_budget_max,
    default_budget_level: data.default_budget_level,
    default_pace: data.default_pace,
    default_interests: data.default_interests,
  };
}
