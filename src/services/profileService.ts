import { supabase } from "@/integrations/supabase/client";

export type CreatorOnboardingPayload = {
  display_name: string;
  tiktok_handle: string;
  home_base?: string;
  creator_niches: string[];
  creator_budget_levels: string[];
  creator_pov?: string;
};

export async function saveCreatorOnboarding(
  payload: CreatorOnboardingPayload
) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("You must be signed in to continue.");
  }

  const update = {
    display_name: payload.display_name,
    tiktok_handle: payload.tiktok_handle || null,
    home_base: payload.home_base || null,
    creator_niches: payload.creator_niches,
    creator_budget_levels: payload.creator_budget_levels,
    creator_pov: payload.creator_pov || null,
    role: "creator",
    account_type: "creator", // Set account_type to match the role
    has_completed_creator_onboarding: true,
  };

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    console.error("Error saving creator onboarding", error);
    throw new Error("We couldn't save your onboarding details.");
  }
}
