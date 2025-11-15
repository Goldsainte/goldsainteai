import { lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import EmailConfirmedPage from '@/pages/EmailConfirmedPage';
// Legacy social feed - disabled
// import TravelFeed from '@/pages/TravelFeed';
import NotFound from '@/pages/NotFound';
import DesktopShell from '@/layout/DesktopShell';
import { RequireAgentTerms } from '@/components/RequireAgentTerms';

import { MarketingLayout, AuthLayout, MemberLayout, AdminLayout } from './Layouts';
import { RouteSectionBoundary } from './RouteSectionBoundary';

// Lazy load non-critical pages
const SearchResults = lazy(() => import('@/pages/SearchResults'));
const HotelBooking = lazy(() => import('@/pages/HotelBooking'));
const BookingConfirmation = lazy(() => import('@/pages/BookingConfirmation'));
const Profile = lazy(() => import('@/pages/Profile'));
const TravelProfileRedirect = lazy(() => import('@/pages/redirects/TravelProfileRedirectPage'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const ReelsViewer = lazy(() => import('@/pages/ReelsViewer'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const RequestTrip = lazy(() => import('@/pages/marketplace/RequestTrip'));
const TripRequestDetail = lazy(() => import('@/pages/marketplace/TripRequestDetail'));
const TripDetail = lazy(() => import('@/pages/marketplace/TripDetail'));
// Legacy social feed - disabled
// const Search = lazy(() => import('@/pages/Search'));
// const Trending = lazy(() => import('@/pages/Trending'));
const Shop = lazy(() => import('@/pages/Shop'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const BrowseAgents = lazy(() => import('@/pages/BrowseAgents'));
const BrowseCreators = lazy(() => import('@/pages/BrowseCreators'));
const BrowseInfluencers = lazy(() => import('@/pages/BrowseInfluencers'));
const AgentProfile = lazy(() => import('@/pages/AgentProfile'));
const AgentOnboarding = lazy(() => import('@/pages/AgentOnboarding'));
const AgentDashboard = lazy(() => import('@/pages/AgentDashboard'));
const AgentTripRequests = lazy(() => import('@/pages/AgentTripRequests'));
const AgentPerformanceDashboard = lazy(() => import('@/pages/AgentPerformanceDashboard'));
const AgentDealsDashboardPage = lazy(() => import('@/pages/AgentDealsDashboardPage'));
const TripRequestsBoardPage = lazy(() => import('@/pages/TripRequestsBoardPage'));
const TripRequestDetailPage = lazy(() => import('@/pages/TripRequestDetailPage'));
const TripChatPage = lazy(() => import('@/pages/TripChatPage'));
const MyTripRequestsPage = lazy(() => import('@/pages/MyTripRequestsPage'));
const MyBookingsPage = lazy(() => import('@/pages/MyBookingsPage'));
const PartnerBookingsPage = lazy(() => import('@/pages/PartnerBookingsPage'));
const BookingPreferencesRedirect = lazy(() => import('@/pages/redirects/BookingPreferencesRedirect'));
const FavoritesRedirect = lazy(() => import('@/pages/redirects/FavoritesRedirect'));
const CommissionDashboard = lazy(() => import('@/pages/CommissionDashboard'));
const EmailPreview = lazy(() => import('@/pages/EmailPreview'));
const Collections = lazy(() => import('@/pages/Collections'));
const CollectionDetail = lazy(() => import('@/pages/CollectionDetail'));
const BookingHistory = lazy(() => import('@/pages/BookingHistory'));
const Subscription = lazy(() => import('@/pages/Subscription'));
const BillingDashboard = lazy(() => import('@/pages/BillingDashboard'));
const TravelSettings = lazy(() => import('@/pages/TravelSettings'));
const TravelSettings2 = lazy(() => import('@/pages/TravelSettings2'));
const CreatorSettingsPage = lazy(() => import('@/pages/CreatorSettingsPage'));
const MusicVolumeSettings = lazy(() => import('@/pages/MusicVolumeSettings'));
const CrosspostingSettings = lazy(() => import('@/pages/CrosspostingSettings'));
// Legacy Instagram demo - disabled
// const InstagramCallback = lazy(() => import('@/pages/InstagramCallback'));
// const InstagramAPI = lazy(() => import('@/pages/InstagramAPI'));
const TikTokLab = lazy(() => import('@/pages/TikTokLab'));
const TikTokCallback = lazy(() => import('@/pages/TikTokCallback'));
const CreatorDashboard = lazy(() => import('@/pages/CreatorDashboard'));
// New TikTok creator ecosystem pages
const CreatorTripPage = lazy(() => import('@/pages/CreatorTripPage'));
const CreatorProfilePage = lazy(() => import('@/pages/CreatorProfilePage'));
const NewCollabRequestPage = lazy(() => import('@/pages/NewCollabRequestPage'));
const Messages = lazy(() => import('@/pages/Messages'));
const PriceAlerts = lazy(() => import('@/pages/PriceAlerts'));
const BookingDetails = lazy(() => import('@/pages/BookingDetails'));
const BookingDetailPage = lazy(() => import('@/pages/BookingDetailPage'));
const ModifyFlight = lazy(() => import('@/pages/ModifyFlight'));
const HotelDetails = lazy(() => import('@/pages/HotelDetails'));
const MyJobs = lazy(() => import('@/pages/MyJobs'));
const MyTrips = lazy(() => import('@/pages/MyTrips'));
const GroupTrips = lazy(() => import('@/pages/GroupTrips'));
const TestGroupPayment = lazy(() => import('@/pages/TestGroupPayment'));
const JournalListing = lazy(() => import('@/pages/JournalListing'));
const JournalArticle = lazy(() => import('@/pages/JournalArticle'));
const CreatorArticles = lazy(() => import('@/pages/CreatorArticles'));
const CreatorArticleEditor = lazy(() => import('@/pages/CreatorArticleEditor'));
const AffiliateManager = lazy(() => import('@/pages/AffiliateManager'));
const SupplierManagement = lazy(() => import('@/pages/SupplierManagement'));
const TransportationVendorPartners = lazy(() => import('@/pages/TransportationVendorPartners'));
const TransportationVendorApplication = lazy(() => import('@/pages/TransportationVendorApplication'));
const TransportationVendorDashboard = lazy(() => import('@/pages/TransportationVendorDashboard'));
const FleetManagementDashboard = lazy(() => import('@/components/FleetManagementDashboard'));
const DriverManagementPanel = lazy(() => import('@/components/DriverManagementPanel'));
const VendorPromotionManager = lazy(() => import('@/components/VendorPromotionManager'));
const VendorPaymentDashboard = lazy(() => import('@/components/VendorPaymentDashboard'));
const VendorAnalyticsDashboard = lazy(() => import('@/components/VendorAnalyticsDashboard'));
const VendorBookingCalendar = lazy(() => import('@/components/VendorBookingCalendar'));
const EscrowTimelineDashboard = lazy(() => import('@/components/EscrowTimelineDashboard'));
const ActivityLogs = lazy(() => import('@/pages/ActivityLogs'));
const CustomerVerification = lazy(() => import('@/pages/CustomerVerification'));
const EmergencyContacts = lazy(() => import('@/pages/EmergencyContacts'));
const CoCuratedDashboard = lazy(() => import('@/pages/CoCuratedDashboard'));
const CoCuratedCreate = lazy(() => import('@/pages/CoCuratedCreate'));
const CoCuratedMarketplace = lazy(() => import('@/pages/CoCuratedMarketplace'));
const CoCuratedJourneys = lazy(() => import('@/pages/CoCuratedJourneys'));
const CoCuratedPackage = lazy(() => import('@/pages/CoCuratedPackage'));
const CoCuratedBookingSuccess = lazy(() => import('@/pages/CoCuratedBookingSuccess'));
const TourActivityDetail = lazy(() => import('@/pages/TourActivityDetail'));
const FineDining = lazy(() => import('@/pages/FineDining'));
const RestaurantDetail = lazy(() => import('@/pages/RestaurantDetail'));
const YourActivity = lazy(() => import('@/pages/YourActivity'));
const Admin = lazy(() => import('@/pages/Admin'));
const AdminAgentApprovals = lazy(() => import('@/pages/AdminAgentApprovals'));
const AdminCancellations = lazy(() => import('@/pages/AdminCancellations'));
const AdminCancellationAnalytics = lazy(() => import('@/pages/AdminCancellationAnalytics'));
const AdminCustomerVerifications = lazy(() => import('@/pages/AdminCustomerVerifications'));
const AdminInquiries = lazy(() => import('@/pages/AdminInquiries'));
const AdminSeed = lazy(() => import('@/pages/AdminSeed'));
const UploadEmailAssets = lazy(() => import('@/pages/UploadEmailAssets'));
const UploadAppleMusicKey = lazy(() => import('@/pages/UploadAppleMusicKey'));
const UploadAppleSignInKey = lazy(() => import('@/pages/UploadAppleSignInKey'));
const AdminTransportVendorVetting = lazy(() => import('@/pages/AdminTransportVendorVetting'));
const PlatformAnalyticsDashboard = lazy(() => import('@/components/PlatformAnalyticsDashboard'));
const SystemHealth = lazy(() => import('@/pages/SystemHealth'));
const Redirect = lazy(() => import('@/pages/Redirect'));
const About = lazy(() => import('@/pages/About'));
const TermsPage = lazy(() => import('@/pages/Terms'));
const WhatWeDo = lazy(() => import('@/pages/WhatWeDo'));
const DisputeResolution = lazy(() => import('@/pages/DisputeResolution'));
const PrivacyCookies = lazy(() => import('@/pages/PrivacyCookies'));
const HelpCenter = lazy(() => import('@/pages/HelpCenter'));
const CommunityGuidelines = lazy(() => import('@/pages/CommunityGuidelines'));
const TrustSafety = lazy(() => import('@/pages/TrustSafety'));
const CancellationRefundPolicy = lazy(() => import('@/pages/CancellationRefundPolicy'));
const CorporateContact = lazy(() => import('@/pages/CorporateContact'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const AIAgentOnboarding = lazy(() => import('@/pages/AIAgentOnboarding'));
const AppleCallback = lazy(() => import('@/pages/AppleCallback'));

export const AppRoutes = () => (
  <Routes>
    <Route element={<MarketingLayout />}>
      <Route index element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/what-we-do" element={<WhatWeDo />} />
      <Route path="/dispute-resolution" element={<DisputeResolution />} />
      <Route path="/privacy-cookies" element={<PrivacyCookies />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/community-guidelines" element={<CommunityGuidelines />} />
      <Route path="/trust-safety" element={<TrustSafety />} />
      <Route path="/cancellation-refund-policy" element={<CancellationRefundPolicy />} />
      <Route path="/corporate-contact" element={<CorporateContact />} />
      <Route path="/shop" element={<Shop />} />
    </Route>

    <Route element={<AuthLayout />}>
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/callback/apple" element={<AppleCallback />} />
      <Route path="/auth/apple/callback" element={<AppleCallback />} />
      <Route path="/auth/email-confirmed" element={<EmailConfirmedPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/ai-agent-setup" element={<AIAgentOnboarding />} />
    </Route>

    <Route element={<MemberLayout />}>
      <Route element={<DesktopShell />}>
        {/* Legacy social feed routes - DISABLED
        <Route path="/travel-feed" element={<TravelFeed />} />
        <Route path="/journeys" element={<TravelFeed />} />
        */}
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/reels" element={<ReelsViewer />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/travel-profile" element={<TravelProfileRedirect />} />
        <Route path="/travel-profile/:userId" element={<Navigate to="/creator/:userId" replace />} />
      </Route>

      <Route
        path="/dashboard"
        element={(
          <RouteSectionBoundary section="dashboard">
            <Dashboard />
          </RouteSectionBoundary>
        )}
      />
      <Route
        path="/marketplace"
        element={(
          <RouteSectionBoundary section="marketplace">
            <Marketplace />
          </RouteSectionBoundary>
        )}
      />
      <Route
        path="/marketplace/request-trip"
        element={(
          <RouteSectionBoundary section="marketplace">
            <RequestTrip />
          </RouteSectionBoundary>
        )}
      />
      <Route
        path="/marketplace/request/:id"
        element={(
          <RouteSectionBoundary section="marketplace">
            <TripRequestDetail />
          </RouteSectionBoundary>
        )}
      />
      <Route
        path="/marketplace/trip/:id"
        element={(
          <RouteSectionBoundary section="marketplace">
            <TripDetail />
          </RouteSectionBoundary>
        )}
      />
      <Route path="/browse-agents" element={<BrowseAgents />} />
      <Route path="/browse-creators" element={<BrowseCreators />} />
      <Route path="/browse-influencers" element={<BrowseInfluencers />} />
      <Route path="/trip-requests" element={<TripRequestsBoardPage />} />
      <Route path="/trip-request/:id" element={<TripRequestDetailPage />} />
      <Route path="/trip-request/:id/chat" element={<TripChatPage />} />
      <Route path="/my-trip-requests" element={<MyTripRequestsPage />} />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/partner-bookings" element={<PartnerBookingsPage />} />
      <Route path="/booking/:id" element={<BookingDetailPage />} />
      <Route path="/agent/:agentId" element={<AgentProfile />} />
      <Route path="/agent-onboarding" element={<AgentOnboarding />} />
      <Route path="/agent-dashboard" element={<RequireAgentTerms><AgentDashboard /></RequireAgentTerms>} />
      <Route path="/agent-trip-requests" element={<RequireAgentTerms><AgentTripRequests /></RequireAgentTerms>} />
      <Route path="/agent-performance" element={<RequireAgentTerms><AgentPerformanceDashboard /></RequireAgentTerms>} />
      <Route path="/agent-deals" element={<RequireAgentTerms><AgentDealsDashboardPage /></RequireAgentTerms>} />
      <Route path="/booking-preferences" element={<BookingPreferencesRedirect />} />
      <Route path="/commission-dashboard" element={<CommissionDashboard />} />
      <Route path="/email-preview" element={<EmailPreview />} />
      <Route path="/favorites" element={<FavoritesRedirect />} />
      <Route path="/collections" element={<Collections />} />
      <Route path="/collections/:collectionId" element={<CollectionDetail />} />
      <Route path="/booking-history" element={<BookingHistory />} />
      <Route path="/subscription" element={<Subscription />} />
      <Route path="/billing-dashboard" element={<BillingDashboard />} />
      <Route path="/travel-settings" element={<CreatorSettingsPage />} />
      <Route path="/travel-settings-2" element={<TravelSettings2 />} />
      <Route path="/travel-settings/general" element={<TravelSettings />} />
      <Route path="/travel-settings/music-volume" element={<MusicVolumeSettings />} />
      <Route path="/crossposting-settings" element={<CrosspostingSettings />} />
      {/* Legacy Instagram demo routes - DISABLED
      <Route path="/instagram-callback" element={<InstagramCallback />} />
      <Route path="/instagram-api" element={<InstagramAPI />} />
      */}
      <Route
        path="/tiktok-lab"
        element={(
          <RouteSectionBoundary section="tiktok-lab">
            <TikTokLab />
          </RouteSectionBoundary>
        )}
      />
      <Route
        path="/tiktok-callback"
        element={(
          <RouteSectionBoundary section="tiktok-callback">
            <TikTokCallback />
          </RouteSectionBoundary>
        )}
      />
      <Route path="/creator-dashboard" element={<CreatorDashboard />} />
      {/* Legacy social feed routes - DISABLED
      <Route path="/search" element={<Search />} />
      <Route path="/trending" element={<Trending />} />
      */}
      {/* New TikTok Creator Ecosystem Routes */}
      <Route path="/trip/:id" element={<CreatorTripPage />} />
      <Route path="/creator/:id" element={<CreatorProfilePage />} />
      <Route path="/collabs/new" element={<NewCollabRequestPage />} />
      <Route
        path="/messages"
        element={(
          <RouteSectionBoundary section="messages">
            <Messages />
          </RouteSectionBoundary>
        )}
      />
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
      <Route path="/test-group-payment" element={<TestGroupPayment />} />
      <Route path="/journal" element={<JournalListing />} />
      <Route path="/journal/:slug" element={<JournalArticle />} />
      <Route path="/creator-articles" element={<CreatorArticles />} />
      <Route path="/creator-articles/new" element={<CreatorArticleEditor />} />
      <Route path="/creator-articles/edit/:id" element={<CreatorArticleEditor />} />
      <Route path="/affiliate-manager" element={<AffiliateManager />} />
      <Route path="/supplier-management" element={<SupplierManagement />} />
      <Route path="/transportation-vendor-partners" element={<TransportationVendorPartners />} />
      <Route path="/transportation-vendor-application" element={<TransportationVendorApplication />} />
      <Route path="/transportation-vendor-dashboard" element={<TransportationVendorDashboard />} />
      <Route path="/fleet-management" element={<FleetManagementDashboard />} />
      <Route path="/driver-management" element={<DriverManagementPanel />} />
      <Route path="/vendor-promotions" element={<VendorPromotionManager />} />
      <Route path="/vendor-payments" element={<VendorPaymentDashboard />} />
      <Route path="/vendor-analytics" element={<VendorAnalyticsDashboard />} />
      <Route path="/vendor-booking-calendar" element={<VendorBookingCalendar />} />
      <Route path="/escrow-timeline" element={<EscrowTimelineDashboard />} />
      <Route path="/activity-logs" element={<ActivityLogs />} />
      <Route path="/customer-verification" element={<CustomerVerification />} />
      <Route path="/emergency-contacts" element={<EmergencyContacts />} />
      <Route path="/cocurated-dashboard" element={<CoCuratedDashboard />} />
      <Route path="/cocurated-create" element={<CoCuratedCreate />} />
      <Route path="/cocurated-marketplace" element={<CoCuratedMarketplace />} />
      <Route path="/cocurated-journeys" element={<CoCuratedJourneys />} />
      <Route path="/tour/:tourId" element={<TourActivityDetail />} />
      <Route path="/fine-dining" element={<FineDining />} />
      <Route path="/restaurant/:restaurantId" element={<RestaurantDetail />} />
      <Route path="/cocurated-package/:packageId" element={<CoCuratedPackage />} />
      <Route path="/cocurated-booking-success" element={<CoCuratedBookingSuccess />} />
      <Route path="/your-activity" element={<YourActivity />} />
    </Route>

    <Route element={<AdminLayout />}>
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/agent-approvals" element={<AdminAgentApprovals />} />
      <Route path="/admin/cancellations" element={<AdminCancellations />} />
      <Route path="/admin/analytics/cancellations" element={<AdminCancellationAnalytics />} />
      <Route path="/admin/customer-verifications" element={<AdminCustomerVerifications />} />
      <Route path="/admin/inquiries" element={<AdminInquiries />} />
      <Route path="/admin/seed" element={<AdminSeed />} />
      <Route path="/admin/upload-email-assets" element={<UploadEmailAssets />} />
      <Route path="/admin/upload-apple-music-key" element={<UploadAppleMusicKey />} />
      <Route path="/admin/upload-apple-signin-key" element={<UploadAppleSignInKey />} />
      <Route path="/admin/transport-vendor-vetting" element={<AdminTransportVendorVetting />} />
      <Route path="/admin/platform-analytics" element={<PlatformAnalyticsDashboard />} />
      <Route path="/admin/trust-safety" element={<TrustSafety />} />
      <Route path="/system-health" element={<SystemHealth />} />
    </Route>

    <Route path="/r" element={<Redirect />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);
