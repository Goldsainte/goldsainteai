import { Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import verticalLogo from "@/assets/primary-vertical-logo-gold.png";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();

  const headingClasses = "font-secondary text-xs uppercase tracking-[0.18em] text-[#0a2225] mb-4";
  const linkClasses = "text-[#4A4A4A] hover:text-[#C7B892] transition-colors";
  const legalLinkClasses = "text-xs text-[#9A9079] hover:text-[#C7B892] transition-colors";

  const columns = [
    {
      heading: "EXPLORE",
      links: [
        { to: "/marketplace", label: "Browse Trips" },
        { to: "/post-trip", label: "Post a Trip" },
        { to: "/agents", label: "Find a Specialist" },
      ],
    },
    {
      heading: "JOIN GOLDSAINTE",
      links: [
        { to: "/auth?mode=signup&role=traveler", label: "Sign Up as a Traveler" },
        { to: "/apply/agent", label: "Apply as a Travel Agent" },
        { to: "/apply/brand", label: "Partner as a Brand" },
      ],
    },
    {
      heading: "COMPANY",
      links: [
        { to: "/about", label: "About Goldsainte" },
        { to: "/corporate-contact", label: "Contact Us" },
      ],
    },
    {
      heading: "GETTING STARTED",
      links: [
        { to: "/how-it-works/traveler", label: "For Travelers" },
        { to: "/how-it-works/creator", label: "For Creators" },
        { to: "/how-it-works/agent", label: "For Agents" },
      ],
    },
    {
      heading: "SUPPORT",
      links: [
        { to: "/help", label: "Help Center" },
        { to: "/trust-safety", label: "Safety & Trust" },
        { to: "/cancellation-refund-policy", label: "Cancellation Policy" },
        { to: "/community-guidelines", label: "Community Guidelines" },
      ],
    },
  ];

  const legalLinks = [
    { to: "/privacy-cookies", label: "Privacy Policy" },
    { to: "/terms", label: "Terms of Service" },
    { to: "/dispute-resolution", label: "Dispute Resolution" },
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
              <AccordionTrigger className={headingClasses}>{col.heading}</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className={linkClasses}>{l.label}</Link>
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
              <h4 className={headingClasses}>{col.heading}</h4>
              <ul className="space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className={linkClasses}>{l.label}</Link>
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
            className="inline-flex items-center justify-center h-8 w-8 rounded-full text-[#4A4A4A] hover:text-[#C7B892] transition-colors" 
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
          </a>
          <a 
            href="https://www.instagram.com/goldsainteai/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center h-8 w-8 rounded-full text-[#4A4A4A] hover:text-[#C7B892] transition-colors" 
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

        {/* Legal Bottom Bar */}
        <div className="pt-2 flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-center">
          {legalLinks.map((l, i) => (
            <span key={l.label} className="flex items-center gap-2">
              <Link to={l.to} className={legalLinkClasses}>{l.label}</Link>
              {i < legalLinks.length - 1 && <span className="text-[#9A9079]">·</span>}
            </span>
          ))}
          <span className="text-[#9A9079]">·</span>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("show-install-prompt"))}
            className={legalLinkClasses}
          >
            Install App
          </button>
          <span className="text-[#9A9079]">·</span>
          <span className="text-xs text-[#9A9079]">© 2026 Goldsainte AI Inc. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
