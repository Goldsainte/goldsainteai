import etsyLogo from "@/assets/etsy-logo.jpg";

export function EtsyLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <img 
      src={etsyLogo} 
      alt="Etsy" 
      className={className}
    />
  );
}
