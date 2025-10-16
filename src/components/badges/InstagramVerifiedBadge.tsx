import { CheckCircle2 } from "lucide-react";

export const InstagramVerifiedBadge = () => {
  return (
    <CheckCircle2 
      className="h-4 w-4 inline-block" 
      style={{ color: '#0095F6', fill: '#0095F6' }}
      aria-label="Verified"
    />
  );
};
