import { lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import CompleteProfile from '@/pages/CompleteProfile';
import ApplicationVerificationComplete from '@/pages/ApplicationVerificationComplete';
import ApplicationReviewDashboard from '@/pages/admin/ApplicationReviewDashboard';
// Legacy social feed - disabled
// import TravelFeed from '@/pages/TravelFeed';
import NotFound from '@/pages/NotFound';
import DesktopShell from '@/layout/DesktopShell';
import { RequireAgentTerms } from '@/components/RequireAgentTerms';

import { MarketingLayout, AuthLayout, MemberLayout, AdminLayout } from './Layouts';
import { RouteSectionBoundary } from './RouteSectionBoundary';
import { RequireAuth } from '@/components/routing/RequireAuth';
import { AdminGuard } from '@/hooks/useAdminGuard';

const SearchResults = lazy(() => import('@/pages/SearchResults'));
const MyStoryboardsPage = lazy(() => import('@/pages/storyboards/MyStoryboardsPage'));
const StoryboardDetailPage = lazy(() => import('@/pages/storyboards/StoryboardDetailPage'));
const NewStoryboardPage = lazy(() => import('@/pages/storyboards/NewStoryboardPage'));
const Profile = lazy(() => import('@/pages/Profile'));
const BrandOnboardingPage = lazy(() => import('@/pages/BrandOnboardingPage'));
const BrandConsolePage = lazy(() => import('@/pages/BrandConsolePage'));
const BrandCollectionDetailPage = lazy(() => import('@/pages/BrandCollectionDetailPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminSafetyDashboardPage = lazy(() => import('@/pages/admin/AdminSafetyDashboardPage'));
const AdminAgentsPage = lazy(() => import('@/pages/admin/AdminAgentsPage'));
const AdminCreatorsPage = lazy(() => import('@/pages/admin/AdminCreatorsPage'));
const AdminBookingsPage = lazy(() => import('@/pages/admin/AdminBookingsPage'));
const AdminDisputesPage = lazy(() => import('@/pages/admin/AdminDisputesPage'));
const AdminHomePage = lazy(() => import('@/pages/admin/AdminHomePage'));
const AdminMarketplaceOversightPage = lazy(() => import('@/pages/admin/AdminMarketplaceOversightPage'));
const SeedCreators = lazy(() => import('@/pages/admin/SeedCreators'));
const OpsEscrowDashboardPage = lazy(() => import('@/pages/OpsEscrowDashboardPage'));
const AgentPublicProfilePage = lazy(() => import('@/pages/agents/AgentPublicProfilePage'));
const CreatorPublicProfilePage = lazy(() => import('@/pages/creators/CreatorPublicProfilePage'));
const TravelProfileRedirect = lazy(() => import('@/pages/redirects/TravelProfileRedirectPage'));
const TripRequestRedirect = lazy(() => import('@/pages/redirects/TripRequestRedirect'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const TripRequestDetail = lazy(() => import('@/pages/marketplace/TripRequestDetail'));
const TripDetail = lazy(() => import('@/pages/marketplace/TripDetail'));
// Legacy social feed - disabled
// const Search = lazy(() => import('@/pages/Search'));
// const Trending = lazy(() => import('@/pages/Trending'));
const Shop = lazy(() => import('@/pages/Shop'));
const BrowseAgents = lazy(() => import('@/pages/BrowseAgents'));
const CreatorsPage = lazy(() => import('@/pages/CreatorsPage'));
const CreatorOnboardingPage = lazy(() => import('@/pages/onboarding/CreatorOnboardingPage'));
const AgentProfile = lazy(() => import('@/pages/AgentProfile'));
const AgentOnboarding = lazy(() => import('@/pages/AgentOnboarding'));
const AgentDashboard = lazy(() => import('@/pages/AgentDashboard'));
const AgentEarningsPage = lazy(() => import('@/pages/agent/AgentEarningsPage'));
const AgentTripRequests = lazy(() => import('@/pages/AgentTripRequests'));
const AgentStoryboardBuilderPage = lazy(() => import('@/pages/agents/AgentStoryboardBuilderPage'));
const AgentContractBuilder = lazy(() => import('@/pages/agent/AgentContractBuilder'));
const AgentPerformanceDashboard = lazy(() => import('@/pages/AgentPerformanceDashboard'));
const AgentDealsDashboardPage = lazy(() => import('@/pages/AgentDealsDashboardPage'));
const TripRequestsBoardPage = lazy(() => import('@/pages/TripRequestsBoardPage'));
const TripRequestDetailPage = lazy(() => import('@/pages/TripRequestDetailPage'));
const TripChatPage = lazy(() => import('@/pages/TripChatPage'));
const MyTripRequestsPage = lazy(() => import('@/pages/MyTripRequestsPage'));
const MyTripMatchesPage = lazy(() => import('@/pages/MyTripMatchesPage'));
const TripInboxPage = lazy(() => import('@/pages/TripInboxPage'));
const TravelerHomePage = lazy(() => import('@/pages/TravelerHomePage'));
const MyTripsPage = lazy(() => import('@/pages/trips/MyTripsPage'));
const PostTripPage = lazy(() => import('@/pages/trips/PostTripPage'));
const TripRequestDetailPageNew = lazy(() => import('@/pages/trips/TripRequestDetailPage'));
const PartnerTripsPage = lazy(() => import('@/pages/tiktok/PartnerTripsPage'));
const ProposalDetailPage = lazy(() => import('@/pages/proposals/ProposalDetailPage'));
const ProposalsForTripPage = lazy(() => import('@/pages/proposals/ProposalsForTripPage'));
const StoryboardSharePage = lazy(() => import('@/pages/public/StoryboardSharePage'));
const AgentTripsPage = lazy(() => import('@/pages/AgentTripsPage'));
const CreatorTripsPage = lazy(() => import('@/pages/CreatorTripsPage'));
const TikTokLabDashboardPage = lazy(() => import('@/pages/tiktok/TikTokLabDashboardPage'));
const TikTokEarningsPage = lazy(() => import('@/pages/tiktok/TikTokEarningsPage'));
const AgentApplyPage = lazy(() => import('@/pages/agents/AgentApplyPage'));
const StoryboardEditorPage = lazy(() => import('@/pages/StoryboardEditorPage'));
const TikTokLabStoryboardEditorPage = lazy(() => import('@/pages/TikTokLab/StoryboardEditorPage'));
const TikTokLabPage = lazy(() => import('@/pages/TikTokLabPage'));
const TikTokLabStoryboardDetailPage = lazy(() => import('@/pages/TikTokLab/StoryboardDetailPage'));
const ConciergePage = lazy(() => import('@/pages/ConciergePage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const MarketplaceGuidelinesPage = lazy(() => import('@/pages/MarketplaceGuidelinesPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const MyBookingsPage = lazy(() => import('@/pages/MyBookingsPage'));
const PartnerBookingsPage = lazy(() => import('@/pages/PartnerBookingsPage'));
const BookingDetailPage = lazy(() => import('@/pages/bookings/BookingDetailPage'));
const EmailPreview = lazy(() => import('@/pages/EmailPreview'));
const BillingDashboard = lazy(() => import('@/pages/BillingDashboard'));
const TikTokLabStoryboardsPage = lazy(() => import('@/pages/TikTokLab/StoryboardsPage'));
const TravelSettings = lazy(() => import('@/pages/TravelSettings'));
const ApplicationStatusCheck = lazy(() => import('@/pages/ApplicationStatusCheck'));
const TravelSettings2 = lazy(() => import('@/pages/TravelSettings2'));
const CreatorSettingsPage = lazy(() => import('@/pages/CreatorSettingsPage'));
const MusicVolumeSettings = lazy(() => import('@/pages/MusicVolumeSettings'));
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
const TravelerDashboardPage = lazy(() => import('@/pages/traveler/TravelerDashboardPage'));
const PartnerConsolePage = lazy(() => import('@/pages/partner/PartnerConsolePage'));
const PartnerEscrowPage = lazy(() => import('@/pages/partners/EscrowMilestonesPage'));
const MyJobs = lazy(() => import('@/pages/MyJobs'));
const MyTrips = lazy(() => import('@/pages/MyTrips'));
const GroupTrips = lazy(() => import('@/pages/GroupTrips'));
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
const TourActivityDetail = lazy(() => import('@/pages/TourActivityDetail'));
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
const BrandProfilePage = lazy(() => import('@/pages/BrandProfilePage'));
const OnboardingProfilePage = lazy(() => import('@/pages/OnboardingProfilePage'));
const TermsPage = lazy(() => import('@/pages/Terms'));
const WhatWeDo = lazy(() => import('@/pages/WhatWeDo'));
const DisputeResolution = lazy(() => import('@/pages/DisputeResolution'));
const PrivacyCookies = lazy(() => import('@/pages/PrivacyCookies'));
const HelpCenter = lazy(() => import('@/pages/HelpCenter'));
const CommunityGuidelines = lazy(() => import('@/pages/CommunityGuidelines'));
const TrustSafety = lazy(() => import('@/pages/TrustSafety'));
const LegalTermsPage = lazy(() => import('@/pages/LegalTermsPage'));
const LegalPrivacyPage = lazy(() => import('@/pages/LegalPrivacyPage'));
const TrustSafetyPage = lazy(() => import('@/pages/TrustSafetyPage'));
const CancellationRefundPolicy = lazy(() => import('@/pages/CancellationRefundPolicy'));
const CorporateContact = lazy(() => import('@/pages/CorporateContact'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'));
const AIAgentOnboarding = lazy(() => import('@/pages/AIAgentOnboarding'));
const AppleCallback = lazy(() => import('@/pages/AppleCallback'));
const EarningsDashboard = lazy(() => import('@/pages/EarningsDashboard'));

export const AppRoutes = () => (
  <Routes>
    <Route element={<MarketingLayout />}>
      <Route index element={<HomePage />} />
      <Route path="/about" element={<About />} />
      <Route path="/creators" element={<CreatorsPage />} />
      <Route path="/creators/:id" element={<CreatorPublicProfilePage />} />
      <Route path="/agents" element={<BrowseAgents />} />
      <Route path="/agents/:id" element={<AgentPublicProfilePage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/what-we-do" element={<WhatWeDo />} />
      <Route path="/dispute-resolution" element={<DisputeResolution />} />
      <Route path="/privacy-cookies" element={<PrivacyCookies />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/community-guidelines" element={<CommunityGuidelines />} />
      <Route path="/trust-safety" element={<TrustSafety />} />
      <Route path="/trust-and-safety" element={<TrustSafetyPage />} />
      <Route path="/legal/terms" element={<LegalTermsPage />} />
      <Route path="/legal/privacy" element={<LegalPrivacyPage />} />
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
      <Route path="/auth/complete-profile" element={<CompleteProfile />} />
      <Route path="/application/verification-complete" element={<ApplicationVerificationComplete />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/onboarding/creator" element={<CreatorOnboardingPage />} />
      <Route path="/brand/onboarding" element={<BrandOnboardingPage />} />
      <Route path="/onboarding/profile" element={<OnboardingProfilePage />} />
      <Route path="/ai-agent-setup" element={<AIAgentOnboarding />} />
    </Route>

    <Route element={<MemberLayout />}>
      <Route element={<DesktopShell />}>
        {/* Legacy social feed routes - DISABLED
        <Route path="/travel-feed" element={<TravelFeed />} />
        <Route path="/journeys" element={<TravelFeed />} />
        */}
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/travel-profile" element={<TravelProfileRedirect />} />
        <Route path="/travel-profile/:userId" element={<Navigate to="/creator/:userId" replace />} />
      </Route>

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
        element={<Navigate to="/post-trip" replace />}
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
      <Route path="/browse-creators" element={<Navigate to="/creators" replace />} />
      <Route path="/brands/:profileId" element={<BrandProfilePage />} />
      <Route path="/brands/:profileId/collections/:collectionId" element={<BrandCollectionDetailPage />} />
      <Route
        path="/trip-requests"
        element={(
          <RequireAuth>
            <TripRequestsBoardPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/trip-request/:id"
        element={<TripRequestRedirect />}
      />
      <Route
        path="/trip-request/:id/chat"
        element={(
          <RequireAuth>
            <TripChatPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/my-trip-requests"
        element={<Navigate to="/my-trips?tab=requests" replace />}
      />
      <Route
        path="/my-bookings"
        element={<Navigate to="/my-trips?tab=booked" replace />}
      />
      <Route
        path="/dashboard/trips"
        element={(
          <RequireAuth>
            <MyTripMatchesPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/trip-matches"
        element={<Navigate to="/dashboard/trips" replace />}
      />
      <Route
        path="/traveler"
        element={(
          <RequireAuth>
            <TravelerHomePage />
          </RequireAuth>
        )}
      />
      <Route path="/application/status" element={<ApplicationStatusCheck />} />
      <Route
        path="/trips"
        element={(
          <RequireAuth>
            <TripInboxPage />
          </RequireAuth>
        )}
      />
      <Route path="/my-trips" element={<MyTripsPage />} />
      <Route
        path="/post-trip"
        element={(
          <RequireAuth>
            <PostTripPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/trip-requests/:tripRequestId"
        element={(
          <RequireAuth>
            <TripRequestDetailPageNew />
          </RequireAuth>
        )}
      />
      <Route
        path="/proposals"
        element={(
          <RequireAuth>
            <ProposalsForTripPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/proposals/:proposalId"
        element={(
          <RequireAuth>
            <ProposalDetailPage />
          </RequireAuth>
        )}
      />
      <Route path="/s/:slugOrId" element={<StoryboardSharePage />} />
      <Route path="/agent-trips" element={<AgentTripsPage />} />
      <Route path="/creator-trips" element={<CreatorTripsPage />} />
      <Route path="/tiktok-lab" element={<TikTokLabDashboardPage />} />
      <Route path="/tiktok-lab/trips" element={<PartnerTripsPage />} />
      <Route path="/apply/agent" element={<AgentApplyPage />} />
      <Route path="/tiktok-lab/earnings" element={<TikTokEarningsPage />} />
      <Route path="/storyboards" element={<RequireAuth><MyStoryboardsPage /></RequireAuth>} />
      <Route path="/storyboards/new" element={<RequireAuth><NewStoryboardPage /></RequireAuth>} />
      <Route path="/storyboards/:id" element={<RequireAuth><StoryboardDetailPage /></RequireAuth>} />
      <Route path="/tiktok-lab/storyboards" element={<TikTokLabStoryboardsPage />} />
      <Route path="/tiktok-lab/storyboards/:id" element={<TikTokLabStoryboardDetailPage />} />
      <Route path="/tiktok-lab/storyboards/new" element={<TikTokLabStoryboardEditorPage />} />
      <Route path="/tiktok-lab/storyboards/:id/edit" element={<TikTokLabStoryboardEditorPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/marketplace-guidelines" element={<MarketplaceGuidelinesPage />} />
      <Route 
        path="/concierge" 
        element={
          <RequireAuth>
            <ConciergePage />
          </RequireAuth>
        } 
      />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/partner-bookings" element={<PartnerBookingsPage />} />
      <Route path="/bookings/:bookingId" element={<BookingDetailPage />} />
      <Route path="/traveler" element={<TravelerDashboardPage />} />
      <Route path="/partner" element={<PartnerConsolePage />} />
      <Route
        path="/partner/escrow"
        element={(
          <RequireAuth>
            <PartnerEscrowPage />
          </RequireAuth>
        )}
      />
      <Route path="/agent/:agentId" element={<AgentProfile />} />
      <Route path="/agent-onboarding" element={<AgentOnboarding />} />
      <Route path="/agent-dashboard" element={<RequireAgentTerms><AgentDashboard /></RequireAgentTerms>} />
      <Route
        path="/agent/earnings"
        element={(
          <RequireAuth>
            <AgentEarningsPage />
          </RequireAuth>
        )}
      />
      <Route path="/agent-dashboard/storyboards/new" element={<RequireAgentTerms><AgentStoryboardBuilderPage /></RequireAgentTerms>} />
      <Route path="/agent-trip-requests" element={<RequireAgentTerms><AgentTripRequests /></RequireAgentTerms>} />
      <Route path="/agent-performance" element={<RequireAgentTerms><AgentPerformanceDashboard /></RequireAgentTerms>} />
      <Route path="/agent-deals" element={<RequireAgentTerms><AgentDealsDashboardPage /></RequireAgentTerms>} />
      <Route 
        path="/agent/trips/:tripId/contract" 
        element={
          <RequireAuth>
            <RequireAgentTerms>
              <AgentContractBuilder />
            </RequireAgentTerms>
          </RequireAuth>
        } 
      />
      <Route path="/email-preview" element={<EmailPreview />} />
      <Route path="/billing-dashboard" element={<BillingDashboard />} />
      <Route path="/travel-settings" element={<CreatorSettingsPage />} />
      <Route path="/travel-settings-2" element={<TravelSettings2 />} />
      <Route path="/travel-settings/general" element={<TravelSettings />} />
      <Route path="/travel-settings/music-volume" element={<MusicVolumeSettings />} />
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
      <Route path="/console/brand" element={<BrandConsolePage />} />
      {/* Legacy social feed routes - DISABLED
      <Route path="/search" element={<Search />} />
      <Route path="/trending" element={<Trending />} />
      */}
      {/* New TikTok Creator Ecosystem Routes */}
      <Route path="/trip/:id" element={<CreatorTripPage />} />
      <Route path="/trip/:tripId/storyboard" element={<StoryboardEditorPage />} />
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
      <Route path="/my-jobs" element={<MyJobs />} />
      <Route path="/my-trips" element={<MyTrips />} />
      <Route path="/group-trips" element={<GroupTrips />} />
      <Route path="/group-trips/:tripId" element={<GroupTrips />} />
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
      <Route path="/tour/:tourId" element={<TourActivityDetail />} />
      <Route path="/restaurant/:restaurantId" element={<RestaurantDetail />} />
      <Route path="/your-activity" element={<YourActivity />} />
      <Route path="/earnings" element={<EarningsDashboard />} />
    </Route>

    <Route
      element={(
        <AdminGuard>
          <AdminLayout />
        </AdminGuard>
      )}
    >
      <Route path="/admin" element={<AdminHomePage />} />
      <Route path="/admin/applications" element={<ApplicationReviewDashboard />} />
      <Route path="/admin/agent-approvals" element={<AdminAgentApprovals />} />
      <Route path="/admin/safety" element={<AdminSafetyDashboardPage />} />
      <Route path="/admin/agents" element={<AdminAgentsPage />} />
      <Route path="/admin/creators" element={<AdminCreatorsPage />} />
      <Route path="/admin/bookings" element={<AdminBookingsPage />} />
      <Route path="/admin/disputes" element={<AdminDisputesPage />} />
      <Route path="/admin/marketplace" element={<AdminMarketplaceOversightPage />} />
      <Route path="/admin/escrow" element={<OpsEscrowDashboardPage />} />
      <Route path="/admin/cancellations" element={<AdminCancellations />} />
      <Route path="/admin/analytics/cancellations" element={<AdminCancellationAnalytics />} />
      <Route path="/admin/customer-verifications" element={<AdminCustomerVerifications />} />
      <Route path="/admin/inquiries" element={<AdminInquiries />} />
      <Route path="/admin/seed" element={<AdminSeed />} />
      <Route path="/admin/seed-creators" element={<SeedCreators />} />
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
