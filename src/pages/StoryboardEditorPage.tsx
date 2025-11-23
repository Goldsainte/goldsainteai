// This page has been replaced by the new storyboard system
// Please use /storyboards for the new storyboard functionality
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";

export default function StoryboardEditorPage() {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();

  useEffect(() => {
    // Redirect to new storyboards page
    navigate("/storyboards", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-muted-foreground">
          Redirecting to new storyboard system...
        </p>
      </main>
    </div>
  );
}
