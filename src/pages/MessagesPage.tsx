import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DirectMessageInbox } from "@/components/messaging/DirectMessageInbox";
import { BackButton } from "@/components/ui/BackButton";

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady && !user) {
      navigate("/auth?redirect=/messages");
    }
  }, [user, isReady, navigate]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <BackButton />
          <h1 className="font-secondary text-3xl font-semibold text-foreground mt-4">
            Messages
          </h1>
          <p className="text-muted-foreground mt-1">
            Your conversations with creators and travel agents
          </p>
        </div>

        <DirectMessageInbox />
      </div>
    </div>
  );
}
