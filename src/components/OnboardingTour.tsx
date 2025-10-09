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
      content: "Welcome to Goldsainte.AI — your intelligent travel companion. Let's take a brief tour of the features that make planning your journey seamless and effortless.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-tour="ai-search"]',
      content: "Meet your AI Travel Agent! Just type naturally - 'Find me a beach resort in Bali' or 'Romantic dinner in Paris'. Our AI understands and delivers instant results.",
      placement: "bottom",
    },
    {
      target: '[data-tour="ai-widget"]',
      content: "Your personal AI Booking Concierge! Chat anytime for travel advice, bookings, itinerary changes, or recommendations. It's like having a travel expert in your pocket.",
      placement: "left",
    },
    {
      target: '[data-tour="traditional-search"]',
      content: "Prefer the classic way? Use our traditional search to filter by dates, prices, and preferences. Perfect for when you know exactly what you want.",
      placement: "bottom",
    },
    {
      target: '[data-tour="places"]',
      content: "Explore Goldsainte Places! Discover travel content, videos, and inspiration from creators worldwide. Get ideas for your next adventure.",
      placement: "bottom",
    },
    {
      target: '[data-tour="marketplace"]',
      content: "Need expert help? Post your trip request and let verified travel agents compete for your business with custom proposals and pricing.",
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
          overlayColor: "rgba(0, 0, 0, 0.7)",
          spotlightShadow: "0 0 60px rgba(0, 0, 0, 0.5), 0 0 100px hsl(var(--primary) / 0.15)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: window.innerWidth < 768 ? "20px" : "24px",
          padding: window.innerWidth < 768 ? "20px" : "28px 32px",
          fontSize: window.innerWidth < 768 ? "14px" : "15px",
          maxWidth: window.innerWidth < 768 ? "320px" : "440px",
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 1)",
        },
        tooltipContainer: {
          textAlign: "left" as const,
        },
        tooltipContent: {
          fontSize: window.innerWidth < 768 ? "14px" : "15px",
          lineHeight: "1.65",
          padding: "0 0 16px 0",
          color: "hsl(var(--foreground))",
          fontWeight: "400",
        },
        tooltipFooter: {
          marginTop: window.innerWidth < 768 ? "16px" : "20px",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          borderRadius: window.innerWidth < 768 ? "10px" : "12px",
          padding: window.innerWidth < 768 ? "8px 20px" : "10px 24px",
          fontSize: window.innerWidth < 768 ? "13px" : "14px",
          fontWeight: "600",
          border: "none",
          boxShadow: "0 2px 8px hsl(var(--primary) / 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          letterSpacing: "0.01em",
        },
        buttonBack: {
          color: "hsl(var(--foreground))",
          padding: window.innerWidth < 768 ? "8px 16px" : "10px 20px",
          fontSize: window.innerWidth < 768 ? "13px" : "14px",
          fontWeight: "500",
          borderRadius: window.innerWidth < 768 ? "10px" : "12px",
          border: "1px solid hsl(var(--border))",
          backgroundColor: "hsl(var(--background))",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          letterSpacing: "0.01em",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
          padding: window.innerWidth < 768 ? "8px 16px" : "10px 20px",
          fontSize: window.innerWidth < 768 ? "12px" : "13px",
          fontWeight: "500",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          letterSpacing: "0.01em",
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
