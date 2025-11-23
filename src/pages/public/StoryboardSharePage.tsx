// Redirect to new storyboard system
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function StoryboardSharePage() {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (slugOrId) {
      navigate(`/storyboards/${slugOrId}`, { replace: true });
    } else {
      navigate("/storyboards", { replace: true });
    }
  }, [slugOrId, navigate]);

  return null;
}
