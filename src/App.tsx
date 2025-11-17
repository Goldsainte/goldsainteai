import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SkipNavigation } from "@/components/SkipNavigation";
import { OnboardingTour } from "@/components/OnboardingTour";
import { WelcomeModal } from "@/components/WelcomeModal";
import { OnboardingWelcomeModal } from "@/components/OnboardingWelcomeModal";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SentryTestButton } from "@/components/SentryTestButton";
import { SentryStatusChip } from "@/components/system/SentryStatusChip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ExpediaModalProvider } from "@/contexts/ExpediaModalContext";
import { VoiceConciergeWidget } from "@/components/concierge/VoiceConciergeWidget";
import { usePresence } from "@/hooks/usePresence";
import { ensureCSRFToken } from "@/lib/security/csrf";
import { AppRoutes } from "@/routes/AppRoutes";

const AIBookingConcierge = lazy(() =>
  import("@/components/AIBookingConcierge").then((m) => ({ default: m.AIBookingConcierge })),
);

const queryClient = new QueryClient();

const HIDE_HEADER_PAGES = new Set([
  "/auth",
  "/login",
  "/signup",
  // Legacy social feed - disabled
  // "/travel-feed",
  // "/journeys",
  "/creator/:id",
  "/travel-settings",
  "/cocurated-journeys",
  "/fine-dining",
  "/hotel-booking",
]);

const HIDE_AI_BOOKING_PAGES = new Set([
  // Legacy social feed - disabled
  // "/travel-feed",
  // "/journeys",
  // "/search",
  // "/trending",
  "/creator/:id",
  "/travel-settings",
]);

const HIDE_FOOTER_PREFIXES = [
  "/auth",
  "/login",
  "/signup",
  "/reset-password",
  "/onboarding",
  "/ai-agent-setup",
  // Legacy social feed - disabled
  // "/travel-feed",
  // "/journeys",
  // "/search",
  // "/trending",
  "/creator/:id",
  "/travel-settings",
  "/crossposting-settings",
  "/creator-dashboard",
  "/your-activity",
  "/browse-influencers",
  "/browse-creators",
  "/activity-logs",
  "/customer-verification",
  "/emergency-contacts",
  "/agent-performance",
  "/agent-deals",
  "/commission-dashboard",
  "/email-preview",
  "/test-group-payment",
  // Legacy Instagram demo - disabled
  // "/instagram-api",
  // "/instagram-callback",
  "/admin/upload-email-assets",
  "/admin/upload-apple-music-key",
  "/admin/upload-apple-signin-key",
  "/not-found",
];

function shouldHideForPath(pathname: string, patterns: Iterable<string>) {
  for (const pattern of patterns) {
    if (pathname === pattern || pathname.startsWith(pattern)) {
      return true;
    }
  }
  return false;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  usePresence();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    void ensureCSRFToken();
  }, []);

  useEffect(() => {
    const handler = () => navigate("/");
    window.addEventListener("welcomeDismissed", handler);
    return () => window.removeEventListener("welcomeDismissed", handler);
  }, [navigate]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("goldsainte-welcome-seen");
    if (!hasSeenWelcome && location.pathname === "/") {
      setShowWelcomeModal(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const badge = document.querySelector(
      ".lovable-badge, [data-lovable-badge], iframe[src*=\"lovable\"]",
    );
    if (badge instanceof HTMLElement) {
      // Legacy paths disabled - always show badge now
      badge.style.display = "block";
    }
  }, [location.pathname]);

  const hideHeader = shouldHideForPath(location.pathname, HIDE_HEADER_PAGES);
  const hideFooter = shouldHideForPath(location.pathname, HIDE_FOOTER_PREFIXES);
  const hideAIBooking = shouldHideForPath(location.pathname, HIDE_AI_BOOKING_PAGES);

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col overflow-x-hidden box-border viewport-guard">
      <SkipNavigation />
      <OnboardingWelcomeModal />
      <WelcomeModal open={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} isFirstVisit />
      <OnboardingTour />
      {hideHeader ? null : <Header />}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <AppRoutes />
        <SentryStatusChip />
        <SentryTestButton />
      </main>
      {hideFooter ? null : <Footer />}
      {hideAIBooking ? null : (
        <Suspense fallback={null}>
          <AIBookingConcierge />
        </Suspense>
      )}
      <VoiceConciergeWidget />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
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
    </HelmetProvider>
  );
}
