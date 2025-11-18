import { Facebook, Instagram, Twitter, Linkedin, Youtube, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import verticalLogo from "@/assets/primary-vertical-logo-gold.png";
import { Button } from "./ui/button";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { useTranslation } from "react-i18next";

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
];

export const Footer = () => {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const { t } = useTranslation();

  return (
    <footer className="bg-background border-t border-border mt-16">
      {/* Navigation Links Section */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* MOBILE: Accordion Layout */}
        <Accordion type="multiple" className="md:hidden mb-8">
          {/* Support */}
          <AccordionItem value="support">
            <AccordionTrigger className="text-sm font-semibold">{t('footer.support')}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/help" className="hover:text-primary transition-colors">{t('footer.helpCenter')}</Link></li>
                <li><Link to="/my-trip-requests" className="hover:text-primary transition-colors">{t('footer.manageTrips')}</Link></li>
                <li><Link to="/messages" className="hover:text-primary transition-colors">{t('footer.contactCustomerService')}</Link></li>
                <li><Link to="/trust-safety" className="hover:text-primary transition-colors">{t('footer.safetyResourceCenter')}</Link></li>
                <li><Link to="/cancellation-refund-policy" className="hover:text-primary transition-colors">{t('footer.cancellationRefunds')}</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Discover */}
          <AccordionItem value="discover">
            <AccordionTrigger className="text-sm font-semibold">{t('footer.discover')}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/browse-creators" className="hover:text-primary transition-colors">Creator Marketplace</Link></li>
                <li><Link to="/tiktok-lab" className="hover:text-primary transition-colors">Goldsainte Creator Lab</Link></li>
                <li><Link to="/tiktok-lab/storyboards" className="hover:text-primary transition-colors">{t('footer.storyboards')}</Link></li>
                <li><Link to="/browse-agents" className="hover:text-primary transition-colors">{t('footer.travelAgentServices')}</Link></li>
                <li><Link to="/cocurated-marketplace" className="hover:text-primary transition-colors">{t('footer.cocuratedPackages')}</Link></li>
                <li><Link to="/marketplace" className="hover:text-primary transition-colors">{t('footer.marketplace')}</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Terms and settings */}
          <AccordionItem value="terms">
            <AccordionTrigger className="text-sm font-semibold">{t('footer.termsSettings')}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/about#legal" className="hover:text-primary transition-colors">{t('footer.companyInfo')}</Link></li>
                <li><Link to="/privacy-cookies" className="hover:text-primary transition-colors">{t('footer.privacyCookies')}</Link></li>
                <li><Link to="/about#terms" className="hover:text-primary transition-colors">{t('footer.termsOfService')}</Link></li>
                <li><Link to="/about#accessibility" className="hover:text-primary transition-colors">{t('footer.accessibilityStatement')}</Link></li>
                <li><Link to="/community-guidelines" className="hover:text-primary transition-colors">{t('footer.communityGuidelines')}</Link></li>
                <li><Link to="/about#dispute-resolution" className="hover:text-primary transition-colors">{t('footer.disputeResolution')}</Link></li>
                <li><Link to="/about#modern-slavery" className="hover:text-primary transition-colors">{t('footer.modernSlaveryStatement')}</Link></li>
                <li><Link to="/about#human-rights" className="hover:text-primary transition-colors">{t('footer.humanRightsStatement')}</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Partners */}
          <AccordionItem value="partners">
            <AccordionTrigger className="text-sm font-semibold">{t('footer.partners')}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/agent-onboarding" className="hover:text-primary transition-colors">{t('footer.becomeAgent')}</Link></li>
                <li><Link to="/browse-creators" className="hover:text-primary transition-colors">{t('footer.influencerProgram')}</Link></li>
                <li><Link to="/shop" className="hover:text-primary transition-colors">{t('footer.affiliateProgram')}</Link></li>
                <li><Link to="/transportation-vendor-partners" className="hover:text-primary transition-colors">{t('footer.listYourCompany')}</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* About */}
          <AccordionItem value="about" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold">{t('footer.about')}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.aboutGoldsainte')}</Link></li>
                <li><Link to="/what-we-do" className="hover:text-primary transition-colors">{t('footer.whatWeDo')}</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('footer.howWeWork')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('footer.pressCenter')}</a></li>
                <li><a href="/about#investor-relations" className="hover:text-primary transition-colors">{t('footer.investorRelations')}</a></li>
                <li><Link to="/corporate-contact" className="hover:text-primary transition-colors">{t('footer.corporateContact')}</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* DESKTOP: Grid Layout */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Support Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">{t('footer.support')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/help" className="hover:text-primary transition-colors">{t('footer.helpCenter')}</Link></li>
              <li><Link to="/my-trip-requests" className="hover:text-primary transition-colors">{t('footer.manageTrips')}</Link></li>
              <li><Link to="/messages" className="hover:text-primary transition-colors">{t('footer.contactCustomerService')}</Link></li>
              <li><Link to="/trust-safety" className="hover:text-primary transition-colors">{t('footer.safetyResourceCenter')}</Link></li>
              <li><Link to="/cancellation-refund-policy" className="hover:text-primary transition-colors">{t('footer.cancellationRefunds')}</Link></li>
            </ul>
          </div>

          {/* Discover Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">{t('footer.discover')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/browse-creators" className="hover:text-primary transition-colors">Creator Marketplace</Link></li>
              <li><Link to="/tiktok-lab" className="hover:text-primary transition-colors">Goldsainte Creator Lab</Link></li>
              <li><Link to="/tiktok-lab/storyboards" className="hover:text-primary transition-colors">{t('footer.storyboards')}</Link></li>
              <li><Link to="/browse-agents" className="hover:text-primary transition-colors">{t('footer.travelAgentServices')}</Link></li>
              <li><Link to="/cocurated-marketplace" className="hover:text-primary transition-colors">{t('footer.cocuratedPackages')}</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">{t('footer.marketplace')}</Link></li>
            </ul>
          </div>

          {/* Terms & Settings Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">{t('footer.termsSettings')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/about#legal" className="hover:text-primary transition-colors">{t('footer.companyInfo')}</Link></li>
              <li><Link to="/privacy-cookies" className="hover:text-primary transition-colors">{t('footer.privacyCookies')}</Link></li>
              <li><Link to="/about#terms" className="hover:text-primary transition-colors">{t('footer.termsOfService')}</Link></li>
              <li><Link to="/about#accessibility" className="hover:text-primary transition-colors">{t('footer.accessibilityStatement')}</Link></li>
              <li><Link to="/community-guidelines" className="hover:text-primary transition-colors">{t('footer.communityGuidelines')}</Link></li>
              <li><Link to="/about#dispute-resolution" className="hover:text-primary transition-colors">{t('footer.disputeResolution')}</Link></li>
              <li><Link to="/about#modern-slavery" className="hover:text-primary transition-colors">{t('footer.modernSlaveryStatement')}</Link></li>
              <li><Link to="/about#human-rights" className="hover:text-primary transition-colors">{t('footer.humanRightsStatement')}</Link></li>
            </ul>
          </div>

          {/* Partners Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">{t('footer.partners')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/agent-onboarding" className="hover:text-primary transition-colors">{t('footer.becomeAgent')}</Link></li>
              <li><Link to="/browse-creators" className="hover:text-primary transition-colors">{t('footer.influencerProgram')}</Link></li>
              <li><Link to="/shop" className="hover:text-primary transition-colors">{t('footer.affiliateProgram')}</Link></li>
              <li><Link to="/transportation-vendor-partners" className="hover:text-primary transition-colors">{t('footer.listYourCompany')}</Link></li>
            </ul>
          </div>

          {/* About Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">{t('footer.about')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.aboutGoldsainte')}</Link></li>
              <li><Link to="/what-we-do" className="hover:text-primary transition-colors">{t('footer.whatWeDo')}</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.howWeWork')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.pressCenter')}</a></li>
              <li><a href="/about#investor-relations" className="hover:text-primary transition-colors">{t('footer.investorRelations')}</a></li>
              <li><Link to="/corporate-contact" className="hover:text-primary transition-colors">{t('footer.corporateContact')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Currency Selector & Social Media */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-border">
          {/* Currency Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select 
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <span className="text-xs sm:text-sm font-medium w-full sm:w-auto text-center sm:text-left">{t('footer.followUs')}</span>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="https://www.instagram.com/goldsainte/?hl=en" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="YouTube">
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Logo & Copyright */}
        <div className="pt-6 sm:pt-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <img src={verticalLogo} alt="Goldsainte" className="h-16 sm:h-20 w-auto" />
            <div className="text-center max-w-3xl px-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {t('footer.description')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('footer.copyright')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
