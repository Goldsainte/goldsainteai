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
  { path: '/billing-dashboard', label: 'Billing', description: 'View billing history and manage payments', category: 'core', requiresAuth: true },
  { path: '/messages', label: 'Messages', description: 'Chat with agents and support', category: 'core', requiresAuth: true },
  
  // Booking & Travel
  { path: '/search-results', label: 'Search Results', description: 'Browse search results', category: 'booking' },
  { path: '/post-trip', label: 'Post Trip', description: 'Share your dream trip with the marketplace', category: 'booking', requiresAuth: true },
  { path: '/booking-confirmation', label: 'Booking Confirmation', description: 'Confirm your booking', category: 'booking', requiresAuth: true },
  { path: '/my-trips', label: 'My Trips', description: 'View all your trip requests and bookings in one place', category: 'booking', requiresAuth: true },
  
  // Creator & TikTok Ecosystem (formerly Social / Journeys)
  // Legacy internal social feed routes - DISABLED
  // { path: '/travel-feed', label: 'Journeys Feed', description: 'Instagram-style travel content', category: 'social' },
  // { path: '/journeys', label: 'Journeys', description: 'Same as Travel Feed', category: 'social' },
  // { path: '/search', label: 'Search', description: 'Search content', category: 'social' },
  // { path: '/trending', label: 'Trending', description: 'Trending travel content', category: 'social' },
  
  // Creator Platform - TikTok-based ecosystem
  { path: '/creators/:id', label: 'Creator Profile', description: 'Public creator profile page', category: 'social', requiresAuth: false },
  { path: '/travel-settings', label: 'Creator Settings', description: 'Edit your public creator profile and TikTok details.', category: 'social', requiresAuth: true },
  { path: '/creator-dashboard', label: 'Creator Dashboard', description: 'Your TikTok travel performance and earnings', category: 'social', requiresAuth: true },
  { path: '/browse-creators', label: 'Creator Marketplace', description: 'Agents can discover TikTok travel creators', category: 'social' },
  { path: '/storyboards', label: 'Goldsainte Creator Lab', description: 'Build TikTok-ready stories linked to trips', category: 'social', requiresAuth: true },
  { path: '/trip/:id', label: 'Creator Trip Page', description: 'Bookable experience behind TikTok content', category: 'social' },
  { path: '/collabs/new', label: 'New Collaboration', description: 'Agents & creators partner on selling trips', category: 'social', requiresAuth: true },
  { path: '/tiktok-callback', label: 'TikTok Callback', description: 'OAuth callback handler for TikTok connection', category: 'social', requiresAuth: true },
  
  // Storyboards
  { path: '/storyboards', label: 'Storyboards', description: 'Manage collaborative trip storyboards', category: 'social', requiresAuth: true },
  
  // Marketplace & Agents
  { path: '/marketplace', label: 'Marketplace', description: 'Browse services and products', category: 'marketplace' },
  { path: '/apply/agent', label: 'Become an Agent', description: 'Apply to be a travel agent', category: 'marketplace' },
  { path: '/agent-dashboard', label: 'Agent Dashboard', description: 'Manage agent work', category: 'marketplace', requiresAuth: true, requiresRole: 'agent' },
  { path: '/agent-trip-requests', label: 'Trip Requests', description: 'View trip requests', category: 'marketplace', requiresAuth: true, requiresRole: 'agent' },
  { path: '/agent-performance', label: 'Performance', description: 'View performance metrics', category: 'marketplace', requiresAuth: true, requiresRole: 'agent' },
  { path: '/agent-deals', label: 'Agent Deals', description: 'Track your collaborations with TikTok creators', category: 'marketplace', requiresAuth: true, requiresRole: 'agent' },
  { path: '/my-jobs', label: 'My Jobs', description: 'View your jobs', category: 'marketplace', requiresAuth: true },
  
  // Commerce
  { path: '/shop', label: 'Shop', description: 'Browse products', category: 'commerce' },
  { path: '/affiliate-manager', label: 'Affiliate Manager', description: 'Manage affiliate links', category: 'commerce', requiresAuth: true },
  
  
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
