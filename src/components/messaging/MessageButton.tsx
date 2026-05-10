import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NewMessageModal } from "./NewMessageModal";

interface MessageButtonProps {
  recipientId: string;
  recipientName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

export function MessageButton({
  recipientId,
  recipientName,
  variant = "outline",
  size = "default",
  className,
  label = "Message",
}: MessageButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (!user) {
      navigate("/auth?redirect=/messages");
      return;
    }
    setShowModal(true);
  };

  // Don't show message button to self
  if (user?.id === recipientId) return null;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {label}
      </Button>

      <NewMessageModal
        open={showModal}
        onOpenChange={setShowModal}
        recipientId={recipientId}
        recipientName={recipientName}
      />
    </>
  );
}
