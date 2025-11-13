import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SkipNavigation } from "@/components/SkipNavigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ExpediaModalProvider } from "@/contexts/ExpediaModalContext";
import { ExpediaModalPortal } from "@/components/ExpediaModalPortal";
import { initExpediaModalHandler } from "@/utils/expediaModalHandler";
import { OnboardingTour } from "@/components/OnboardingTour";
import { WelcomeModal } from "@/components/WelcomeModal";
import { ScrollToTop } from "@/components/ScrollToTop";
import { RequireAgentTerms } from "@/components/RequireAgentTerms";
import { LoadingFallback } from "@/components/LoadingFallback";
import { usePresence } from "@/hooks/usePresence";
import { SentryTestButton } from "@/components/SentryTestButton";
import { EnvironmentValidator } from "@/components/system/EnvironmentValidator";
import { useState, useEffect, lazy, Suspense } from "react";
import { initCSRFProtection } from "@/lib/security/csrf";

// Critical pages loaded immediately
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import TravelFeed from "./pages/TravelFeed";
import NotFound from "./pages/NotFound";

// Lazy load heavy components
const AIBookingConcierge = lazy(() => import("@/components/AIBookingConcierge").then(m => ({ default: m.AIBookingConcierge })));

// Lazy load non-critical pages
const SearchResults = lazy(() => import("./pages/SearchResults"));
const HotelBooking = lazy(() => import("./pages/HotelBooking"));
const HotelDetails = lazy(() => import("./pages/HotelDetails"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AIAgentOnboarding = lazy(() => import("./pages/AIAgentOnboarding"));
const JournalListing = lazy(() => import("./pages/JournalListing"));
const JournalArticle = lazy(() => import("./pages/JournalArticle"));
const CreatorArticleEditor = lazy(() => import("./pages/CreatorArticleEditor"));
const CreatorArticles = lazy(() => import("./pages/CreatorArticles"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Collections = lazy(() => import("./pages/Collections"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const AgentOnboarding = lazy(() => import("./pages/AgentOnboarding"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const AdminAgentApprovals = lazy(() => import("./pages/AdminAgentApprovals"));
const Admin = lazy(() => import("./pages/Admin"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));
const AdminInquiries = lazy(() => import("./pages/AdminInquiries"));
const AdminCancellations = lazy(() => import("./pages/AdminCancellations"));
const AdminCancellationAnalytics = lazy(() => import("./pages/AdminCancellationAnalytics"));
const Subscription = lazy(() => import("./pages/Subscription"));
const BillingDashboard = lazy(() => import("./pages/BillingDashboard"));
const AgentProfile = lazy(() => import("./pages/AgentProfile"));
const BrowseAgents = lazy(() => import("./pages/BrowseAgents"));
const MyJobs = lazy(() => import("./pages/MyJobs"));
const MyTrips = lazy(() => import("./pages/MyTrips"));
const GroupTrips = lazy(() => import("./pages/GroupTrips"));
const AgentTripRequests = lazy(() => import('./pages/AgentTripRequests'));
const BookingPreferences = lazy(() => import("./pages/BookingPreferences"));
const MyBookingsRedirect = lazy(() => import("./pages/redirects/MyBookingsRedirect"));
const FavoritesRedirect = lazy(() => import("./pages/redirects/FavoritesRedirect"));
const BookingPreferencesRedirect = lazy(() => import("./pages/redirects/BookingPreferencesRedirect"));
const CommissionDashboard = lazy(() => import("./pages/CommissionDashboard"));
const EmailPreview = lazy(() => import("./pages/EmailPreview"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const BookingDetails = lazy(() => import("./pages/BookingDetails"));
const BookingHistory = lazy(() => import("./pages/BookingHistory"));
const ModifyFlight = lazy(() => import("./pages/ModifyFlight"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Redirect = lazy(() => import("./pages/Redirect"));
const TestGroupPayment = lazy(() => import("./pages/TestGroupPayment"));
const TravelProfile = lazy(() => import("./pages/TravelProfile"));
const TravelSettings = lazy(() => import("./pages/TravelSettings"));
const TravelSettings2 = lazy(() => import("./pages/TravelSettings2"));
const MusicVolumeSettings = lazy(() => import("./pages/MusicVolumeSettings"));
const CrosspostingSettings = lazy(() => import("./pages/CrosspostingSettings"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const Search = lazy(() => import("./pages/Search"));
const Trending = lazy(() => import("./pages/Trending"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const TrustSafety = lazy(() => import("./pages/TrustSafety"));
const CancellationRefundPolicy = lazy(() => import("./pages/CancellationRefundPolicy"));
const Shop = lazy(() => import("./pages/Shop"));
const AffiliateManager = lazy(() => import("./pages/AffiliateManager"));
const SupplierManagement = lazy(() => import("./pages/SupplierManagement"));
const CoCuratedDashboard = lazy(() => import("./pages/CoCuratedDashboard"));
const CoCuratedCreate = lazy(() => import("./pages/CoCuratedCreate"));
const CoCuratedMarketplace = lazy(() => import("./pages/CoCuratedMarketplace"));
const CoCuratedPackage = lazy(() => import("./pages/CoCuratedPackage"));
const CoCuratedBookingSuccess = lazy(() => import("./pages/CoCuratedBookingSuccess"));
const CoCuratedJourneys = lazy(() => import("./pages/CoCuratedJourneys"));
const TourActivityDetail = lazy(() => import("./pages/TourActivityDetail"));
const FineDining = lazy(() => import("./pages/FineDining"));
const RestaurantDetail = lazy(() => import("./pages/RestaurantDetail"));
const BrowseInfluencers = lazy(() => import("./pages/BrowseInfluencers"));
const BrowseCreators = lazy(() => import("./pages/BrowseCreators"));
const AdminSeed = lazy(() => import("./pages/AdminSeed"));
const InstagramAPI = lazy(() => import("./pages/InstagramAPI"));
const InstagramCallback = lazy(() => import("./pages/InstagramCallback"));
const YourActivity = lazy(() => import("./pages/YourActivity"));
const UploadEmailAssets = lazy(() => import("./pages/UploadEmailAssets"));
const UploadAppleMusicKey = lazy(() => import("./pages/UploadAppleMusicKey"));
const UploadAppleSignInKey = lazy(() => import("./pages/UploadAppleSignInKey"));
const AppleCallback = lazy(() => import("./pages/AppleCallback"));
const TransportationVendorApplication = lazy(() => import("./pages/TransportationVendorApplication"));
const TransportationVendorDashboard = lazy(() => import("./pages/TransportationVendorDashboard"));
const AdminTransportVendorVetting = lazy(() => import("./pages/AdminTransportVendorVetting"));
const TransportationVendorPartners = lazy(() => import("./pages/TransportationVendorPartners"));
const FleetManagementDashboard = lazy(() => import("./components/FleetManagementDashboard"));
const DriverManagementPanel = lazy(() => import("./components/DriverManagementPanel"));
const VendorPromotionManager = lazy(() => import("./components/VendorPromotionManager"));
const VendorPaymentDashboard = lazy(() => import("./components/VendorPaymentDashboard"));
const VendorAnalyticsDashboard = lazy(() => import("./components/VendorAnalyticsDashboard"));
const VendorBookingCalendar = lazy(() => import("./components/VendorBookingCalendar"));
const EscrowTimelineDashboard = lazy(() => import("./components/EscrowTimelineDashboard"));
const PlatformAnalyticsDashboard = lazy(() => import("./components/PlatformAnalyticsDashboard"));
const ActivityLogs = lazy(() => import("./pages/ActivityLogs"));
const CustomerVerification = lazy(() => import("./pages/CustomerVerification"));
const EmergencyContacts = lazy(() => import("./pages/EmergencyContacts"));
const AgentPerformanceDashboard = lazy(() => import("./pages/AgentPerformanceDashboard"));
const AdminCustomerVerifications = lazy(() => import("./pages/AdminCustomerVerifications"));
const CorporateContact = lazy(() => import("./pages/CorporateContact"));
const About = lazy(() => import("./pages/About"));
const TermsPage = lazy(() => import("./pages/Terms"));
const WhatWeDo = lazy(() => import("./pages/WhatWeDo"));
const DisputeResolution = lazy(() => import("./pages/DisputeResolution"));
const PrivacyCookies = lazy(() => import("./pages/PrivacyCookies"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const PriceAlerts = lazy(() => import("./pages/PriceAlerts"));

const queryClient = new QueryClient();

// Main app content with routing
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  usePresence(); // Initialize presence tracking
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Initialize global Expedia modal handler
  useEffect(() => {
    const cleanup = initExpediaModalHandler();
    return cleanup;
  }, []);

  // SECURITY: Initialize CSRF protection on app load
  useEffect(() => {
    initCSRFProtection();
    console.log('🔒 CSRF protection initialized');
  }, []);

  // Force return to Home when the welcome modal is dismissed (first visit UX)
  useEffect(() => {
    const handler = () => navigate('/');
    window.addEventListener('welcomeDismissed', handler);
    return () => window.removeEventListener('welcomeDismissed', handler);
  }, [navigate]);

  // Check if welcome modal should show (only on first visit)
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("goldsainte-welcome-seen");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
  };
  
  // Don't show header on these pages as they have their own custom headers
  const hideHeaderPages = ['/auth', '/login', '/signup', '/travel-feed', '/journeys', '/travel-profile', '/travel-settings', '/cocurated-journeys', '/fine-dining', '/hotel-booking'];
  const showHeader = !hideHeaderPages.some(page => location.pathname === page || location.pathname.startsWith(page));

  // Don't show AI Booking Concierge on Horizon pages
  const hideAIBookingPages = ['/travel-feed', '/journeys', '/travel-profile', '/travel-settings', '/search', '/trending'];
  const showAIBooking = !hideAIBookingPages.some(page => location.pathname === page || location.pathname.startsWith(page));

  // Don't show footer on these pages
  const hideFooterPages = [
    // Auth & Onboarding
    '/auth',
    '/login',
    '/signup',
    '/reset-password',
    '/onboarding',
    '/ai-agent-setup',
    
    // Travel Feed / Social Pages
    '/travel-feed',
    '/journeys',
    '/travel-profile',
    '/travel-settings',
    '/crossposting-settings',
    '/creator-dashboard',
    '/search',
    '/trending',
    '/your-activity',
    
    // Other Utility Pages
    '/browse-influencers',
    '/browse-creators',
    '/activity-logs',
    '/customer-verification',
    '/emergency-contacts',
    '/agent-performance',
    '/commission-dashboard',
    '/email-preview',
    '/test-group-payment',
    '/instagram-api',
    '/instagram-callback',
    
    // Admin Utility Pages
    '/admin/upload-email-assets',
    '/admin/upload-apple-music-key',
    '/not-found',
  ];

  const showFooter = !hideFooterPages.some(page => 
    location.pathname === page || location.pathname.startsWith(page)
  );

  // Hide Lovable badge on Journeys feed
  useEffect(() => {
    const isJourneysPage = location.pathname === '/travel-feed' || location.pathname === '/journeys';
    const badge = document.querySelector('.lovable-badge, [data-lovable-badge], iframe[src*="lovable"]');
    if (badge instanceof HTMLElement) {
      badge.style.display = isJourneysPage ? 'none' : 'block';
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col overflow-x-hidden box-border viewport-guard">
      <SkipNavigation />
      <WelcomeModal open={showWelcomeModal} onClose={handleCloseWelcome} isFirstVisit={true} />
      <OnboardingTour />
      <ExpediaModalPortal />
      {showHeader && <Header />}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/travel-feed" element={<TravelFeed />} />
          <Route path="/journeys" element={<TravelFeed />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/ai-agent-setup" element={<AIAgentOnboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/browse-agents" element={<BrowseAgents />} />
          <Route path="/browse-creators" element={<BrowseCreators />} />
          <Route path="/agent/:agentId" element={<AgentProfile />} />
          <Route path="/agent-onboarding" element={<AgentOnboarding />} />
          <Route path="/agent-dashboard" element={<RequireAgentTerms><AgentDashboard /></RequireAgentTerms>} />
          <Route path="/agent-trip-requests" element={<RequireAgentTerms><AgentTripRequests /></RequireAgentTerms>} />
          <Route path="/agent-performance" element={<RequireAgentTerms><AgentPerformanceDashboard /></RequireAgentTerms>} />
          <Route path="/admin/agent-approvals" element={<AdminAgentApprovals />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/system-health" element={<SystemHealth />} />
          <Route path="/admin/cancellations" element={<AdminCancellations />} />
          <Route path="/admin/analytics/cancellations" element={<AdminCancellationAnalytics />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/billing-dashboard" element={<BillingDashboard />} />
          <Route path="/admin/customer-verifications" element={<AdminCustomerVerifications />} />
          <Route path="/admin/inquiries" element={<AdminInquiries />} />
          <Route path="/admin/seed" element={<AdminSeed />} />
          <Route path="/admin/upload-email-assets" element={<UploadEmailAssets />} />
          <Route path="/admin/upload-apple-music-key" element={<UploadAppleMusicKey />} />
         <Route path="/admin/upload-apple-signin-key" element={<UploadAppleSignInKey />} />
        <Route path="/auth/callback/apple" element={<AppleCallback />} />
        <Route path="/auth/apple/callback" element={<AppleCallback />} />
          <Route path="/booking-preferences" element={<BookingPreferencesRedirect />} />
          <Route path="/commission-dashboard" element={<CommissionDashboard />} />
          <Route path="/email-preview" element={<EmailPreview />} />
          <Route path="/favorites" element={<FavoritesRedirect />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:collectionId" element={<CollectionDetail />} />
          <Route path="/my-bookings" element={<MyBookingsRedirect />} />
          <Route path="/booking-history" element={<BookingHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/travel-profile" element={<TravelProfile />} />
          <Route path="/travel-profile/:userId" element={<TravelProfile />} />
          <Route path="/travel-settings" element={<TravelSettings2 />} />
          <Route path="/travel-settings-2" element={<TravelSettings2 />} />
          <Route path="/travel-settings/edit" element={<TravelSettings />} />
          <Route path="/travel-settings/music-volume" element={<MusicVolumeSettings />} />
          <Route path="/crossposting-settings" element={<CrosspostingSettings />} />
          <Route path="/instagram-callback" element={<InstagramCallback />} />
          <Route path="/creator-dashboard" element={<CreatorDashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/price-alerts" element={<PriceAlerts />} />
          <Route path="/booking-details/:bookingId" element={<BookingDetails />} />
          <Route path="/modify-flight/:bookingId" element={<ModifyFlight />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/hotel/:id" element={<HotelDetails />} />
          <Route path="/hotel-booking" element={<HotelBooking />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/group-trips" element={<GroupTrips />} />
          <Route path="/group-trips/:tripId" element={<GroupTrips />} />
          <Route path="/agent-trip-requests" element={<AgentTripRequests />} />
          <Route path="/test-group-payment" element={<TestGroupPayment />} />
          <Route path="/travel-feed" element={<TravelFeed />} />
          <Route path="/journal" element={<JournalListing />} />
          <Route path="/journal/:slug" element={<JournalArticle />} />
          <Route path="/creator-articles" element={<CreatorArticles />} />
          <Route path="/creator-articles/new" element={<CreatorArticleEditor />} />
          <Route path="/creator-articles/edit/:id" element={<CreatorArticleEditor />} />
          <Route path="/community-guidelines" element={<CommunityGuidelines />} />
          <Route path="/trust-safety" element={<TrustSafety />} />
          <Route path="/admin/trust-safety" element={<TrustSafety />} />
          <Route path="/cancellation-refund-policy" element={<CancellationRefundPolicy />} />
          <Route path="/corporate-contact" element={<CorporateContact />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/affiliate-manager" element={<AffiliateManager />} />
          <Route path="/supplier-management" element={<SupplierManagement />} />
          <Route path="/transportation-vendor-partners" element={<TransportationVendorPartners />} />
          <Route path="/transportation-vendor-application" element={<TransportationVendorApplication />} />
          <Route path="/transportation-vendor-dashboard" element={<TransportationVendorDashboard />} />
          <Route path="/admin/transport-vendor-vetting" element={<AdminTransportVendorVetting />} />
          {/* Phase 5: Transportation Vendor Features */}
          <Route path="/fleet-management" element={<FleetManagementDashboard />} />
          <Route path="/driver-management" element={<DriverManagementPanel />} />
          <Route path="/vendor-promotions" element={<VendorPromotionManager />} />
          <Route path="/vendor-payments" element={<VendorPaymentDashboard />} />
          <Route path="/vendor-analytics" element={<VendorAnalyticsDashboard />} />
          <Route path="/vendor-booking-calendar" element={<VendorBookingCalendar />} />
          <Route path="/escrow-timeline" element={<EscrowTimelineDashboard />} />
          <Route path="/admin/platform-analytics" element={<PlatformAnalyticsDashboard />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          {/* Phase 8: Trust & Safety Pages */}
          <Route path="/customer-verification" element={<CustomerVerification />} />
          <Route path="/emergency-contacts" element={<EmergencyContacts />} />
          <Route path="/agent-performance" element={<AgentPerformanceDashboard />} />
          <Route path="/cocurated-dashboard" element={<CoCuratedDashboard />} />
          <Route path="/cocurated-create" element={<CoCuratedCreate />} />
          <Route path="/cocurated-marketplace" element={<CoCuratedMarketplace />} />
          <Route path="/cocurated-journeys" element={<CoCuratedJourneys />} />
          <Route path="/tour/:tourId" element={<TourActivityDetail />} />
          <Route path="/fine-dining" element={<FineDining />} />
          <Route path="/restaurant/:restaurantId" element={<RestaurantDetail />} />
          <Route path="/cocurated-package/:packageId" element={<CoCuratedPackage />} />
          <Route path="/cocurated-booking-success" element={<CoCuratedBookingSuccess />} />
            <Route path="/browse-influencers" element={<BrowseInfluencers />} />
            <Route path="/instagram-api" element={<InstagramAPI />} />
            <Route path="/your-activity" element={<YourActivity />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/what-we-do" element={<WhatWeDo />} />
          <Route path="/dispute-resolution" element={<DisputeResolution />} />
          <Route path="/privacy-cookies" element={<PrivacyCookies />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/r" element={<Redirect />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      {showFooter && <Footer />}
      {showAIBooking && (
        <Suspense fallback={null}>
          <AIBookingConcierge />
        </Suspense>
      )}
      {import.meta.env.DEV && <EnvironmentValidator />}
      {import.meta.env.DEV && <SentryTestButton />}
    </div>
  );
}

function App() {
  // Build verification timestamp
  console.info('🚀 Build deployed:', new Date().toISOString(), '| v2025-10-23-fix');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <LanguageProvider>
              <ExpediaModalProvider>
                <div className="viewport-guard">
                  <AppContent />
                </div>
              </ExpediaModalProvider>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
