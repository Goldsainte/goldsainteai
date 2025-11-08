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
import { AIBookingConcierge } from "@/components/AIBookingConcierge";
import { OnboardingTour } from "@/components/OnboardingTour";
import { WelcomeModal } from "@/components/WelcomeModal";
import { ScrollToTop } from "@/components/ScrollToTop";
import { RequireAgentTerms } from "@/components/RequireAgentTerms";
import { usePresence } from "@/hooks/usePresence";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import HotelBooking from "./pages/HotelBooking";
import BookingConfirmation from "./pages/BookingConfirmation";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import AIAgentOnboarding from "./pages/AIAgentOnboarding";
import Favorites from "./pages/Favorites";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import AgentOnboarding from "./pages/AgentOnboarding";
import AgentDashboard from "./pages/AgentDashboard";
import AdminAgentApprovals from "./pages/AdminAgentApprovals";
import Admin from "./pages/Admin";
import AdminInquiries from "./pages/AdminInquiries";
import Subscription from "./pages/Subscription";
import AISubscription from "./pages/AISubscription";
import BillingDashboard from "./pages/BillingDashboard";
import AgentProfile from "./pages/AgentProfile";
import BrowseAgents from "./pages/BrowseAgents";
import MyJobs from "./pages/MyJobs";
import MyTrips from "./pages/MyTrips";
import GroupTrips from "./pages/GroupTrips";
import AgentTripRequests from './pages/AgentTripRequests';
import BookingPreferences from "./pages/BookingPreferences";
import MyBookingsRedirect from "./pages/redirects/MyBookingsRedirect";
import FavoritesRedirect from "./pages/redirects/FavoritesRedirect";
import BookingPreferencesRedirect from "./pages/redirects/BookingPreferencesRedirect";
import CommissionDashboard from "./pages/CommissionDashboard";
import EmailPreview from "./pages/EmailPreview";
import MyBookings from "./pages/MyBookings";
import BookingDetails from "./pages/BookingDetails";
import BookingHistory from "./pages/BookingHistory";
import ModifyFlight from "./pages/ModifyFlight";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Redirect from "./pages/Redirect";
import TestGroupPayment from "./pages/TestGroupPayment";
import TravelFeed from "./pages/TravelFeed";
import TravelProfile from "./pages/TravelProfile";
import TravelSettings from "./pages/TravelSettings";
import TravelSettings2 from "./pages/TravelSettings2";
import MusicVolumeSettings from "./pages/MusicVolumeSettings";
import CrosspostingSettings from "./pages/CrosspostingSettings";
import CreatorDashboard from "./pages/CreatorDashboard";
import Search from "./pages/Search";
import Trending from "./pages/Trending";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import TrustSafety from "./pages/TrustSafety";
import CancellationRefundPolicy from "./pages/CancellationRefundPolicy";
import Shop from "./pages/Shop";
import AffiliateManager from "./pages/AffiliateManager";
import SupplierManagement from "./pages/SupplierManagement";
import CoCuratedDashboard from "./pages/CoCuratedDashboard";
import CoCuratedCreate from "./pages/CoCuratedCreate";
import CoCuratedMarketplace from "./pages/CoCuratedMarketplace";
import CoCuratedPackage from "./pages/CoCuratedPackage";
import CoCuratedBookingSuccess from "./pages/CoCuratedBookingSuccess";
import CoCuratedJourneys from "./pages/CoCuratedJourneys";
import TourActivityDetail from "./pages/TourActivityDetail";
import FineDining from "./pages/FineDining";
import RestaurantDetail from "./pages/RestaurantDetail";
import BrowseInfluencers from "./pages/BrowseInfluencers";
import BrowseCreators from "./pages/BrowseCreators";
import AdminSeed from "./pages/AdminSeed";
import InstagramAPI from "./pages/InstagramAPI";
import InstagramCallback from "./pages/InstagramCallback";
import YourActivity from "./pages/YourActivity";
import UploadEmailAssets from "./pages/UploadEmailAssets";
import UploadAppleMusicKey from "./pages/UploadAppleMusicKey";
import UploadAppleSignInKey from "./pages/UploadAppleSignInKey";
import AppleCallback from "./pages/AppleCallback";
import TransportationVendorApplication from "./pages/TransportationVendorApplication";
import TransportationVendorDashboard from "./pages/TransportationVendorDashboard";
import AdminTransportVendorVetting from "./pages/AdminTransportVendorVetting";
import TransportationVendorPartners from "./pages/TransportationVendorPartners";
import FleetManagementDashboard from "./components/FleetManagementDashboard";
import DriverManagementPanel from "./components/DriverManagementPanel";
import VendorPromotionManager from "./components/VendorPromotionManager";
import VendorPaymentDashboard from "./components/VendorPaymentDashboard";
import VendorAnalyticsDashboard from "./components/VendorAnalyticsDashboard";
import VendorBookingCalendar from "./components/VendorBookingCalendar";
import EscrowTimelineDashboard from "./components/EscrowTimelineDashboard";
import PlatformAnalyticsDashboard from "./components/PlatformAnalyticsDashboard";
import ActivityLogs from "./pages/ActivityLogs";
import CustomerVerification from "./pages/CustomerVerification";
import EmergencyContacts from "./pages/EmergencyContacts";
import AgentPerformanceDashboard from "./pages/AgentPerformanceDashboard";
import AdminCustomerVerifications from "./pages/AdminCustomerVerifications";
import CorporateContact from "./pages/CorporateContact";
import About from "./pages/About";
import TermsPage from "./pages/Terms";
import WhatWeDo from "./pages/WhatWeDo";
import DisputeResolution from "./pages/DisputeResolution";
import PrivacyCookies from "./pages/PrivacyCookies";
import HelpCenter from "./pages/HelpCenter";

const queryClient = new QueryClient();

// Main app content with routing
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  usePresence(); // Initialize presence tracking
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

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
    <div className="min-h-screen w-full flex flex-col">
      <SkipNavigation />
      <WelcomeModal open={showWelcomeModal} onClose={handleCloseWelcome} isFirstVisit={true} />
      <OnboardingTour />
      {showHeader && <Header />}
      <main id="main-content" className="flex-1" tabIndex={-1}>
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
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/ai-subscription" element={<AISubscription />} />
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
          <Route path="/booking-details/:bookingId" element={<BookingDetails />} />
          <Route path="/modify-flight/:bookingId" element={<ModifyFlight />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/hotel-booking" element={<HotelBooking />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/group-trips" element={<GroupTrips />} />
          <Route path="/group-trips/:tripId" element={<GroupTrips />} />
          <Route path="/agent-trip-requests" element={<AgentTripRequests />} />
          <Route path="/test-group-payment" element={<TestGroupPayment />} />
          <Route path="/travel-feed" element={<TravelFeed />} />
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
      </main>
      {showFooter && <Footer />}
      {showAIBooking && <AIBookingConcierge />}
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
              <AppContent />
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
