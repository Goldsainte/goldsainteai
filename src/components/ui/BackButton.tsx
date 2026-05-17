import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  label?: string;
  to?: string;
  className?: string;
}

export function BackButton({ label = "Back", to, className = "" }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Always prefer going back to the actual previous page so users return to
    // wherever they came from, not a hardcoded route. The `to` prop is only a
    // fallback for when there is no in-app history (e.g. user landed here
    // directly via a shared link or fresh tab).
    const hasHistory = typeof window !== "undefined" && window.history.length > 1;
    if (hasHistory) {
      navigate(-1);
    } else if (to) {
      navigate(to);
    } else {
      navigate("/");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full px-3 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </Button>
  );
}
