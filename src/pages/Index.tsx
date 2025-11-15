import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { HomeHero } from "@/components/home/HomeHero";
import { WelcomeModal } from "@/components/WelcomeModal";
import VendorPromotionFeed from "@/components/VendorPromotionFeed";

const Index = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  return (
    <main className="min-h-screen w-full max-w-full bg-gradient-to-b from-background via-background to-muted/20">
      <HomeHero />
      
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <h2 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
          Featured partners & experiences
        </h2>
        <p className="mt-1 text-[11px] text-muted-foreground md:text-xs">
          Handpicked vendors, experiences, and launch partners powering the Goldsainte marketplace.
        </p>
        <div className="mt-4">
          <VendorPromotionFeed displayContext="homepage" limit={6} />
        </div>
      </section>

      <WelcomeModal 
        open={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)}
      />
    </main>
  );
};

export default Index;
