export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'bookings' | 'payments' | 'cancellations' | 'account' | 'ai-features' | 'creator' | 'agent' | 'navigation';
}

// Every route and feature below is verified against the live app. Money answers
// reflect the direct-charge model: the independent travel professional is the
// seller of record, charged directly at checkout; travelers pay a 3.5% service
// fee on top; professionals keep 96.5%. Goldsainte never holds trip funds.
export const helpCenterFAQs: FAQ[] = [
  // Navigation
  {
    id: 'nav-bookings',
    question: 'How do I view my bookings?',
    answer: 'Open /my-bookings to see every trip. Click any booking to open its page — your journey timeline, messages with your travel professional, documents, and payment details all live there.',
    category: 'navigation'
  },
  {
    id: 'nav-trip-requests',
    question: 'Where do I see my trip requests?',
    answer: 'Open /my-trip-requests to review every brief you have posted, or tap Profile → View Trip Requests from anywhere in the app.',
    category: 'navigation'
  },
  {
    id: 'nav-marketplace',
    question: 'How do I browse the marketplace?',
    answer: 'Visit /marketplace to explore trips and specialists, or post your own brief at /marketplace/request-trip and let vetted travel professionals come to you with proposals.',
    category: 'navigation'
  },
  {
    id: 'nav-agent-apply',
    question: 'How do I become a travel specialist?',
    answer: 'Visit /agent-onboarding to start your application. You can also find it in the header under Professional → Become an Agent, or in the footer under Partners.',
    category: 'navigation'
  },
  {
    id: 'nav-messages',
    question: 'How do I contact support or my travel professional?',
    answer: 'Click "Messages" in the header (or visit /messages). For a specific trip, open the booking in /my-bookings — there\'s a message button right on the booking page.',
    category: 'navigation'
  },

  // Bookings
  {
    id: 'booking-how',
    question: 'How do I book a trip?',
    answer: 'Post a trip request at /marketplace/request-trip. Vetted travel professionals respond with custom proposals — compare them, message the ones you like, and accept the best fit. You then pay the deposit securely through Stripe checkout and your booking page opens with everything in one place.',
    category: 'bookings'
  },
  {
    id: 'booking-modify',
    question: 'Can I change my booking?',
    answer: 'Message your travel professional directly from the booking page — they design and deliver your trip, so changes go through them. They\'ll confirm what\'s possible and update the details.',
    category: 'bookings'
  },
  {
    id: 'booking-confirmation',
    question: 'Where is my booking confirmation?',
    answer: 'Your Stripe receipt arrives by email right after payment, and your booking page at /my-bookings holds the live record. Itineraries and confirmations appear there as your travel professional delivers them.',
    category: 'bookings'
  },
  {
    id: 'booking-progress',
    question: 'How do I track my trip\'s progress?',
    answer: 'Every booking page has a step-by-step journey timeline. As your travel professional completes each stage of the work, they mark it done — your timeline updates live and you get a notification and an email.',
    category: 'bookings'
  },

  // Payments
  {
    id: 'payment-who',
    question: 'Who am I paying when I book?',
    answer: 'Your travel professional. They are the seller of record for your trip, and your payment is charged directly to their own Stripe account at checkout — Goldsainte never holds your trip funds. A 3.5% platform service fee is added at checkout.',
    category: 'payments'
  },
  {
    id: 'payment-methods',
    question: 'What payment methods are accepted?',
    answer: 'All major credit and debit cards, processed through Stripe\'s secure checkout.',
    category: 'payments'
  },
  {
    id: 'payment-agent-earnings',
    question: 'When do travel professionals get paid?',
    answer: 'Immediately, at checkout. You are the merchant of record — traveler payments land directly in your own Stripe account, and you keep 96.5% (Goldsainte\'s platform fee is 3.5% per side). Track everything at /agent/earnings; bank payout timing follows your own Stripe settings.',
    category: 'payments'
  },

  // Cancellations
  {
    id: 'cancel-how',
    question: 'How do I cancel my booking?',
    answer: 'Open the booking in /my-bookings and request a cancellation. Your travel professional\'s published cancellation terms govern the outcome — review them in your proposal or at /cancellation-refund-policy.',
    category: 'cancellations'
  },
  {
    id: 'cancel-refund',
    question: 'What is the refund policy?',
    answer: 'Refund terms are set by your travel professional — they are the seller of record, and any refund is issued by them to your original payment method. Full details, including how deposits and supplier rules work, are at /cancellation-refund-policy.',
    category: 'cancellations'
  },
  {
    id: 'cancel-dispute',
    question: 'How do I dispute a charge?',
    answer: 'Start with Messages or support@goldsainte.com — our team administers the platform dispute process and reviews evidence from both sides. You can read how it works at /dispute-resolution. Because your travel professional is the seller of record, card disputes are ultimately resolved between you and them through your card network.',
    category: 'cancellations'
  },

  // Account
  {
    id: 'account-create',
    question: 'How do I create an account?',
    answer: 'Click "Sign In" in the header, then select "Sign Up". You can sign up with email or Google, and a quick onboarding sets up your travel preferences.',
    category: 'account'
  },
  {
    id: 'account-verify',
    question: 'Why should I verify my identity?',
    answer: 'Verification builds trust with the travel professionals you work with and unlocks the full platform. Complete it at /customer-verification.',
    category: 'account'
  },
  {
    id: 'account-preferences',
    question: 'How do I update my preferences?',
    answer: 'Open /travel-settings to manage your travel preferences and notification settings.',
    category: 'account'
  },

  // AI Features
  {
    id: 'ai-agent-what',
    question: 'What is the Personal AI Agent?',
    answer: 'Your AI agent learns your travel style and preferences so trip matching and recommendations get sharper over time. Set it up at /ai-agent-setup or through /travel-settings.',
    category: 'ai-features'
  },
  {
    id: 'ai-matching',
    question: 'How does AI matching work?',
    answer: 'When you post a trip request, Goldsainte\'s matching surfaces it to the vetted travel professionals best suited to your destination, dates, and style — so the proposals you receive are relevant, not random.',
    category: 'ai-features'
  },

  // Creator Program
  {
    id: 'creator-join',
    question: 'How do I become a creator?',
    answer: 'Create an account, set up your creator profile, and start posting. Share your travel content, declare the on-trip services you offer (photography, guiding, and more), and travelers can discover and hire you.',
    category: 'creator'
  },
  {
    id: 'creator-earn',
    question: 'How do creators earn money?',
    answer: 'Two ways today: tips from travelers on your profile, and being hired for on-trip services — photography sessions, personal guiding, content creation, and more — through trip requests. Hire payments are charged directly to your own Stripe account and you keep 96.5%.',
    category: 'creator'
  },
  {
    id: 'creator-dashboard',
    question: 'Where is the Creator Dashboard?',
    answer: 'Access it at /creator-dashboard or by clicking your profile picture. Manage your content, services, earnings, and settings from there.',
    category: 'creator'
  },

  // Agent Marketplace
  {
    id: 'agent-what',
    question: 'What do travel specialists do?',
    answer: 'Independent travel professionals design, sell, and deliver the trips on Goldsainte — personalized planning, complex bookings, expert advice, and support throughout your journey. Your travel contract is with them as the seller of record.',
    category: 'agent'
  },
  {
    id: 'agent-hire',
    question: 'How do I hire a travel specialist?',
    answer: 'Post a trip request from the marketplace and vetted specialists respond with proposals. Review their profiles, compare offers, and message them directly from your inbox.',
    category: 'agent'
  },
  {
    id: 'agent-become',
    question: 'What are the requirements to become a specialist?',
    answer: 'Complete the application at /agent-onboarding with your travel expertise and credentials, and agree to our terms. To accept bookings you\'ll also connect your own Stripe account — you are the seller of record and traveler payments go directly to you. Approval typically takes 3-5 business days.',
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
