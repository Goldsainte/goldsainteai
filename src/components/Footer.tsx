import { LanguageSelector } from "@/components/LanguageSelector";
import { Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import verticalLogo from "@/assets/primary-vertical-logo-gold.webp";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();

  const headingClasses = "font-secondary text-xs uppercase tracking-[0.18em] text-[#0a2225] mb-4";
  const linkClasses = "text-[#4A4A4A] hover:text-[#C7B892] transition-colors";
  // `inline-flex items-center` is load-bearing, not decoration: index.css
  // applies a global 44px touch-target min-height to BOTH <a> and <button>.
  // As flex items each legal item gets a 44px-tall box, but a link renders its
  // text at the TOP of that box while a button centers its text — which put
  // "Install App" exactly (44-16)/2 = 14px lower than its neighbours on every
  // screen size (founder report, Jul 25). Centering the content of both
  // element types aligns them while keeping the accessible touch target.
  const legalLinkClasses = "inline-flex items-center text-xs text-[#9A9079] hover:text-[#C7B892] transition-colors";

  const columns = [
    {
      headingKey: "footer.colExplore",
      heading: "EXPLORE",
      links: [
        { to: "/marketplace", labelKey: "footer.browseTrips", label: "Browse Trips" },
        { to: "/creators", labelKey: "footer.browseCreators", label: "Browse Creators" },
        { to: "/post-trip", labelKey: "footer.postTrip", label: "Post a Trip" },
        { to: "/agents", labelKey: "footer.findSpecialist", label: "Find a Specialist" },
      ],
    },
    {
      headingKey: "footer.colJoin",
      heading: "JOIN GOLDSAINTE",
      links: [
        { to: "/auth?mode=signup&role=traveler", labelKey: "footer.signupTraveler", label: "Sign Up as a Traveler" },
        // Restored Jul 26. Creator is one of the three live signup roles
        // (SIGNUP_ROLES in Auth.tsx) and has a card in the picker, but the
        // footer link went missing during the tour-operator cleanup — leaving
        // creators with no footer entry point at all.
        { to: "/auth?mode=signup&role=creator", labelKey: "footer.joinCreator", label: "Join as a Creator" },
        { to: "/auth?mode=signup&role=agent", labelKey: "footer.applyAgent", label: "Apply as a Travel Agent" },
      ],
    },
    {
      headingKey: "footer.colCompany",
      heading: "COMPANY",
      links: [
        { to: "/about", labelKey: "footer.aboutGs", label: "About Goldsainte" },
        { to: "/newsroom", labelKey: "footer.newsroomL", label: "Newsroom" },
        { to: "/newsroom/press-contact", labelKey: "footer.pressL", label: "Press" },
        { to: "/corporate-contact", labelKey: "footer.contactUs", label: "Contact Us" },
      ],
    },
    {
      headingKey: "footer.colStarted",
      heading: "GETTING STARTED",
      links: [
        { to: "/how-it-works/traveler", labelKey: "footer.forTravelers", label: "For Travelers" },
        { to: "/how-it-works/creator", labelKey: "footer.forCreators", label: "For Creators" },
        { to: "/how-it-works/agent", labelKey: "footer.forAgents", label: "For Agents" },
        { to: "/help/supported-countries", labelKey: "footer.whereAvailable", label: "Where we're available" },
        { to: "/help/payments-and-fees", labelKey: "footer.paymentsFees", label: "Payments and fees" },
      ],
    },
    {
      headingKey: "footer.colSupport",
      heading: "SUPPORT",
      links: [
        { to: "/help", labelKey: "footer.helpCenter", label: "Help Center" },
        { to: "/trust-safety", labelKey: "footer.safetyTrust", label: "Safety & Trust" },
        { to: "/cancellation-refund-policy", labelKey: "footer.cancellationPolicy", label: "Cancellation Policy" },
        { to: "/community-guidelines", labelKey: "footer.communityGuidelines", label: "Community Guidelines" },
        { to: "/privacy-cookies", labelKey: "footer.privacyPolicy", label: "Privacy Policy" },
      ],
    },
  ];

  const legalLinks = [
    { to: "/privacy-cookies", labelKey: "footer.privacyPolicy", label: "Privacy Policy" },
    { to: "/terms", labelKey: "footer.termsOfService", label: "Terms of Service" },
    { to: "/legal/creator-agreement", labelKey: "footer.creatorAgreement", label: "Creator Agreement" },
    { to: "/legal/agent-agreement", labelKey: "footer.agentAgreement", label: "Agent Agreement" },
    { to: "/dispute-resolution", labelKey: "footer.disputeRes", label: "Dispute Resolution" },
  ];

  return (
    <footer className="mt-auto bg-[#FDF9F0] border-t border-[#E5DFC6]">
      {/* Navigation Links Section */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* MOBILE: Accordion Layout */}
        <Accordion type="multiple" className="md:hidden mb-8">
          {columns.map((col, i) => (
            <AccordionItem
              key={col.heading}
              value={col.heading}
              className={i === columns.length - 1 ? "border-b-0" : "border-[#E5DFC6]"}
            >
              <AccordionTrigger className={headingClasses}>{t(col.headingKey, col.heading)}</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className={linkClasses}>{t(l.labelKey, l.label)}</Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* DESKTOP: Grid Layout */}
        <div className="hidden md:grid grid-cols-5 gap-8 mb-12">
          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className={headingClasses}>{t(col.headingKey, col.heading)}</h4>
              <ul className="space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className={linkClasses}>{t(l.labelKey, l.label)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Media */}
        <div className="flex justify-center items-center gap-3 pb-6 sm:pb-8 border-b border-[#E5DFC6]">
          <span className="text-xs sm:text-sm font-secondary uppercase tracking-[0.12em] text-[#0a2225]">{t('footer.followUs')}</span>
          <a 
            href="https://www.linkedin.com/company/goldsainte/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5DFC6] text-[#0a2225] transition-colors hover:border-[#C7A962] hover:bg-[#C7A962]" 
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
          </a>
          <a 
            href="https://www.instagram.com/goldsainteai/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5DFC6] text-[#0a2225] transition-colors hover:border-[#C7A962] hover:bg-[#C7A962]" 
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5" />
          </a>
        </div>

        {/* Logo */}
        <div className="pt-8 pb-4 flex justify-center">
          <img src={verticalLogo} alt="Goldsainte" className="h-14 sm:h-16 w-auto" loading="lazy"/>
        </div>

        {/* Description */}
        <div className="text-center max-w-3xl mx-auto px-4 pb-6">
          <p className="text-xs sm:text-sm text-[#6E6650]">
            {t('footer.description')}
          </p>
        </div>

        {/* Seller-of-record disclosure. Kept in English in the markup (not the
            i18n layer) because legal disclosure text should be reviewed and
            translated by counsel rather than machine-translated. */}
        <div className="text-center max-w-3xl mx-auto px-4 pb-6">
          <p className="text-[11px] leading-relaxed text-[#9A9079]">
            Travel booked on Goldsainte is sold by independent travel
            professionals, who are the seller of record and are paid directly
            for your trip. Goldsainte is a technology platform that connects
            travelers with these professionals — we are not a travel agency,
            tour operator, airline, hotel, or the seller of your travel services.
          </p>
        </div>

        {/* Legal Bottom Bar — one compact wrapping row on EVERY breakpoint
            (Tory Burch treatment, founder request Jul 25). Previously the row
            collapsed to a tall vertical stack on mobile. */}
        <div className="pt-2">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-center">
            {legalLinks.map((l) => (
              <Link key={l.label} to={l.to} className={legalLinkClasses}>{t(l.labelKey, l.label)}</Link>
            ))}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("show-install-prompt"))}
              className={legalLinkClasses}
            >
              {t("footer.installApp", "Install App")}
            </button>
          </div>
          <div className="mt-4 flex flex-col items-center gap-2">
            <span className="text-xs text-[#9A9079]">{t("footer.copyright", "© 2026 Goldsainte AI Inc. All rights reserved.")}</span>
            <LanguageSelector className="gap-2 text-[#9A9079] hover:text-[#E5DFC6] transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  );
};
