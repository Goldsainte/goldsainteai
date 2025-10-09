import { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";

export const OnboardingTour = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem("hasSeenOnboardingTour");
    if (!hasSeenTour) {
      // Delay tour start to let page load
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const steps: Step[] = [
    {
      target: "body",
      content: "Welcome to Goldsainte.Ai — where luxury travel meets intelligent design. Allow us to guide you through an experience crafted for the discerning traveler.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-tour="ai-search"]',
      content: "Your personal AI concierge awaits. Simply express your desires — 'A secluded villa in Santorini' or 'Michelin-starred dining in Tokyo' — and watch as we curate the perfect match.",
      placement: "bottom",
    },
    {
      target: '[data-tour="ai-widget"]',
      content: "Access your dedicated travel curator at any moment. Whether refining your itinerary or seeking insider recommendations, consider this your gateway to bespoke journeys.",
      placement: "left",
    },
    {
      target: '[data-tour="traditional-search"]',
      content: "For the meticulous planner, our refined search interface offers precision control. Filter by your exact specifications and discover options tailored to your standards.",
      placement: "bottom",
    },
    {
      target: '[data-tour="places"]',
      content: "Immerse yourself in Goldsainte Places — a curated gallery of world-class destinations, exclusive experiences, and visual narratives from global tastemakers.",
      placement: "bottom",
    },
    {
      target: '[data-tour="marketplace"]',
      content: "Elevate your planning with our verified network of elite travel specialists. Share your vision and receive bespoke proposals from the industry's finest.",
      placement: "bottom",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("hasSeenOnboardingTour", "true");
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "transparent",
          overlayColor: "rgba(0, 0, 0, 0.75)",
          spotlightShadow: "0 0 80px rgba(0, 0, 0, 0.6), 0 0 120px hsl(var(--primary) / 0.12)",
          zIndex: 10000,
          arrowColor: "rgba(255, 255, 255, 0.95)",
        },
        tooltip: {
          borderRadius: window.innerWidth < 768 ? "16px" : "20px",
          padding: window.innerWidth < 768 ? "32px 24px" : "40px 48px",
          fontSize: window.innerWidth < 768 ? "15px" : "16px",
          maxWidth: window.innerWidth < 768 ? "340px" : "480px",
          backgroundColor: "rgba(255, 255, 255, 0.97)",
          backdropFilter: "blur(32px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: "0 32px 64px -16px rgba(0, 0, 0, 0.18), 0 0 1px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
          fontFamily: "'Cormorant Garamond', serif",
        },
        tooltipContainer: {
          textAlign: "left" as const,
        },
        tooltipContent: {
          fontSize: window.innerWidth < 768 ? "15px" : "16px",
          lineHeight: "1.75",
          padding: "0 0 24px 0",
          color: "hsl(var(--foreground))",
          fontWeight: "400",
          fontFamily: "'Cormorant Garamond', serif",
          letterSpacing: "0.015em",
        },
        tooltipTitle: {
          fontSize: window.innerWidth < 768 ? "18px" : "20px",
          fontWeight: "500",
          marginBottom: "12px",
          fontFamily: "'Cormorant Garamond', serif",
          letterSpacing: "0.02em",
        },
        tooltipFooter: {
          marginTop: window.innerWidth < 768 ? "24px" : "32px",
          display: "flex",
          gap: "12px",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          borderRadius: "8px",
          padding: window.innerWidth < 768 ? "10px 24px" : "12px 32px",
          fontSize: window.innerWidth < 768 ? "13px" : "14px",
          fontWeight: "500",
          border: "none",
          boxShadow: "0 4px 16px hsl(var(--primary) / 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          fontFamily: "'Work Sans', sans-serif",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          padding: window.innerWidth < 768 ? "10px 24px" : "12px 32px",
          fontSize: window.innerWidth < 768 ? "13px" : "14px",
          fontWeight: "400",
          borderRadius: "8px",
          border: "1px solid hsl(var(--border) / 0.4)",
          backgroundColor: "transparent",
          transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          fontFamily: "'Work Sans', sans-serif",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground) / 0.6)",
          padding: "0",
          fontSize: window.innerWidth < 768 ? "12px" : "13px",
          fontWeight: "400",
          transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          letterSpacing: "0.05em",
          fontFamily: "'Work Sans', sans-serif",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
          background: "none",
          border: "none",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip tour",
      }}
    />
  );
};
