import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS } from "react-joyride";

const TOURED_KEY = "goldsainte_discovery_toured";

const STEPS = [
  {
    target: '[data-tour="category-pills"]',
    content: "Start here: choose a travel vibe",
    disableBeacon: true,
    placement: "bottom" as const,
  },
  {
    target: '[data-tour="discovery-grid"]',
    content: "Click any image to explore more like this",
    placement: "top" as const,
  },
  {
    target: '[data-tour="save-button"]',
    content: "Save images to build your trip",
    placement: "left" as const,
  },
];

interface DiscoveryTooltipTourProps {
  run: boolean;
  onFinish: () => void;
}

export function DiscoveryTooltipTour({ run, onFinish }: DiscoveryTooltipTourProps) {
  const [shouldRun, setShouldRun] = useState(false);

  useEffect(() => {
    if (run && localStorage.getItem(TOURED_KEY) !== "true") {
      // Delay so DOM targets render
      const t = setTimeout(() => setShouldRun(true), 600);
      return () => clearTimeout(t);
    }
  }, [run]);

  function handleCallback(data: CallBackProps) {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(TOURED_KEY, "true");
      setShouldRun(false);
      onFinish();
    }
  }

  if (!shouldRun) return null;

  return (
    <Joyride
      steps={STEPS}
      run={shouldRun}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: "#C7A962",
          zIndex: 10000,
          arrowColor: "#fff",
          backgroundColor: "#fff",
          textColor: "#0a2225",
        },
        tooltip: {
          borderRadius: 16,
          padding: "16px 20px",
          fontSize: 14,
        },
        buttonNext: {
          borderRadius: 20,
          padding: "6px 16px",
          fontSize: 13,
        },
        buttonSkip: {
          fontSize: 12,
          color: "#6B7280",
        },
      }}
    />
  );
}
