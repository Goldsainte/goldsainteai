import { Facebook, Instagram, Twitter, Linkedin, Youtube, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import verticalLogo from "@/assets/primary-vertical-logo-gold.png";
import { Button } from "./ui/button";
import { useState } from "react";

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
      <div className="container mx-auto px-4 py-8 border-b border-border">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
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
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Support Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">Support</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/my-trips" className="hover:text-primary transition-colors">Manage your trips</Link></li>
              <li><Link to="/messages" className="hover:text-primary transition-colors">Contact Customer Service</Link></li>
              <li><Link to="/trust-safety" className="hover:text-primary transition-colors">Safety Resource Center</Link></li>
              <li><Link to="/cancellation-refund-policy" className="hover:text-primary transition-colors">Cancellation & Refunds</Link></li>
            </ul>
          </div>

          {/* Discover Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">Discover</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/what-we-do" className="hover:text-primary transition-colors">Our Services</Link></li>
              <li><Link to="/loyalty-rewards" className="hover:text-primary transition-colors">Loyalty Program</Link></li>
              <li><Link to="/trending" className="hover:text-primary transition-colors">Seasonal & Holiday Deals</Link></li>
              <li><Link to="/travel-feed" className="hover:text-primary transition-colors">Travel Articles & Videos</Link></li>
              <li><Link to="/browse-agents" className="hover:text-primary transition-colors">Travel Agent Services</Link></li>
              <li><Link to="/cocurated-marketplace" className="hover:text-primary transition-colors">Co-Curated Packages</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
            </ul>
          </div>

          {/* Terms & Settings Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">Terms and settings</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy & cookies</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><Link to="/about#accessibility" className="hover:text-primary transition-colors">Accessibility Statement</Link></li>
              <li><Link to="/community-guidelines" className="hover:text-primary transition-colors">Community Guidelines</Link></li>
              <li><Link to="/dispute-resolution" className="hover:text-primary transition-colors">Dispute resolution</Link></li>
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
              <li><a href="#" className="hover:text-primary transition-colors">Partner Help Center</a></li>
            </ul>
          </div>

          {/* About Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">About</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Goldsainte</Link></li>
              <li><Link to="/what-we-do" className="hover:text-primary transition-colors">What We Do</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">How We Work</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Sustainability</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Press Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Investor Relations</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Corporate Contact</a></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-semibold mb-4 text-base">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/about#legal" className="hover:text-primary transition-colors">Company Information</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy & Cookies</a></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/dispute-resolution" className="hover:text-primary transition-colors">Dispute Resolution</Link></li>
              <li><Link to="/about#modern-slavery" className="hover:text-primary transition-colors">Modern Slavery Statement</Link></li>
            </ul>
          </div>
        </div>

        {/* Currency Selector & Social Media */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pb-8 border-b border-border">
          {/* Currency Selector */}
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Follow us:</span>
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
        <div className="pt-8">
          <div className="flex flex-col items-center gap-6">
            <img src={verticalLogo} alt="Goldsainte" className="h-20 w-auto" />
            <div className="text-center max-w-3xl">
              <p className="text-sm text-muted-foreground mb-2">
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
