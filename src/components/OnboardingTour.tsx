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
      content: "Welcome to Goldsainte.Ai! Let's take a quick tour of all the amazing features available to you.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-tour="search"]',
      content: "Use the search bar to find flights, hotels, destinations, and more. Our AI-powered search makes planning easy.",
      placement: "bottom",
    },
    {
      target: '[data-tour="ai-widget"]',
      content: "Your personal AI booking concierge is here! Chat with our AI assistant to plan trips, get recommendations, and make bookings instantly.",
      placement: "left",
    },
    {
      target: '[data-tour="navigation"]',
      content: "Navigate through different sections: browse travel content, find expert agents, view your bookings, and more.",
      placement: "bottom",
    },
    {
      target: '[data-tour="explore"]',
      content: "Discover curated destinations, luxury experiences, and travel inspiration from our community of creators.",
      placement: "top",
    },
    {
      target: '[data-tour="profile"]',
      content: "Access your profile, bookings, favorites, and settings here. You can also become a travel creator or expert agent!",
      placement: "left",
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
          overlayColor: "rgba(0, 0, 0, 0.5)",
          spotlightShadow: "0 0 15px rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "8px",
          padding: "16px",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          borderRadius: "6px",
          padding: "8px 16px",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
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
