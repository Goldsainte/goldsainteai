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
      content: "Welcome to Goldsainte.Ai! Let's take a quick tour of the key features that make travel planning effortless.",
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
          backgroundColor: "hsl(var(--background))",
          overlayColor: "rgba(0, 0, 0, 0.6)",
          spotlightShadow: "0 0 40px rgba(0, 0, 0, 0.4), 0 0 80px hsl(var(--primary) / 0.2)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: window.innerWidth < 768 ? "16px" : "20px",
          padding: window.innerWidth < 768 ? "16px" : "24px",
          fontSize: window.innerWidth < 768 ? "13px" : "15px",
          maxWidth: window.innerWidth < 768 ? "300px" : "420px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid hsl(var(--primary) / 0.2)",
          boxShadow: "0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 0 1px hsl(var(--primary) / 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
        },
        tooltipContent: {
          fontSize: window.innerWidth < 768 ? "13px" : "15px",
          lineHeight: "1.6",
          padding: "0",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          borderRadius: window.innerWidth < 768 ? "8px" : "10px",
          padding: window.innerWidth < 768 ? "8px 16px" : "10px 20px",
          fontSize: window.innerWidth < 768 ? "13px" : "14px",
          fontWeight: "600",
          border: "1px solid hsl(var(--primary))",
          boxShadow: "0 4px 12px hsl(var(--primary) / 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          transition: "all 0.2s ease",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          padding: window.innerWidth < 768 ? "8px 16px" : "10px 20px",
          fontSize: window.innerWidth < 768 ? "13px" : "14px",
          fontWeight: "500",
          borderRadius: window.innerWidth < 768 ? "8px" : "10px",
          border: "1px solid hsl(var(--border))",
          backgroundColor: "transparent",
          transition: "all 0.2s ease",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
          padding: window.innerWidth < 768 ? "8px 16px" : "10px 20px",
          fontSize: window.innerWidth < 768 ? "13px" : "14px",
          fontWeight: "500",
          transition: "all 0.2s ease",
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
