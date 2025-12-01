import { Instagram, Linkedin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import verticalLogo from "@/assets/primary-vertical-logo-gold.png";
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

  const headingClasses = "font-secondary text-xs uppercase tracking-[0.18em] text-[#0a2225] mb-4";
  const linkClasses = "text-[#4A4A4A] hover:text-[#C7B892] transition-colors";

  return (
    <footer className="bg-[#FDF9F0] border-t border-[#E5DFC6]">
      {/* Navigation Links Section */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* MOBILE: Accordion Layout */}
        <Accordion type="multiple" className="md:hidden mb-8">
          {/* Support */}
          <AccordionItem value="support" className="border-[#E5DFC6]">
            <AccordionTrigger className={headingClasses}>{t('footer.support')}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm">
                <li><Link to="/help" className={linkClasses}>{t('footer.helpCenter')}</Link></li>
                <li><Link to="/my-trip-requests" className={linkClasses}>{t('footer.manageTrips')}</Link></li>
                <li><Link to="/messages" className={linkClasses}>{t('footer.contactCustomerService')}</Link></li>
                <li><Link to="/trust-safety" className={linkClasses}>{t('footer.safetyResourceCenter')}</Link></li>
                <li><Link to="/cancellation-refund-policy" className={linkClasses}>{t('footer.cancellationRefunds')}</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Discover */}
          <AccordionItem value="discover" className="border-[#E5DFC6]">
            <AccordionTrigger className={headingClasses}>{t('footer.discover')}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm">
                <li><Link to="/creators" className={linkClasses}>{t('footer.creatorMarketplace')}</Link></li>
                <li><Link to="/tiktok-lab" className={linkClasses}>{t('footer.tiktokTravelLab')}</Link></li>
                <li><Link to="/storyboards" className={linkClasses}>{t('footer.storyboards')}</Link></li>
                <li><Link to="/browse-agents" className={linkClasses}>{t('footer.travelAgentServices')}</Link></li>
                <li><Link to="/marketplace" className={linkClasses}>{t('footer.marketplace')}</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Terms and settings */}
          <AccordionItem value="terms" className="border-[#E5DFC6]">
            <AccordionTrigger className={headingClasses}>{t('footer.termsSettings')}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about#legal" className={linkClasses}>{t('footer.companyInfo')}</Link></li>
                <li><Link to="/privacy-cookies" className={linkClasses}>{t('footer.privacyCookies')}</Link></li>
                <li><Link to="/about#terms" className={linkClasses}>{t('footer.termsOfService')}</Link></li>
                <li><Link to="/about#accessibility" className={linkClasses}>{t('footer.accessibilityStatement')}</Link></li>
                <li><Link to="/community-guidelines" className={linkClasses}>{t('footer.communityGuidelines')}</Link></li>
                <li><Link to="/about#dispute-resolution" className={linkClasses}>{t('footer.disputeResolution')}</Link></li>
                <li><Link to="/about#modern-slavery" className={linkClasses}>{t('footer.modernSlaveryStatement')}</Link></li>
                <li><Link to="/about#human-rights" className={linkClasses}>{t('footer.humanRightsStatement')}</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Partners */}
          <AccordionItem value="partners" className="border-[#E5DFC6]">
            <AccordionTrigger className={headingClasses}>{t('footer.partners')}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm">
                <li><Link to="/agent-onboarding" className={linkClasses}>{t('footer.becomeAgent')}</Link></li>
                <li><Link to="/creators" className={linkClasses}>{t('footer.influencerProgram')}</Link></li>
                <li><Link to="/shop" className={linkClasses}>{t('footer.affiliateProgram')}</Link></li>
                <li><Link to="/transportation-vendor-partners" className={linkClasses}>{t('footer.listYourCompany')}</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* About */}
          <AccordionItem value="about" className="border-b-0">
            <AccordionTrigger className={headingClasses}>{t('footer.about')}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className={linkClasses}>{t('footer.aboutGoldsainte')}</Link></li>
                <li><Link to="/what-we-do" className={linkClasses}>{t('footer.whatWeDo')}</Link></li>
                <li><a href="#" className={linkClasses}>{t('footer.howWeWork')}</a></li>
                <li><a href="#" className={linkClasses}>{t('footer.pressCenter')}</a></li>
                <li><a href="/about#investor-relations" className={linkClasses}>{t('footer.investorRelations')}</a></li>
                <li><Link to="/corporate-contact" className={linkClasses}>{t('footer.corporateContact')}</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* DESKTOP: Grid Layout */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Support Column */}
          <div>
            <h4 className={headingClasses}>{t('footer.support')}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/help" className={linkClasses}>{t('footer.helpCenter')}</Link></li>
              <li><Link to="/my-trip-requests" className={linkClasses}>{t('footer.manageTrips')}</Link></li>
              <li><Link to="/messages" className={linkClasses}>{t('footer.contactCustomerService')}</Link></li>
              <li><Link to="/trust-safety" className={linkClasses}>{t('footer.safetyResourceCenter')}</Link></li>
              <li><Link to="/cancellation-refund-policy" className={linkClasses}>{t('footer.cancellationRefunds')}</Link></li>
            </ul>
          </div>

          {/* Discover Column */}
          <div>
            <h4 className={headingClasses}>{t('footer.discover')}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/creators" className={linkClasses}>{t('footer.creatorMarketplace')}</Link></li>
              <li><Link to="/tiktok-lab" className={linkClasses}>{t('footer.tiktokTravelLab')}</Link></li>
              <li><Link to="/storyboards" className={linkClasses}>{t('footer.storyboards')}</Link></li>
              <li><Link to="/browse-agents" className={linkClasses}>{t('footer.travelAgentServices')}</Link></li>
              <li><Link to="/marketplace" className={linkClasses}>{t('footer.marketplace')}</Link></li>
            </ul>
          </div>

          {/* Terms & Settings Column */}
          <div>
            <h4 className={headingClasses}>{t('footer.termsSettings')}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about#legal" className={linkClasses}>{t('footer.companyInfo')}</Link></li>
              <li><Link to="/privacy-cookies" className={linkClasses}>{t('footer.privacyCookies')}</Link></li>
              <li><Link to="/about#terms" className={linkClasses}>{t('footer.termsOfService')}</Link></li>
              <li><Link to="/about#accessibility" className={linkClasses}>{t('footer.accessibilityStatement')}</Link></li>
              <li><Link to="/community-guidelines" className={linkClasses}>{t('footer.communityGuidelines')}</Link></li>
              <li><Link to="/about#dispute-resolution" className={linkClasses}>{t('footer.disputeResolution')}</Link></li>
              <li><Link to="/about#modern-slavery" className={linkClasses}>{t('footer.modernSlaveryStatement')}</Link></li>
              <li><Link to="/about#human-rights" className={linkClasses}>{t('footer.humanRightsStatement')}</Link></li>
            </ul>
          </div>

          {/* Partners Column */}
          <div>
            <h4 className={headingClasses}>{t('footer.partners')}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/agent-onboarding" className={linkClasses}>{t('footer.becomeAgent')}</Link></li>
              <li><Link to="/creators" className={linkClasses}>{t('footer.influencerProgram')}</Link></li>
              <li><Link to="/shop" className={linkClasses}>{t('footer.affiliateProgram')}</Link></li>
              <li><Link to="/transportation-vendor-partners" className={linkClasses}>{t('footer.listYourCompany')}</Link></li>
            </ul>
          </div>

          {/* About Column */}
          <div>
            <h4 className={headingClasses}>{t('footer.about')}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className={linkClasses}>{t('footer.aboutGoldsainte')}</Link></li>
              <li><Link to="/what-we-do" className={linkClasses}>{t('footer.whatWeDo')}</Link></li>
              <li><a href="#" className={linkClasses}>{t('footer.howWeWork')}</a></li>
              <li><a href="#" className={linkClasses}>{t('footer.pressCenter')}</a></li>
              <li><a href="/about#investor-relations" className={linkClasses}>{t('footer.investorRelations')}</a></li>
              <li><Link to="/corporate-contact" className={linkClasses}>{t('footer.corporateContact')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Currency Selector & Social Media */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-[#E5DFC6]">
          {/* Currency Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <Globe className="h-4 w-4 text-[#6E6650]" />
            <select 
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-[#FDFBF5] border border-[#E5DFC6] rounded px-3 py-2 text-sm text-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-[#C7B892]"
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
            <span className="text-xs sm:text-sm font-secondary uppercase tracking-[0.12em] text-[#0a2225] w-full sm:w-auto text-center sm:text-left">{t('footer.followUs')}</span>
            <a 
              href="https://www.linkedin.com/company/goldsainte/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#4A4A4A] hover:text-[#C7B892] transition-colors" 
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a 
              href="https://www.instagram.com/goldsainteai/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#4A4A4A] hover:text-[#C7B892] transition-colors" 
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Logo & Copyright */}
        <div className="pt-6 sm:pt-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <img src={verticalLogo} alt="Goldsainte" className="h-16 sm:h-20 w-auto" />
            <div className="text-center max-w-3xl px-4">
              <p className="text-xs sm:text-sm text-[#6E6650] mb-2">
                {t('footer.description')}
              </p>
              <p className="text-xs text-[#9A9079]">
                {t('footer.copyright')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};