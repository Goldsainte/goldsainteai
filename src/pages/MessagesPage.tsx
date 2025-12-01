import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DirectMessageInbox } from "@/components/messaging/DirectMessageInbox";
import { BackButton } from "@/components/ui/BackButton";
import { Sparkles } from "lucide-react";

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
      <div className="min-h-screen bg-[#FDF9F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C7A962]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <BackButton />
          <div className="flex items-center gap-3 mt-4">
            <Sparkles className="h-6 w-6 text-[#C7A962]" />
            <h1 className="font-secondary text-3xl font-semibold text-[#0a2225]">
              Messages
            </h1>
          </div>
          <p className="text-[#5a6c6e] mt-2 text-sm">
            Your conversations with creators and travel agents
          </p>
        </div>

        <DirectMessageInbox />
      </div>
    </div>
  );
}
