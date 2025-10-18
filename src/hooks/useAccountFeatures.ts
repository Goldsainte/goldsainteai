export const useAccountFeatures = (accountType?: string, isBusinessVerified?: boolean) => {
  return {
    // Available for Creator and Business accounts
    hasAnalytics: accountType === 'creator' || accountType === 'business',
    hasContactButtons: accountType === 'creator' || accountType === 'business',
    hasSponsoredLabels: accountType === 'creator' || accountType === 'business',
    
    // Business-only features (requires verification)
    hasShoppingProfile: accountType === 'business' && isBusinessVerified,
    hasBusinessLocation: accountType === 'business' && isBusinessVerified,
    hasGoldBadge: accountType === 'business' && isBusinessVerified,
    
    // General monetization
    canMonetize: accountType !== 'personal',
  };
};
