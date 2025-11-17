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

export type StoryboardScene = {
  id: string;
  media_url: string | null;
  caption: string | null;
  order_index: number | null;
};

export type StoryboardPublic = {
  id: string;
  slug: string | null;
  title: string | null;
  destination: string | null;
  hero_image_url: string | null;
  theme_tags: string[] | null;
  owner: {
    id: string;
    display_name: string | null;
    avatar_url?: string | null;
  } | null;
  scenes: StoryboardScene[];
};

export async function getStoryboardPublicBySlugOrId(
  slugOrId: string
): Promise<StoryboardPublic | null> {
  // Try slug first
  const { data: slugData, error } = await supabase
    .from("storyboards")
    .select(
      `
      id,
      slug,
      title,
      destination,
      hero_image_url,
      theme_tags,
      owner_id
    `
    )
    .eq("slug", slugOrId)
    .maybeSingle();

  let data = slugData;

  if (error) {
    console.error("Error loading storyboard by slug", error);
  }

  // If not found by slug, try by id
  if (!data) {
    const { data: byId, error: byIdError } = await supabase
      .from("storyboards")
      .select(
        `
        id,
        slug,
        title,
        destination,
        hero_image_url,
        theme_tags,
        owner_id
      `
      )
      .eq("id", slugOrId)
      .maybeSingle();

    if (byIdError) {
      console.error("Error loading storyboard by id", byIdError);
      throw new Error("Could not load storyboard.");
    }
    data = byId;
  }

  if (!data) return null;

  // Fetch owner profile
  let owner = null;
  if (data.owner_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", data.owner_id)
      .maybeSingle();
    owner = profile;
  }

  // Fetch storyboard scenes
  const { data: items } = await supabase
    .from("storyboard_items")
    .select("id, media_url, caption, order_index")
    .eq("storyboard_id", data.id)
    .order("order_index", { ascending: true });

  const scenes: StoryboardScene[] = (items || []).map((item) => ({
    id: item.id,
    media_url: item.media_url,
    caption: item.caption,
    order_index: item.order_index,
  }));

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    destination: data.destination,
    hero_image_url: data.hero_image_url,
    theme_tags: data.theme_tags,
    owner,
    scenes,
  };
}
