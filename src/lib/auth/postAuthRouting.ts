/**
 * Centralized post-authentication routing logic
 * Determines where users should be redirected after login based on their account type
 */

export type AccountType = "traveler" | "creator" | "agent" | "brand";

export function getPostAuthDestination(
  accountType: string | null | undefined,
  onboardingCompleted?: boolean
): string {
  if (accountType === "creator" || accountType === "agent") {
    return "/partner";
  }
  
  if (accountType === "brand") {
    return onboardingCompleted ? "/console/brand" : "/brand/onboarding";
  }
  
  // Default: traveler goes to onboarding to set preferences
  return "/onboarding";
}

/**
 * Check if user needs onboarding based on their profile state
 */
export function needsOnboarding(profile: {
  account_type?: string | null;
  is_profile_complete?: boolean | null;
  onboarding_completed?: boolean | null;
}): boolean {
  // If no account type set, they need to complete profile
  if (!profile.account_type) {
    return true;
  }
  
  // Travelers need to complete preferences onboarding
  if (profile.account_type === "traveler" && !profile.onboarding_completed) {
    return true;
  }
  
  // Other account types check is_profile_complete
  if (!profile.is_profile_complete) {
    return true;
  }
  
  return false;
}
