/**
 * Centralized post-authentication routing logic
 * Determines where users should be redirected after login based on their account type
 */

export type AccountType = "traveler" | "creator" | "agent" | "brand";

export function getPostAuthDestination(
  accountType: string | null | undefined,
  onboardingCompleted?: boolean,
  isProfileComplete?: boolean
): string {
  // No account type yet → check if legacy user with completion flags
  if (!accountType) {
    // If user is marked as complete, they're a legacy user - send to marketplace
    if (onboardingCompleted || isProfileComplete) {
      return "/marketplace";
    }
    return "/onboarding";
  }

  // Role-specific onboarding checks:
  // - Travelers check onboarding_completed (preferences wizard)
  // - Creators/Agents/Brands check is_profile_complete (application/profile flow)
  
  if (accountType === "traveler") {
    // Travelers go straight to Traveler Hub (no legacy AI intake)
    if (!onboardingCompleted) {
      return "/traveler";
    }
    return "/marketplace";
  }

  // Creators, Agents, Brands — route to role-specific onboarding if incomplete
  if (accountType === "creator" && !isProfileComplete) {
    return "/onboarding/creator";
  }
  // Agents always resume in the application flow until the profile is complete.
  // The application route itself handles the "email not yet verified" case
  // by redirecting to /apply/agent/signup?unverified=1.
  if (accountType === "agent" && !isProfileComplete) {
    return "/apply/agent";
  }
  if (accountType === "brand" && !isProfileComplete) {
    return "/apply/brand";
  }
  if (!isProfileComplete) {
    return "/auth/complete-profile";
  }

  // Fully onboarded → role-based home
  if (accountType === "creator" || accountType === "agent") {
    return "/partner";
  }

  if (accountType === "brand") {
    return "/console/brand";
  }

  // Fallback
  return "/marketplace";
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
