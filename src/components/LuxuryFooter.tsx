import { Facebook, Instagram, Twitter, Linkedin, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

export const LuxuryFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-luxury-emerald text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: About */}
          <div className="space-y-6">
            <h4 className="font-secondary text-xl font-bold text-luxury-gold tracking-wide">
              Goldsainte
            </h4>
            <p className="text-white/80 text-sm leading-relaxed">
              Redefining luxury travel with AI, agents, and creators. Where technology meets timeless exploration.
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-luxury-gold text-luxury-emerald hover:bg-luxury-gold/90 font-semibold border-2 border-luxury-gold/30 transition-all duration-300 hover:scale-105"
            >
              Join Goldsainte Circle
            </Button>
          </div>

          {/* Column 2: Discover */}
          <div className="space-y-4">
            <h4 className="font-secondary text-lg font-bold text-luxury-gold">
              Discover
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/cocurated-journeys" className="text-white/80 hover:text-luxury-gold transition-colors">
                  CoCurated Journeys
                </Link>
              </li>
              <li>
                <Link to="/browse-agents" className="text-white/80 hover:text-luxury-gold transition-colors">
                  Expert Agents
                </Link>
              </li>
              <li>
                <Link to="/journeys" className="text-white/80 hover:text-luxury-gold transition-colors">
                  Creator Stories
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-white/80 hover:text-luxury-gold transition-colors">
                  Marketplace
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-4">
            <h4 className="font-secondary text-lg font-bold text-luxury-gold">
              Support
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/help" className="text-white/80 hover:text-luxury-gold transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-white/80 hover:text-luxury-gold transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/messages" className="text-white/80 hover:text-luxury-gold transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/trust-safety" className="text-white/80 hover:text-luxury-gold transition-colors">
                  Trust & Safety
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="space-y-4">
            <h4 className="font-secondary text-lg font-bold text-luxury-gold">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="text-white/80 hover:text-luxury-gold transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/agent-onboarding" className="text-white/80 hover:text-luxury-gold transition-colors">
                  Become an Agent
                </Link>
              </li>
              <li>
                <Link to="/transportation-vendor-partners" className="text-white/80 hover:text-luxury-gold transition-colors">
                  Partner With Us
                </Link>
              </li>
              <li>
                <Link to="/corporate-contact" className="text-white/80 hover:text-luxury-gold transition-colors">
                  Corporate Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-luxury-gold/20 mb-12" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Tagline */}
          <div className="text-center md:text-left">
            <p className="text-white/90 font-secondary text-lg font-light italic tracking-wide">
              Goldsainte — where every journey is extraordinary
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/goldsainte/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border-2 border-luxury-gold/30 flex items-center justify-center text-luxury-gold hover:bg-luxury-gold hover:text-luxury-emerald transition-all duration-300 hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full border-2 border-luxury-gold/30 flex items-center justify-center text-luxury-gold hover:bg-luxury-gold hover:text-luxury-emerald transition-all duration-300 hover:scale-110"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full border-2 border-luxury-gold/30 flex items-center justify-center text-luxury-gold hover:bg-luxury-gold hover:text-luxury-emerald transition-all duration-300 hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full border-2 border-luxury-gold/30 flex items-center justify-center text-luxury-gold hover:bg-luxury-gold hover:text-luxury-emerald transition-all duration-300 hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="mailto:hello@goldsainte.com"
              className="w-10 h-10 rounded-full border-2 border-luxury-gold/30 flex items-center justify-center text-luxury-gold hover:bg-luxury-gold hover:text-luxury-emerald transition-all duration-300 hover:scale-110"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-12 pt-8 border-t border-luxury-gold/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/60">
            <p>© 2025 Goldsainte.Ai™. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/privacy-cookies" className="hover:text-luxury-gold transition-colors">
                Privacy Policy
              </Link>
              <Link to="/about#terms" className="hover:text-luxury-gold transition-colors">
                Terms of Service
              </Link>
              <Link to="/about#accessibility" className="hover:text-luxury-gold transition-colors">
                Accessibility
              </Link>
              <Link to="/community-guidelines" className="hover:text-luxury-gold transition-colors">
                Community Guidelines
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
