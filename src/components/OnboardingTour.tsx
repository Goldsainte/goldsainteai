import { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";

export const OnboardingTour = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenOnboardingTour") === "true";
    const welcomeDismissed = localStorage.getItem("welcomeDismissed") === "true";

    const startTour = () => {
      if (!hasSeenTour) {
        setTimeout(() => setRun(true), 800);
      }
    };

    if (!hasSeenTour && welcomeDismissed) {
      startTour();
    }

    const handleWelcomeDismissed = () => startTour();
    window.addEventListener("welcomeDismissed", handleWelcomeDismissed);

    return () => window.removeEventListener("welcomeDismissed", handleWelcomeDismissed);
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
      disableBeacon: true,
    },
    {
      target: '[data-tour="ai-widget"]',
      content: "Your personal AI Booking Concierge! Chat anytime for travel advice, bookings, itinerary changes, or recommendations. It's like having a travel expert in your pocket.",
      placement: window.innerWidth < 768 ? "top" : "left",
      disableBeacon: true,
    },
    {
      target: '[data-tour="traditional-search"]',
      content: "Prefer the classic way? Use our traditional search to filter by dates, prices, and preferences. Perfect for when you know exactly what you want.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: '[data-tour="places"]',
      content: "Explore Goldsainte Places! Discover travel content, videos, and inspiration from creators worldwide. Get ideas for your next adventure.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: '[data-tour="marketplace"]',
      content: "Need expert help? Post your trip request and let verified travel agents compete for your business with custom proposals and pricing.",
      placement: "bottom",
      disableBeacon: true,
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

  useEffect(() => {
    if (run) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.classList.add('react-joyride-active');
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.classList.remove('react-joyride-active');
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.classList.remove('react-joyride-active');
    };
  }, [run]);

  return (
    <>
      <style>{`
        .react-joyride__tooltip {
          position: relative;
        }
        .react-joyride__tooltip__footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .__floater__body > div > div:last-child > div:first-child {
          font-size: 12px;
          color: hsl(var(--muted-foreground));
          font-weight: 500;
          margin: 0;
          padding: 0;
          text-align: center;
        }
        .__floater { 
          filter: none !important; 
        }
        .__floater__body { 
          /* Allow Joyride to control transforms/positioning for accurate centering */
        }
        @media (max-width: 768px) {
          .__floater__body {
            /* Constrain width only; don't force left/right so centering works */
            max-width: calc(100vw - 32px) !important;
          }
        }
        body.react-joyride-active {
          overflow: hidden !important;
        }
      `}</style>
      <Joyride
        steps={steps}
        run={run}
        continuous
        showProgress
        showSkipButton={false}
        disableScrolling={true}
        disableScrollParentFix={true}
        spotlightClicks={false}
        scrollToFirstStep={false}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "hsl(var(--primary))",
            textColor: "hsl(var(--foreground))",
            backgroundColor: "transparent",
            overlayColor: "rgba(0, 0, 0, 0.75)",
            spotlightShadow: "0 0 80px rgba(0, 0, 0, 0.6), 0 0 120px hsl(var(--primary) / 0.2)",
            zIndex: 10000,
            arrowColor: "rgba(255, 255, 255, 0.98)",
          },
          tooltip: {
            borderRadius: window.innerWidth < 768 ? "12px" : "16px",
            padding: window.innerWidth < 768 ? "14px" : "18px 22px",
            fontSize: window.innerWidth < 768 ? "12px" : "13px",
            maxWidth: window.innerWidth < 768 ? "calc(100vw - 32px)" : "320px",
            width: window.innerWidth < 768 ? "calc(100vw - 32px)" : "auto",
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 1)",
            margin: window.innerWidth < 768 ? "0 16px" : "0",
          },
          tooltipContainer: {
            textAlign: "left" as const,
          },
          tooltipContent: {
            fontSize: window.innerWidth < 768 ? "12px" : "13px",
            lineHeight: "1.6",
            padding: "0 0 12px 0",
            color: "hsl(var(--foreground))",
            fontWeight: "400",
          },
          tooltipFooter: {
            marginTop: window.innerWidth < 768 ? "10px" : "12px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          },
          buttonClose: {
            color: "hsl(var(--muted-foreground))",
            width: window.innerWidth < 768 ? "18px" : "20px",
            height: window.innerWidth < 768 ? "18px" : "20px",
            padding: 0,
            lineHeight: 1,
            transform: "scale(0.9)",
            opacity: 0.9,
          },
          buttonNext: {
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
            borderRadius: window.innerWidth < 768 ? "6px" : "8px",
            padding: window.innerWidth < 768 ? "5px 12px" : "6px 14px",
            fontSize: window.innerWidth < 768 ? "11px" : "12px",
            fontWeight: "600",
            fontFamily: "inherit",
            border: "none",
            boxShadow: "0 2px 8px hsl(var(--primary) / 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            letterSpacing: "0.01em",
          },
          buttonBack: {
            display: "none",
          },
        }}
        locale={{
          close: "Close",
          last: "Finish",
          next: "Next",
        }}
        floaterProps={{
          disableAnimation: true,
        }}
      />
    </>
  );
};
