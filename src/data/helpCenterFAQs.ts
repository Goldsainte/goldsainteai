export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'bookings' | 'payments' | 'cancellations' | 'account' | 'ai-features' | 'creator' | 'agent' | 'navigation';
}

export const helpCenterFAQs: FAQ[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    question: 'How do I view my bookings?',
    answer: 'Open /my-trips from the header (Profile → My Trips) or visit the traveler dashboard at /traveler to review every booking and proposal in one place.',
    category: 'navigation'
  },
  {
    id: 'nav-trip-requests',
    question: 'Where do I see my trip requests?',
    answer: 'Open /my-trip-requests to review every brief you have posted. You can also tap Profile → View Trip Requests from anywhere in the app.',
    category: 'navigation'
  },
  {
    id: 'nav-agent-apply',
    question: 'How do I become a travel agent?',
    answer: 'Visit /agent-onboarding to start your application. You can also find it in the header under Professional → Become an Agent, or in the footer under Partners.',
    category: 'navigation'
  },
  {
    id: 'nav-cocurated',
    question: 'Where do I find CoCurated packages?',
    answer: 'Browse CoCurated packages at /cocurated-marketplace. In the header, hover over "Marketplace" and select "CoCurated Packages", or find it in the footer under Discover.',
    category: 'navigation'
  },
  {
    id: 'nav-messages',
    question: 'How do I contact support or agents?',
    answer: 'Click "Messages" in the header menu to chat with support or agents. You can also visit /messages directly.',
    category: 'navigation'
  },
  
  // Bookings
  {
    id: 'booking-how',
    question: 'How do I book a trip?',
    answer: 'Use the AI search on the homepage, browse CoCurated packages, or work with a travel agent. Our AI assistant can help you find and book flights, hotels, and activities.',
    category: 'bookings'
  },
  {
    id: 'booking-modify',
    question: 'Can I modify my booking?',
    answer: 'Yes! Go to /my-trips, click on your booking, and select "Modify" or contact your agent for assistance with other adjustments.',
    category: 'bookings'
  },
  {
    id: 'booking-confirmation',
    question: 'Where is my booking confirmation?',
    answer: 'Check your email for the confirmation. You can also find it in /my-trips by clicking the booking to view all details.',
    category: 'bookings'
  },
  
  // Payments
  {
    id: 'payment-methods',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, and support split payments for group bookings. Payment is processed securely through Stripe.',
    category: 'payments'
  },
  {
    id: 'payment-split',
    question: 'How do split payments work?',
    answer: 'When booking with a group, you can generate payment links to split the cost among travelers. Each person pays their share separately.',
    category: 'payments'
  },
  {
    id: 'payment-commission',
    question: 'When do I receive my commissions?',
    answer: 'Commissions are visible inside your Agent Earnings dashboard (/agent/earnings). Payouts are processed according to your Stripe Connect settings.',
    category: 'payments'
  },
  
  // Cancellations
  {
    id: 'cancel-how',
    question: 'How do I cancel my booking?',
    answer: 'Go to /my-trips, select your booking, and click "Cancel". Refund eligibility depends on the policy shown during booking.',
    category: 'cancellations'
  },
  {
    id: 'cancel-refund',
    question: 'What is your refund policy?',
    answer: 'Refund policies vary by booking. Check your booking confirmation or visit /cancellation-refund-policy for full details. Refunds typically process within 5-7 business days.',
    category: 'cancellations'
  },
  {
    id: 'cancel-dispute',
    question: 'How do I dispute a charge?',
    answer: 'Contact support via Messages or email support@goldsainte.com. You can also review our dispute resolution process at /dispute-resolution.',
    category: 'cancellations'
  },
  
  // Account
  {
    id: 'account-create',
    question: 'How do I create an account?',
    answer: 'Click "Sign In" in the header, then select "Sign Up". You can sign up with email or Google. New users will go through a quick onboarding to set up their AI agent.',
    category: 'account'
  },
  {
    id: 'account-verify',
    question: 'Why should I verify my identity?',
    answer: 'Verification unlocks premium features, increases trust with agents, and enables higher transaction limits. Complete verification at /customer-verification.',
    category: 'account'
  },
  {
    id: 'account-preferences',
    question: 'How do I update my preferences?',
    answer: 'Open /travel-settings/general to manage your travel preferences, AI assistant defaults, and notification settings.',
    category: 'account'
  },
  
  // AI Features
  {
    id: 'ai-agent-what',
    question: 'What is the Personal AI Agent?',
    answer: 'Your AI agent learns your travel preferences and helps find personalized recommendations. Set it up at /ai-agent-setup or through /travel-settings/general.',
    category: 'ai-features'
  },
  {
    id: 'ai-voice',
    question: 'How do I use Voice AI ("Hey, Goldsainte")?',
    answer: 'On the homepage, click the microphone icon or say "Hey, Goldsainte" to activate voice search. Speak naturally about your travel needs.',
    category: 'ai-features'
  },
  {
    id: 'ai-concierge',
    question: 'What can the AI Concierge help with?',
    answer: 'The AI Concierge (bottom right chat bubble) can help search flights, hotels, activities, answer questions, and guide you through bookings.',
    category: 'ai-features'
  },
  
  // Creator Program
  {
    id: 'creator-join',
    question: 'How do I become a creator?',
    answer: 'Create an account, navigate to your Creator Profile, and start posting content. Upload travel photos, videos, or create CoCurated packages to earn commissions.',
    category: 'creator'
  },
  {
    id: 'creator-earn',
    question: 'How do creators earn money?',
    answer: 'Earn through multiple streams: content engagement, CoCurated package sales (5-15% commission), affiliate links, and gifts from followers.',
    category: 'creator'
  },
  {
    id: 'creator-dashboard',
    question: 'Where is the Creator Dashboard?',
    answer: 'Access it at /creator-dashboard or by clicking your profile picture → Create Content → Manage Content. Here you can upload posts and track performance.',
    category: 'creator'
  },
  
  // Agent Marketplace
  {
    id: 'agent-what',
    question: 'What do travel agents do?',
    answer: 'Travel agents provide personalized trip planning, handle complex bookings, offer expert advice, and manage your travel logistics.',
    category: 'agent'
  },
  {
    id: 'agent-hire',
    question: 'How do I hire a travel agent?',
    answer: 'Post a trip request from the marketplace and vetted specialists will respond with proposals. You can review their profiles and message them directly from your inbox.',
    category: 'agent'
  },
  {
    id: 'agent-become',
    question: 'What are the requirements to become an agent?',
    answer: 'Complete the application at /agent-onboarding with your travel expertise, certifications (if any), and agree to our terms. Approval takes 3-5 business days.',
    category: 'agent'
  },
];

export const getFAQsByCategory = (category: string) => {
  return helpCenterFAQs.filter(faq => faq.category === category);
};

export const searchFAQs = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return helpCenterFAQs.filter(faq =>
    faq.question.toLowerCase().includes(lowerQuery) ||
    faq.answer.toLowerCase().includes(lowerQuery)
  );
};
