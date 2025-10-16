import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShopifyLogo } from "@/components/icons/ShopifyLogo";
import { EtsyLogo } from "@/components/icons/EtsyLogo";
import { Store } from "lucide-react";

interface StoreConnectionBannerProps {
  onConnect: () => void;
}

export function StoreConnectionBanner({ onConnect }: StoreConnectionBannerProps) {
  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
      <CardContent className="py-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="p-4 bg-background rounded-lg">
              <ShopifyLogo className="h-12 w-12 text-[#95BF47]" />
            </div>
            <div className="hidden md:block text-4xl text-muted-foreground">+</div>
            <div className="p-4 bg-background rounded-lg">
              <EtsyLogo className="h-12 w-12 text-[#F16521]" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              Sell Your Products Automatically
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              Already selling on Shopify or Etsy? Sync your products instantly and reach travel enthusiasts worldwide
            </p>
            <Button onClick={onConnect} size="lg" className="gap-2">
              <Store className="h-5 w-5" />
              Connect Your Store
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
