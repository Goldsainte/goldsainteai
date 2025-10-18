import { Facebook, Instagram, Twitter, Linkedin, Youtube, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import verticalLogo from "@/assets/primary-vertical-logo-gold.png";
import { Button } from "./ui/button";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

const popularDestinations = [
  { name: "Maldives", region: "Indian Ocean" },
  { name: "Dubai", region: "United Arab Emirates" },
  { name: "Paris", region: "France" },
  { name: "Bali", region: "Indonesia" },
  { name: "Santorini", region: "Greece" },
  { name: "Tokyo", region: "Japan" },
  { name: "New York", region: "USA" },
  { name: "London", region: "United Kingdom" },
  { name: "Barcelona", region: "Spain" },
  { name: "Thailand", region: "Southeast Asia" },
];

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
];

export const Footer = () => {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [showAllDestinations, setShowAllDestinations] = useState(false);

  return (
    <footer className="bg-background border-t border-border mt-16">
      {/* Popular Destinations Section */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 border-b border-border">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {popularDestinations.slice(0, showAllDestinations ? undefined : 10).map((dest, idx) => (
            <Link 
              key={idx}
              to={`/?aiChat=true&destination=${encodeURIComponent(dest.name)}`}
              className="text-sm hover:text-primary transition-colors group"
            >
              <div className="font-medium group-hover:underline">{dest.name}</div>
              <div className="text-xs text-muted-foreground">{dest.region}</div>
            </Link>
          ))}
        </div>
        {popularDestinations.length > 10 && (
          <Button
            variant="link"
            onClick={() => setShowAllDestinations(!showAllDestinations)}
            className="mt-4 text-primary"
          >
            {showAllDestinations ? "Show less" : "Show more destinations"}
          </Button>
        )}
      </div>

      {/* Navigation Links Section */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* MOBILE: Accordion Layout */}
        <Accordion type="multiple" className="md:hidden mb-8">
          {/* Support */}
          <AccordionItem value="support">
            <AccordionTrigger className="text-sm font-semibold">Support</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">Manage your trips</Link></li>
                <li><Link to="/messages" className="hover:text-primary transition-colors">Contact Customer Service</Link></li>
                <li><Link to="/trust-safety" className="hover:text-primary transition-colors">Safety Resource Center</Link></li>
                <li><Link to="/cancellation-refund-policy" className="hover:text-primary transition-colors">Cancellation & Refunds</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Discover */}
          <AccordionItem value="discover">
            <AccordionTrigger className="text-sm font-semibold">Discover</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/journeys" className="hover:text-primary transition-colors">Journeys</Link></li>
                <li><Link to="/trending" className="hover:text-primary transition-colors">Seasonal & Holiday Deals</Link></li>
                <li><Link to="/browse-agents" className="hover:text-primary transition-colors">Travel Agent Services</Link></li>
                <li><Link to="/cocurated-marketplace" className="hover:text-primary transition-colors">Co-Curated Packages</Link></li>
                <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Terms and settings */}
          <AccordionItem value="terms">
            <AccordionTrigger className="text-sm font-semibold">Terms and settings</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/about#legal" className="hover:text-primary transition-colors">Company Information</Link></li>
                <li><Link to="/privacy-cookies" className="hover:text-primary transition-colors">Privacy & cookies</Link></li>
                <li><Link to="/about#terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/about#accessibility" className="hover:text-primary transition-colors">Accessibility Statement</Link></li>
                <li><Link to="/community-guidelines" className="hover:text-primary transition-colors">Community Guidelines</Link></li>
                <li><Link to="/about#dispute-resolution" className="hover:text-primary transition-colors">Dispute resolution</Link></li>
                <li><Link to="/about#modern-slavery" className="hover:text-primary transition-colors">Modern Slavery Statement</Link></li>
                <li><Link to="/about#human-rights" className="hover:text-primary transition-colors">Human Rights Statement</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Partners */}
          <AccordionItem value="partners">
            <AccordionTrigger className="text-sm font-semibold">Partners</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/agent-onboarding" className="hover:text-primary transition-colors">Become a Travel Agent</Link></li>
                <li><Link to="/browse-creators" className="hover:text-primary transition-colors">Influencer Program</Link></li>
                <li><Link to="/shop" className="hover:text-primary transition-colors">Affiliate Program</Link></li>
                <li><Link to="/transportation-vendor-partners" className="hover:text-primary transition-colors">List Your Company</Link></li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* About */}
          <AccordionItem value="about" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold">About</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">About Goldsainte</Link></li>
                <li><Link to="/what-we-do" className="hover:text-primary transition-colors">What We Do</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">How We Work</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Press Center</a></li>
                <li><a href="/about#investor-relations" className="hover:text-primary transition-colors">Investor Relations</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Corporate Contact</a></li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* DESKTOP: Grid Layout */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Support Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">Support</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Manage your trips</Link></li>
              <li><Link to="/messages" className="hover:text-primary transition-colors">Contact Customer Service</Link></li>
              <li><Link to="/trust-safety" className="hover:text-primary transition-colors">Safety Resource Center</Link></li>
              <li><Link to="/cancellation-refund-policy" className="hover:text-primary transition-colors">Cancellation & Refunds</Link></li>
            </ul>
          </div>

          {/* Discover Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">Discover</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/journeys" className="hover:text-primary transition-colors">Journeys</Link></li>
              <li><Link to="/trending" className="hover:text-primary transition-colors">Seasonal & Holiday Deals</Link></li>
              <li><Link to="/browse-agents" className="hover:text-primary transition-colors">Travel Agent Services</Link></li>
              <li><Link to="/cocurated-marketplace" className="hover:text-primary transition-colors">Co-Curated Packages</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
            </ul>
          </div>

          {/* Terms & Settings Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">Terms and settings</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/about#legal" className="hover:text-primary transition-colors">Company Information</Link></li>
              <li><Link to="/privacy-cookies" className="hover:text-primary transition-colors">Privacy & cookies</Link></li>
              <li><Link to="/about#terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/about#accessibility" className="hover:text-primary transition-colors">Accessibility Statement</Link></li>
              <li><Link to="/community-guidelines" className="hover:text-primary transition-colors">Community Guidelines</Link></li>
              <li><Link to="/about#dispute-resolution" className="hover:text-primary transition-colors">Dispute resolution</Link></li>
              <li><Link to="/about#modern-slavery" className="hover:text-primary transition-colors">Modern Slavery Statement</Link></li>
              <li><Link to="/about#human-rights" className="hover:text-primary transition-colors">Human Rights Statement</Link></li>
            </ul>
          </div>

          {/* Partners Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">Partners</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/agent-onboarding" className="hover:text-primary transition-colors">Become a Travel Agent</Link></li>
              <li><Link to="/browse-creators" className="hover:text-primary transition-colors">Influencer Program</Link></li>
              <li><Link to="/shop" className="hover:text-primary transition-colors">Affiliate Program</Link></li>
              <li><Link to="/transportation-vendor-partners" className="hover:text-primary transition-colors">List Your Company</Link></li>
            </ul>
          </div>

          {/* About Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">About</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Goldsainte</Link></li>
              <li><Link to="/what-we-do" className="hover:text-primary transition-colors">What We Do</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">How We Work</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Press Center</a></li>
              <li><a href="/about#investor-relations" className="hover:text-primary transition-colors">Investor Relations</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Corporate Contact</a></li>
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
            <span className="text-xs sm:text-sm font-medium w-full sm:w-auto text-center sm:text-left">Follow us:</span>
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
                Goldsainte AI is part of Goldsainte Inc., the world leader in AI-powered luxury travel and curated experiences. Discover. Create. Share. Travel with Goldsainte.
              </p>
              <p className="text-xs text-muted-foreground">
                Copyright © 2025 Goldsainte.Ai™. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
