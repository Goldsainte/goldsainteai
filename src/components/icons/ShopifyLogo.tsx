import shopifyLogo from "@/assets/shopify-logo.png";

export function ShopifyLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <img 
      src={shopifyLogo} 
      alt="Shopify" 
      className={className}
    />
  );
}
