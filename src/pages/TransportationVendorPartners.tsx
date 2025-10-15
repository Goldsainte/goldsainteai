import { PartnersHero } from "@/components/partners/PartnersHero";
import { ValueProposition } from "@/components/partners/ValueProposition";
import { HowItWorks } from "@/components/partners/HowItWorks";
import { ServicesGrid } from "@/components/partners/ServicesGrid";
import { BenefitsSection } from "@/components/partners/BenefitsSection";
import { RequirementsChecklist } from "@/components/partners/RequirementsChecklist";
import { PricingTiers } from "@/components/partners/PricingTiers";
import { PartnersFAQ } from "@/components/partners/PartnersFAQ";
import { FinalCTA } from "@/components/partners/FinalCTA";

export default function TransportationVendorPartners() {
  return (
    <div className="min-h-screen bg-background">
        <PartnersHero />
        <ValueProposition />
        <HowItWorks />
        <ServicesGrid />
        <BenefitsSection />
        <RequirementsChecklist />
        <PricingTiers />
        <PartnersFAQ />
        <FinalCTA />
      </div>
  );
}
