export interface RouteInfo {
  path: string;
  label: string;
  description: string;
  category: 'core' | 'booking' | 'social' | 'cocurated' | 'marketplace' | 'commerce' | 'trust' | 'company' | 'admin';
  requiresAuth?: boolean;
  requiresRole?: string;
}

export const siteRoutes: RouteInfo[] = [
  // Core User Pages
  { path: '/', label: 'Home', description: 'Main landing page with AI search', category: 'core' },
  { path: '/auth', label: 'Sign In / Sign Up', description: 'Authentication page', category: 'core' },
  { path: '/login', label: 'Login', description: 'Login page', category: 'core' },
  { path: '/signup', label: 'Sign Up', description: 'Sign up page', category: 'core' },
  { path: '/onboarding', label: 'Onboarding', description: 'First-time user setup', category: 'core', requiresAuth: true },
  { path: '/ai-agent-setup', label: 'AI Agent Setup', description: 'Configure your personal AI agent', category: 'core', requiresAuth: true },
  { path: '/profile', label: 'Profile', description: 'Your account profile', category: 'core', requiresAuth: true },
  { path: '/dashboard', label: 'Dashboard', description: 'View bookings, favorites, and preferences', category: 'core', requiresAuth: true },
  { path: '/billing-dashboard', label: 'Billing', description: 'View billing history and manage payments', category: 'core', requiresAuth: true },
  { path: '/messages', label: 'Messages', description: 'Chat with agents and support', category: 'core', requiresAuth: true },
  
  // Booking & Travel
  { path: '/search-results', label: 'Search Results', description: 'Browse search results', category: 'booking' },
  { path: '/hotel-booking', label: 'Hotel Booking', description: 'Book a hotel', category: 'booking' },
  { path: '/booking-confirmation', label: 'Booking Confirmation', description: 'Confirm your booking', category: 'booking', requiresAuth: true },
  { path: '/my-trips', label: 'My Trips', description: 'View your trips', category: 'booking', requiresAuth: true },
  { path: '/collections', label: 'Collections', description: 'Saved collections', category: 'booking', requiresAuth: true },
  
  // Social / Journeys
  { path: '/travel-feed', label: 'Journeys Feed', description: 'Instagram-style travel content', category: 'social' },
  { path: '/journeys', label: 'Journeys', description: 'Same as Travel Feed', category: 'social' },
  { path: '/travel-profile', label: 'Travel Profile', description: 'Your travel social profile', category: 'social', requiresAuth: true },
  { path: '/travel-settings', label: 'Travel Settings', description: 'Configure profile settings', category: 'social', requiresAuth: true },
  { path: '/creator-dashboard', label: 'Creator Dashboard', description: 'Manage your content', category: 'social', requiresAuth: true },
  { path: '/search', label: 'Search', description: 'Search content', category: 'social' },
  { path: '/trending', label: 'Trending', description: 'Trending travel content', category: 'social' },
  { path: '/browse-creators', label: 'Browse Creators', description: 'Find travel creators', category: 'social' },
  { path: '/tiktok-lab', label: 'TikTok Travel Lab', description: 'Create TikTok-ready travel stories and link them to bookable trips', category: 'social', requiresAuth: true },
  { path: '/tiktok-callback', label: 'TikTok Callback', description: 'OAuth callback handler for TikTok connection', category: 'social', requiresAuth: true },
  
  // CoCurated
  { path: '/cocurated-marketplace', label: 'CoCurated Marketplace', description: 'Expertly designed travel packages', category: 'cocurated' },
  { path: '/cocurated-journeys', label: 'CoCurated Journeys', description: 'CoCurated content feed', category: 'cocurated' },
  { path: '/cocurated-dashboard', label: 'CoCurated Dashboard', description: 'Manage your packages', category: 'cocurated', requiresAuth: true },
  { path: '/cocurated-create', label: 'Create Package', description: 'Create a new CoCurated package', category: 'cocurated', requiresAuth: true },
  
  // Marketplace & Agents
  { path: '/marketplace', label: 'Marketplace', description: 'Browse services and products', category: 'marketplace' },
  { path: '/browse-agents', label: 'Browse Agents', description: 'Find travel agents', category: 'marketplace' },
  { path: '/agent-onboarding', label: 'Become an Agent', description: 'Apply to be a travel agent', category: 'marketplace' },
  { path: '/agent-dashboard', label: 'Agent Dashboard', description: 'Manage agent work', category: 'marketplace', requiresAuth: true, requiresRole: 'agent' },
  { path: '/agent-trip-requests', label: 'Trip Requests', description: 'View trip requests', category: 'marketplace', requiresAuth: true, requiresRole: 'agent' },
  { path: '/agent-performance', label: 'Performance', description: 'View performance metrics', category: 'marketplace', requiresAuth: true, requiresRole: 'agent' },
  { path: '/my-jobs', label: 'My Jobs', description: 'View your jobs', category: 'marketplace', requiresAuth: true },
  
  // Commerce
  { path: '/shop', label: 'Shop', description: 'Browse products', category: 'commerce' },
  { path: '/affiliate-manager', label: 'Affiliate Manager', description: 'Manage affiliate links', category: 'commerce', requiresAuth: true },
  { path: '/commission-dashboard', label: 'Commission Dashboard', description: 'View earnings', category: 'commerce', requiresAuth: true },
  
  // Transportation Vendors
  { path: '/transportation-vendor-partners', label: 'Vendor Partners', description: 'Transportation vendor info', category: 'marketplace' },
  { path: '/transportation-vendor-application', label: 'Vendor Application', description: 'Apply as vendor', category: 'marketplace' },
  { path: '/transportation-vendor-dashboard', label: 'Vendor Dashboard', description: 'Manage vendor services', category: 'marketplace', requiresAuth: true, requiresRole: 'vendor' },
  
  // Trust & Safety
  { path: '/customer-verification', label: 'Verification', description: 'Verify your identity', category: 'trust', requiresAuth: true },
  { path: '/emergency-contacts', label: 'Emergency Contacts', description: 'Manage emergency contacts', category: 'trust', requiresAuth: true },
  { path: '/activity-logs', label: 'Activity Logs', description: 'View account activity', category: 'trust', requiresAuth: true },
  { path: '/community-guidelines', label: 'Community Guidelines', description: 'Platform rules', category: 'trust' },
  { path: '/trust-safety', label: 'Trust & Safety', description: 'Safety Resource Center', category: 'trust' },
  { path: '/cancellation-refund-policy', label: 'Cancellation & Refund Policy', description: 'Cancellation policy', category: 'trust' },
  { path: '/dispute-resolution', label: 'Dispute Resolution', description: 'Resolve disputes', category: 'trust' },
  
  // Company
  { path: '/about', label: 'About', description: 'About Goldsainte', category: 'company' },
  { path: '/what-we-do', label: 'What We Do', description: 'Our services', category: 'company' },
  { path: '/terms', label: 'Terms of Service', description: 'Legal terms', category: 'company' },
  { path: '/privacy-cookies', label: 'Privacy & Cookies', description: 'Privacy policy', category: 'company' },
  { path: '/corporate-contact', label: 'Corporate Contact', description: 'Contact information', category: 'company' },
  { path: '/help', label: 'Help Center', description: 'AI-powered help and support', category: 'company' },
];

export const getRoutesByCategory = (category: string) => {
  return siteRoutes.filter(route => route.category === category);
};

export const searchRoutes = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return siteRoutes.filter(route => 
    route.label.toLowerCase().includes(lowerQuery) ||
    route.description.toLowerCase().includes(lowerQuery) ||
    route.path.toLowerCase().includes(lowerQuery)
  );
};
