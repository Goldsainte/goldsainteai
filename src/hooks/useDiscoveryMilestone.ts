import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const MILESTONE_THRESHOLD = 3;

export function useDiscoveryMilestone() {
  const [saveCount, setSaveCount] = useState(0);
  const [milestoneShown, setMilestoneShown] = useState(false);
  const navigate = useNavigate();

  const recordSave = useCallback(() => {
    setSaveCount((prev) => {
      const next = prev + 1;
      if (next >= MILESTONE_THRESHOLD && !milestoneShown) {
        setMilestoneShown(true);
        setTimeout(() => {
          toast("You're building your trip 🎉", {
            description: "Keep going or start planning now",
            action: {
              label: "Start Your Trip",
              onClick: () => navigate("/post-trip"),
            },
            duration: 8000,
          });
        }, 500);
      }
      return next;
    });
  }, [milestoneShown, navigate]);

  return { saveCount, recordSave };
}
