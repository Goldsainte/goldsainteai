// Redirect to new storyboard system
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function TikTokLabStoryboardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      navigate(`/storyboards/${id}`, { replace: true });
    } else {
      navigate("/storyboards", { replace: true });
    }
  }, [id, navigate]);

  return null;
}
