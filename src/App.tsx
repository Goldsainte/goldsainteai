import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { SkipNavigation } from "@/components/SkipNavigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { AIBookingConcierge } from "@/components/AIBookingConcierge";
import { OnboardingTour } from "@/components/OnboardingTour";
import { WelcomeModal } from "@/components/WelcomeModal";
import { usePresence } from "@/hooks/usePresence";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import HotelBooking from "./pages/HotelBooking";
import BookingConfirmation from "./pages/BookingConfirmation";
import Auth from "./pages/Auth";
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
import AdminInquiries from "./pages/AdminInquiries";
import AgentProfile from "./pages/AgentProfile";
import BrowseAgents from "./pages/BrowseAgents";
import MyJobs from "./pages/MyJobs";
import MyTrips from "./pages/MyTrips";
import BookingPreferences from "./pages/BookingPreferences";
import CommissionDashboard from "./pages/CommissionDashboard";
import EmailPreview from "./pages/EmailPreview";
import MyBookings from "./pages/MyBookings";
import BookingDetails from "./pages/BookingDetails";
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
import BrowseInfluencers from "./pages/BrowseInfluencers";
import BrowseCreators from "./pages/BrowseCreators";

const queryClient = new QueryClient();

// Main app content with routing
function AppContent() {
  const location = useLocation();
  usePresence(); // Initialize presence tracking
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Check if welcome modal should show (with URL overrides)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const forceWelcome = params.get('welcome') === '1';
      const forceTour = params.get('tour') === '1';

      const dismissed = localStorage.getItem('welcomeDismissed') === 'true';
      const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour') === 'true';

      console.debug('[WelcomeModal] params', { forceWelcome, forceTour });
      console.debug('[WelcomeModal] storage', { dismissed, hasSeenTour });

      // Always show if forced via query param, otherwise show if user hasn't dismissed or hasn't seen tour
      const shouldShow = forceWelcome || (!dismissed || !hasSeenTour);
      console.debug('[WelcomeModal] shouldShow', shouldShow);
      setShowWelcomeModal(shouldShow);

      // Allow forcing the tour to start via query param (useful for incognito/debug)
      if (forceTour) {
        try {
          localStorage.removeItem('hasSeenOnboardingTour');
        } catch {}
        window.dispatchEvent(new Event('welcomeDismissed'));
      }
    } catch {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    try { 
      localStorage.setItem('welcomeDismissed', 'true');
      window.dispatchEvent(new Event('welcomeDismissed'));
    } catch {}
  };
  
  // Don't show header on these pages as they have their own custom headers
  const hideHeaderPages = ['/auth', '/travel-feed', '/travel-profile', '/travel-settings'];
  const showHeader = !hideHeaderPages.some(page => location.pathname.startsWith(page));

  // Don't show AI Booking Concierge on Horizon pages
  const hideAIBookingPages = ['/travel-feed', '/travel-profile', '/travel-settings', '/search', '/trending'];
  const showAIBooking = !hideAIBookingPages.some(page => location.pathname.startsWith(page));

  return (
    <div className="min-h-screen w-full flex flex-col">
      <SkipNavigation />
      <WelcomeModal open={showWelcomeModal} onClose={handleCloseWelcome} />
      <OnboardingTour />
      {showHeader && <Header />}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/ai-agent-setup" element={<AIAgentOnboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/browse-agents" element={<BrowseAgents />} />
          <Route path="/browse-creators" element={<BrowseCreators />} />
          <Route path="/agent/:agentId" element={<AgentProfile />} />
          <Route path="/agent-onboarding" element={<AgentOnboarding />} />
          <Route path="/agent-dashboard" element={<AgentDashboard />} />
          <Route path="/admin/agent-approvals" element={<AdminAgentApprovals />} />
          <Route path="/admin/inquiries" element={<AdminInquiries />} />
          <Route path="/booking-preferences" element={<BookingPreferences />} />
          <Route path="/commission-dashboard" element={<CommissionDashboard />} />
          <Route path="/email-preview" element={<EmailPreview />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:collectionId" element={<CollectionDetail />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/travel-profile" element={<TravelProfile />} />
          <Route path="/travel-profile/:userId" element={<TravelProfile />} />
          <Route path="/travel-settings" element={<TravelSettings2 />} />
          <Route path="/travel-settings-2" element={<TravelSettings2 />} />
          <Route path="/travel-settings/edit" element={<TravelSettings />} />
          <Route path="/crossposting-settings" element={<CrosspostingSettings />} />
          <Route path="/creator-dashboard" element={<CreatorDashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/booking-details/:bookingId" element={<BookingDetails />} />
          <Route path="/modify-flight/:bookingId" element={<ModifyFlight />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/hotel-booking" element={<HotelBooking />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/test-group-payment" element={<TestGroupPayment />} />
          <Route path="/travel-feed" element={<TravelFeed />} />
          <Route path="/community-guidelines" element={<CommunityGuidelines />} />
          <Route path="/admin/trust-safety" element={<TrustSafety />} />
          <Route path="/cancellation-refund-policy" element={<CancellationRefundPolicy />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/affiliate-manager" element={<AffiliateManager />} />
          <Route path="/supplier-management" element={<SupplierManagement />} />
          <Route path="/cocurated-dashboard" element={<CoCuratedDashboard />} />
          <Route path="/cocurated-create" element={<CoCuratedCreate />} />
          <Route path="/cocurated-marketplace" element={<CoCuratedMarketplace />} />
            <Route path="/cocurated-package/:packageId" element={<CoCuratedPackage />} />
            <Route path="/cocurated-booking-success" element={<CoCuratedBookingSuccess />} />
            <Route path="/browse-influencers" element={<BrowseInfluencers />} />
          <Route path="/r" element={<Redirect />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {showAIBooking && <AIBookingConcierge />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
