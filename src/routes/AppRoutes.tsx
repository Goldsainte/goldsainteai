import { lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import UnsubscribePage from '@/pages/UnsubscribePage';
import CompleteProfile from '@/pages/CompleteProfile';
import ApplicationVerificationComplete from '@/pages/ApplicationVerificationComplete';
import ApplicationReviewDashboard from '@/pages/admin/ApplicationReviewDashboard';
import NotFound from '@/pages/NotFound';
import DesktopShell from '@/layout/DesktopShell';
import { RequireAgentTerms } from '@/components/RequireAgentTerms';

import { MarketingLayout, AuthLayout, MemberLayout, AdminLayout } from './Layouts';
import { RouteSectionBoundary } from './RouteSectionBoundary';
import { RequireAuth } from '@/components/routing/RequireAuth';
import { OnboardingRouter } from '@/components/routing/OnboardingRouter';
import { AdminGuard } from '@/hooks/useAdminGuard';

const SearchResults = lazy(() => import('@/pages/SearchResults'));
const Profile = lazy(() => import('@/pages/Profile'));
const BrandApplyPage = lazy(() => import('@/pages/apply/BrandOnboarding'));
const BrandConsolePage = lazy(() => import('@/pages/BrandConsolePage'));
const BrandCollectionDetailPage = lazy(() => import('@/pages/BrandCollectionDetailPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminSafetyDashboardPage = lazy(() => import('@/pages/admin/AdminSafetyDashboardPage'));
const AdminAgentsPage = lazy(() => import('@/pages/admin/AdminAgentsPage'));
const AdminCreatorsPage = lazy(() => import('@/pages/admin/AdminCreatorsPage'));
const AdminBookingsPage = lazy(() => import('@/pages/admin/AdminBookingsPage'));
const AdminDisputesPage = lazy(() => import('@/pages/admin/AdminDisputesPage'));
const AdminHomePage = lazy(() => import('@/pages/admin/AdminHomePage'));
const AdminTripsPage = lazy(() => import('@/pages/admin/AdminTripsPage'));
const AdminWaitlistPage = lazy(() => import('@/pages/admin/AdminWaitlistPage'));
const AdminEmailDLQPage = lazy(() => import('@/pages/admin/AdminEmailDLQPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));

const OpsEscrowDashboardPage = lazy(() => import('@/pages/OpsEscrowDashboardPage'));
const AgentPublicProfilePage = lazy(() => import('@/pages/agents/AgentPublicProfilePage'));
const CreatorPublicProfilePage = lazy(() => import('@/pages/creators/CreatorPublicProfilePage'));
const TravelProfileRedirect = lazy(() => import('@/pages/redirects/TravelProfileRedirectPage'));
const TripRequestRedirect = lazy(() => import('@/pages/redirects/TripRequestRedirect'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const TripRequestDetail = lazy(() => import('@/pages/marketplace/TripRequestDetail'));
const TripDetail = lazy(() => import('@/pages/marketplace/TripDetail'));
const TrovaTripDetailPage = lazy(() => import('@/pages/marketplace/TrovaTripDetailPage'));
const CreatorOnboardingPage = lazy(() => import('@/pages/onboarding/CreatorOnboardingPage'));
const AgentProfile = lazy(() => import('@/pages/AgentProfile'));

const AgentDashboard = lazy(() => import('@/pages/AgentDashboard'));
const AgentEarningsPage = lazy(() => import('@/pages/agent/AgentEarningsPage'));
const AgentTripRequests = lazy(() => import('@/pages/AgentTripRequests'));
const AgentContractBuilder = lazy(() => import('@/pages/agent/AgentContractBuilder'));
const AgentPerformanceDashboard = lazy(() => import('@/pages/AgentPerformanceDashboard'));
const AgentDealsDashboardPage = lazy(() => import('@/pages/AgentDealsDashboardPage'));
const TripRequestsBoardPage = lazy(() => import('@/pages/TripRequestsBoardPage'));
const TripRequestDetailPage = lazy(() => import('@/pages/TripRequestDetailPage'));
const TripChatPage = lazy(() => import('@/pages/TripChatPage'));
const MyTripRequestsPage = lazy(() => import('@/pages/MyTripRequestsPage'));
const MyTripMatchesPage = lazy(() => import('@/pages/MyTripMatchesPage'));
const TripInboxPage = lazy(() => import('@/pages/TripInboxPage'));
const TravelerDashboardPage = lazy(() => import('@/pages/traveler/TravelerDashboardPage'));
const MyTripsPage = lazy(() => import('@/pages/trips/MyTripsPage'));
const PostTripPage = lazy(() => import('@/pages/trips/PostTripPage'));
const TripRequestDetailPageNew = lazy(() => import('@/pages/trips/TripRequestDetailPage'));

const ProposalDetailPage = lazy(() => import('@/pages/proposals/ProposalDetailPage'));
const ProposalsForTripPage = lazy(() => import('@/pages/proposals/ProposalsForTripPage'));
const NewProposalPage = lazy(() => import('@/pages/proposals/NewProposalPage'));
const MyProposalsPage = lazy(() => import('@/pages/proposals/MyProposalsPage'));
const PublicStoryboardPage = lazy(() => import('@/pages/public/PublicStoryboardPage'));
const AgentTripsPage = lazy(() => import('@/pages/AgentTripsPage'));
const CreatorTripsPage = lazy(() => import('@/pages/CreatorTripsPage'));

const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const MarketplaceGuidelinesPage = lazy(() => import('@/pages/MarketplaceGuidelinesPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const MyBookingsPage = lazy(() => import('@/pages/MyBookingsPage'));
const PartnerBookingsPage = lazy(() => import('@/pages/PartnerBookingsPage'));
const BookingDetailPage = lazy(() => import('@/pages/bookings/BookingDetailPage'));
const EmailPreview = lazy(() => import('@/pages/EmailPreview'));
const BillingDashboard = lazy(() => import('@/pages/BillingDashboard'));
const TravelSettings = lazy(() => import('@/pages/TravelSettings'));
const ApplicationStatusCheck = lazy(() => import('@/pages/ApplicationStatusCheck'));
const AgentApplicationForm = lazy(() => import('@/pages/AgentApplicationForm'));

const CreatorSettingsPage = lazy(() => import('@/pages/CreatorSettingsPage'));

const TikTokCallback = lazy(() => import('@/pages/TikTokCallback'));
const CreatorDashboard = lazy(() => import('@/pages/CreatorDashboard'));
// New TikTok creator ecosystem pages
const CreatorTripPage = lazy(() => import('@/pages/CreatorTripPage'));
const TripBuilderPage = lazy(() => import('@/pages/TripBuilderPage'));
const ItineraryBuilderPage = lazy(() => import('@/pages/ItineraryBuilderPage'));
const ItineraryGuidePage = lazy(() => import('@/pages/ItineraryGuidePage'));
const MyPurchasesPage = lazy(() => import('@/pages/MyPurchasesPage'));
// CreatorProfilePage removed — /creator/:id now redirects to /creators/:id
const CreatorRedirect = lazy(() => import('@/pages/redirects/CreatorRedirect'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
// TravelerDashboardPage import moved to line 68
const PartnerConsolePage = lazy(() => import('@/pages/partner/PartnerConsolePage'));

const MyJobs = lazy(() => import('@/pages/MyJobs'));
// MyTrips removed - using MyTripsPage instead
const GroupTrips = lazy(() => import('@/pages/GroupTrips'));
const JournalListing = lazy(() => import('@/pages/JournalListing'));
const JournalArticle = lazy(() => import('@/pages/JournalArticle'));
const EscrowTimelineDashboard = lazy(() => import('@/components/EscrowTimelineDashboard'));
const ActivityLogs = lazy(() => import('@/pages/ActivityLogs'));
const CustomerVerification = lazy(() => import('@/pages/CustomerVerification'));
const EmergencyContacts = lazy(() => import('@/pages/EmergencyContacts'));
const Admin = lazy(() => import('@/pages/Admin'));
const AdminAgentApprovals = lazy(() => import('@/pages/AdminAgentApprovals'));
const AdminCancellations = lazy(() => import('@/pages/AdminCancellations'));
const AdminCancellationAnalytics = lazy(() => import('@/pages/AdminCancellationAnalytics'));
const AdminCustomerVerifications = lazy(() => import('@/pages/AdminCustomerVerifications'));
const AdminInquiries = lazy(() => import('@/pages/AdminInquiries'));
const PlatformAnalyticsDashboard = lazy(() => import('@/components/PlatformAnalyticsDashboard'));
const SystemHealth = lazy(() => import('@/pages/SystemHealth'));
const Redirect = lazy(() => import('@/pages/Redirect'));
const About = lazy(() => import('@/pages/About'));
const BrandProfilePage = lazy(() => import('@/pages/BrandProfilePage'));

const TermsPage = lazy(() => import('@/pages/Terms'));
const WhatWeDo = lazy(() => import('@/pages/WhatWeDo'));
const HowItWorksTraveler = lazy(() => import('@/pages/HowItWorksTraveler'));
const HowItWorksCreator = lazy(() => import('@/pages/HowItWorksCreator'));
const HowItWorksAgent = lazy(() => import('@/pages/HowItWorksAgent'));
const DisputeResolution = lazy(() => import('@/pages/DisputeResolution'));
const PrivacyCookies = lazy(() => import('@/pages/PrivacyCookies'));
const HelpCenter = lazy(() => import('@/pages/HelpCenter'));
const SupportedCountriesPage = lazy(() => import('@/pages/help/SupportedCountriesPage'));
const VideoTourPage = lazy(() => import('@/pages/help/VideoTourPage'));
const TaxInformationPage = lazy(() => import('@/pages/help/TaxInformationPage'));
const AgentRequirementsPage = lazy(() => import('@/pages/help/AgentRequirementsPage'));
const PaymentsAndFeesPage = lazy(() => import('@/pages/help/PaymentsAndFeesPage'));
const CommunityGuidelines = lazy(() => import('@/pages/CommunityGuidelines'));
const TrustSafety = lazy(() => import('@/pages/TrustSafety'));
const AdminTrustSafety = lazy(() => import('@/pages/admin/AdminTrustSafety'));
const LegalCreatorAgreementPage = lazy(() => import('@/pages/LegalCreatorAgreementPage'));
const LegalAgentAgreementPage = lazy(() => import('@/pages/LegalAgentAgreementPage'));
const CancellationRefundPolicy = lazy(() => import('@/pages/CancellationRefundPolicy'));
const CorporateContact = lazy(() => import('@/pages/CorporateContact'));
const TransparencyAgreement = lazy(() => import('@/pages/TransparencyAgreement'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

const TravelerPreferencesOnboardingPage = lazy(() => import('@/pages/onboarding/TravelerPreferencesOnboardingPage'));
const CollectionsPage = lazy(() => import('@/pages/CollectionsPage'));
const TravelerDemandPage = lazy(() => import('@/pages/TravelerDemandPage'));
const AIAgentOnboarding = lazy(() => import('@/pages/AIAgentOnboarding'));
const AppleCallback = lazy(() => import('@/pages/AppleCallback'));
const EarningsDashboard = lazy(() => import('@/pages/EarningsDashboard'));
const HealthCheck = lazy(() => import('@/pages/HealthCheck'));
const BookTripPage = lazy(() => import('@/pages/trips/BookTripPage'));
const BookingConfirmation = lazy(() => import('@/pages/BookingConfirmation'));
const UsernameRedirect = lazy(() => import('@/pages/UsernameRedirect'));
const ShopPage = lazy(() => import('@/pages/ShopPage'));
const BundleBuilder = lazy(() => import('@/pages/BundleBuilder'));
const BundleDetailPage = lazy(() => import('@/pages/BundleDetailPage'));

const NewsroomLayout = lazy(() => import('@/pages/newsroom/NewsroomLayout'));
const NewsroomLanding = lazy(() => import('@/pages/newsroom/NewsroomLanding'));
const NewsroomArticleDetail = lazy(() => import('@/pages/newsroom/ArticleDetail'));
const NewsroomArchive = lazy(() => import('@/pages/newsroom/Archive'));
const NewsroomMediaKit = lazy(() => import('@/pages/newsroom/MediaKit'));
const NewsroomCompanyFacts = lazy(() => import('@/pages/newsroom/CompanyFacts'));
const NewsroomLeadership = lazy(() => import('@/pages/newsroom/Leadership'));
const NewsroomEditorialPolicy = lazy(() => import('@/pages/newsroom/EditorialPolicy'));
const NewsroomPressContact = lazy(() => import('@/pages/newsroom/PressContact'));
const NewsroomWorldCupArticle = lazy(() => import('@/pages/newsroom/WorldCupArticlePage'));
const AdminNewsroomList = lazy(() => import('@/pages/admin/AdminNewsroomList'));
const AdminArticleEditor = lazy(() => import('@/pages/admin/AdminArticleEditor'));
const AdminNewsroomAuthors = lazy(() => import('@/pages/admin/AdminNewsroomAuthors'));

export const AppRoutes = () => (
  <Routes>
    <Route element={<MarketingLayout />}>
      <Route index element={<HomePage />} />
      <Route path="/about" element={<About />} />
      <Route path="/@:username" element={<UsernameRedirect />} />
      <Route path="/@:username/shop" element={<ShopPage />} />
      <Route path="/bundle/:id" element={<BundleDetailPage />} />
      <Route path="/bundle-builder" element={<BundleBuilder />} />
      <Route path="/creators" element={<Navigate to="/marketplace" replace />} />
      <Route path="/creators/:id" element={<CreatorPublicProfilePage />} />
      <Route path="/agents" element={<Navigate to="/marketplace" replace />} />
      <Route path="/agents/:id" element={<AgentPublicProfilePage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/what-we-do" element={<WhatWeDo />} />
      <Route path="/how-it-works/traveler" element={<HowItWorksTraveler />} />
      <Route path="/how-it-works/creator" element={<HowItWorksCreator />} />
      <Route path="/how-it-works/agent" element={<HowItWorksAgent />} />
      <Route path="/dispute-resolution" element={<DisputeResolution />} />
      <Route path="/privacy-cookies" element={<PrivacyCookies />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/help/supported-countries" element={<SupportedCountriesPage />} />
      <Route path="/help/video-tour" element={<VideoTourPage />} />
      <Route path="/help/tax-information" element={<TaxInformationPage />} />
      <Route path="/help/agent-requirements" element={<AgentRequirementsPage />} />
      <Route path="/help/payments-and-fees" element={<PaymentsAndFeesPage />} />
      <Route path="/help/trust-and-safety" element={<Navigate to="/trust-safety" replace />} />
      <Route path="/community-guidelines" element={<CommunityGuidelines />} />
      <Route path="/trust-safety" element={<TrustSafety />} />
      <Route path="/trust-and-safety" element={<Navigate to="/trust-safety" replace />} />
      <Route path="/health" element={<HealthCheck />} />
      <Route path="/legal/terms" element={<Navigate to="/terms" replace />} />
      <Route path="/legal/privacy" element={<Navigate to="/privacy-cookies" replace />} />
      <Route path="/legal/creator-agreement" element={<LegalCreatorAgreementPage />} />
      <Route path="/legal/agent-agreement" element={<LegalAgentAgreementPage />} />
      <Route path="/cancellation-refund-policy" element={<CancellationRefundPolicy />} />
      <Route path="/transparency-agreement" element={<TransparencyAgreement />} />
      <Route path="/corporate-contact" element={<CorporateContact />} />
     <Route path="/unsubscribe" element={<UnsubscribePage />} />

      <Route path="/newsroom" element={<NewsroomLayout />}>
        <Route index element={<NewsroomLanding />} />
        <Route path="archive" element={<NewsroomArchive />} />
        <Route path="media-kit" element={<NewsroomMediaKit />} />
        <Route path="company-facts" element={<NewsroomCompanyFacts />} />
        <Route path="leadership" element={<NewsroomLeadership />} />
        <Route path="editorial-policy" element={<NewsroomEditorialPolicy />} />
        <Route path="press-contact" element={<NewsroomPressContact />} />
        <Route path="press-releases/:slug" element={<NewsroomArticleDetail expectedType="press_release" />} />
        <Route path="news/world-cup-reality-check" element={<NewsroomWorldCupArticle />} />
        <Route path="news/:slug" element={<NewsroomArticleDetail expectedType="news" />} />
      </Route>
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
      {/* Smart onboarding router - redirects based on account type */}
      <Route path="/onboarding" element={<OnboardingRouter />} />
      <Route path="/onboarding/traveler/preferences" element={<RequireAuth><TravelerPreferencesOnboardingPage /></RequireAuth>} />
      <Route path="/onboarding/creator" element={<RequireAuth><CreatorOnboardingPage /></RequireAuth>} />
      <Route path="/brand/onboarding" element={<Navigate to="/apply/brand" replace />} />
      <Route path="/apply/brand" element={<BrandApplyPage />} />
      
      <Route path="/ai-agent-setup" element={<RequireAuth><AIAgentOnboarding /></RequireAuth>} />
    </Route>

    <Route element={<MemberLayout />}>
      <Route element={<DesktopShell />}>
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/travel-profile" element={<TravelProfileRedirect />} />
        <Route path="/travel-profile/:userId" element={<TravelProfileRedirect />} />
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
        path="/collections"
        element={(
          <RequireAuth>
            <CollectionsPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/traveler-demand"
        element={(
          <RequireAuth>
            <TravelerDemandPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/marketplace/trip/:id"
        element={(
          <RouteSectionBoundary section="marketplace">
            <TrovaTripDetailPage />
          </RouteSectionBoundary>
        )}
      />
      <Route
        path="/trip/:slug"
        element={<Navigate to="/marketplace" replace />}
      />
      <Route path="/browse-agents" element={<Navigate to="/marketplace" replace />} />
      <Route path="/browse-creators" element={<Navigate to="/marketplace" replace />} />
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
            <TravelerDashboardPage />
          </RequireAuth>
        )}
      />
      <Route path="/application/status" element={<ApplicationStatusCheck />} />
      <Route path="/apply/agent" element={<AgentApplicationForm />} />
      <Route path="/agent-onboarding" element={<Navigate to="/apply/agent" replace />} />
      <Route
        path="/trips"
        element={(
          <RequireAuth>
            <TripInboxPage />
          </RequireAuth>
        )}
      />
      <Route 
        path="/my-trips" 
        element={(
          <RequireAuth>
            <MyTripsPage />
          </RequireAuth>
        )} 
      />
      <Route
        path="/post-trip"
        element={<RequireAuth><PostTripPage /></RequireAuth>}
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
        path="/proposals/new"
        element={(
          <RequireAuth>
            <NewProposalPage />
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
        path="/my-proposals"
        element={(
          <RequireAuth>
            <MyProposalsPage />
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
      <Route path="/s/:slugOrId" element={<PublicStoryboardPage />} />
      <Route path="/agent-trips" element={<RequireAuth><AgentTripsPage /></RequireAuth>} />
      <Route path="/creator-trips" element={<RequireAuth><CreatorTripsPage /></RequireAuth>} />
      <Route
        path="/trip-builder"
        element={(
          <RequireAuth>
            <TripBuilderPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/itinerary-builder"
        element={(
          <RequireAuth>
            <ItineraryBuilderPage />
          </RequireAuth>
        )}
      />
      <Route path="/itinerary-guide/:id" element={<ItineraryGuidePage />} />
      <Route path="/my-purchases" element={<RequireAuth><MyPurchasesPage /></RequireAuth>} />
      <Route path="/storyboards" element={<Navigate to="/marketplace" replace />} />
      <Route path="/storyboards/new" element={<Navigate to="/marketplace" replace />} />
      <Route path="/storyboards/:id" element={<Navigate to="/marketplace" replace />} />
      <Route path="/storyboards/:id/edit" element={<Navigate to="/marketplace" replace />} />
      <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
      <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
      <Route path="/marketplace-guidelines" element={<MarketplaceGuidelinesPage />} />
      
      <Route path="/my-bookings" element={<RequireAuth><MyBookingsPage /></RequireAuth>} />
      <Route path="/partner-bookings" element={<RequireAuth><PartnerBookingsPage /></RequireAuth>} />
      <Route path="/bookings/:bookingId" element={<RequireAuth><BookingDetailPage /></RequireAuth>} />
      <Route path="/book/:id" element={<RequireAuth><BookTripPage /></RequireAuth>} />
      {/* Duplicate /traveler route removed - consolidated to line 331 */}
      <Route path="/partner" element={<Navigate to="/marketplace" replace />} />
      <Route path="/partner/escrow" element={<Navigate to="/marketplace" replace />} />
      <Route path="/agent/:agentId" element={<Navigate to="/agents/:agentId" replace />} />
      <Route path="/agent-dashboard" element={<RequireAgentTerms><AgentDashboard /></RequireAgentTerms>} />
      <Route
        path="/agent/earnings"
        element={(
          <RequireAuth>
            <AgentEarningsPage />
          </RequireAuth>
        )}
      />
      <Route path="/agent-dashboard/storyboards/new" element={<Navigate to="/marketplace" replace />} />
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
      <Route path="/email-preview" element={<AdminGuard><EmailPreview /></AdminGuard>} />
      <Route path="/billing-dashboard" element={<RequireAuth><BillingDashboard /></RequireAuth>} />
      <Route path="/travel-settings" element={<RequireAuth><CreatorSettingsPage /></RequireAuth>} />
      <Route path="/travel-settings/general" element={<RequireAuth><TravelSettings /></RequireAuth>} />
      <Route
        path="/tiktok-callback"
        element={(
          <RouteSectionBoundary section="tiktok-callback">
            <TikTokCallback />
          </RouteSectionBoundary>
        )}
      />
      <Route path="/creator-dashboard" element={<RequireAuth><CreatorDashboard /></RequireAuth>} />
      <Route path="/console/brand" element={<RequireAuth><BrandConsolePage /></RequireAuth>} />
      {/* New TikTok Creator Ecosystem Routes */}
      <Route path="/trip/:id" element={<RequireAuth><CreatorTripPage /></RequireAuth>} />
      <Route path="/trip/:tripId/storyboard" element={<Navigate to="/marketplace" replace />} />
      <Route path="/creator/:id" element={<CreatorRedirect />} />
      <Route path="/my-jobs" element={<RequireAuth><MyJobs /></RequireAuth>} />
      {/* Duplicate /my-trips route removed - using MyTripsPage at line 351 */}
      <Route path="/group-trips" element={<RequireAuth><GroupTrips /></RequireAuth>} />
      <Route path="/group-trips/:tripId" element={<RequireAuth><GroupTrips /></RequireAuth>} />
      <Route path="/journal" element={<JournalListing />} />
      <Route path="/journal/:slug" element={<JournalArticle />} />
      <Route path="/escrow-timeline" element={<RequireAuth><EscrowTimelineDashboard /></RequireAuth>} />
      <Route path="/activity-logs" element={<AdminGuard><ActivityLogs /></AdminGuard>} />
      <Route path="/customer-verification" element={<RequireAuth><CustomerVerification /></RequireAuth>} />
      <Route path="/emergency-contacts" element={<RequireAuth><EmergencyContacts /></RequireAuth>} />
      <Route path="/earnings" element={<RequireAuth><EarningsDashboard /></RequireAuth>} />
      <Route path="/booking-confirmation" element={<RequireAuth><BookingConfirmation /></RequireAuth>} />
    </Route>

    <Route
      element={(
        <AdminGuard>
          <AdminLayout />
        </AdminGuard>
      )}
    >
      <Route path="/admin" element={<AdminGuard><AdminHomePage /></AdminGuard>} />
      <Route path="/admin/applications" element={<AdminGuard><ApplicationReviewDashboard /></AdminGuard>} />
      <Route path="/admin/agent-approvals" element={<AdminGuard><AdminAgentApprovals /></AdminGuard>} />
      <Route path="/admin/safety" element={<AdminGuard><AdminSafetyDashboardPage /></AdminGuard>} />
      <Route path="/admin/agents" element={<AdminGuard><AdminAgentsPage /></AdminGuard>} />
      <Route path="/admin/creators" element={<AdminGuard><AdminCreatorsPage /></AdminGuard>} />
      <Route path="/admin/users" element={<AdminGuard><AdminUsersPage /></AdminGuard>} />
      <Route path="/admin/bookings" element={<AdminGuard><AdminBookingsPage /></AdminGuard>} />
      <Route path="/admin/disputes" element={<AdminGuard><AdminDisputesPage /></AdminGuard>} />
      <Route path="/admin/trips" element={<AdminGuard><AdminTripsPage /></AdminGuard>} />
      <Route path="/admin/waitlist" element={<AdminGuard><AdminWaitlistPage /></AdminGuard>} />
      <Route path="/admin/email-dlq" element={<AdminGuard><AdminEmailDLQPage /></AdminGuard>} />
      <Route path="/admin/newsroom" element={<AdminGuard><AdminNewsroomList /></AdminGuard>} />
      <Route path="/admin/newsroom/new" element={<AdminGuard><AdminArticleEditor /></AdminGuard>} />
      <Route path="/admin/newsroom/authors" element={<AdminGuard><AdminNewsroomAuthors /></AdminGuard>} />
      <Route path="/admin/newsroom/:id/edit" element={<AdminGuard><AdminArticleEditor /></AdminGuard>} />
      <Route path="/admin/marketplace" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/escrow" element={<AdminGuard><OpsEscrowDashboardPage /></AdminGuard>} />
      <Route path="/admin/cancellations" element={<AdminGuard><AdminCancellations /></AdminGuard>} />
      <Route path="/admin/analytics/cancellations" element={<AdminGuard><AdminCancellationAnalytics /></AdminGuard>} />
      <Route path="/admin/customer-verifications" element={<AdminGuard><AdminCustomerVerifications /></AdminGuard>} />
      <Route path="/admin/inquiries" element={<AdminGuard><AdminInquiries /></AdminGuard>} />
      <Route path="/admin/platform-analytics" element={<AdminGuard><PlatformAnalyticsDashboard /></AdminGuard>} />
      <Route path="/admin/trust-safety" element={<AdminGuard><AdminTrustSafety /></AdminGuard>} />
      <Route path="/system-health" element={<AdminGuard><SystemHealth /></AdminGuard>} />
    </Route>

    <Route path="/r" element={<Redirect />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);
