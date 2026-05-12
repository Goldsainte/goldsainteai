import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, CreditCard, XCircle, UserCircle, Sparkles, Users, Briefcase, MapPin, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/BackButton';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCenterChat } from '@/components/HelpCenterChat';
import { helpCenterFAQs, searchFAQs, getFAQsByCategory } from '@/data/helpCenterFAQs';
import { siteRoutes, searchRoutes } from '@/data/siteRoutes';
import primaryLogoGreen from "@/assets/primary-horizontal-logo-green.svg";

const categories = [
  { id: 'bookings', label: 'Bookings', icon: BookOpen },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'cancellations', label: 'Cancellations', icon: XCircle },
  { id: 'account', label: 'Account', icon: UserCircle },
  { id: 'ai-features', label: 'AI Features', icon: Sparkles },
  { id: 'creator', label: 'Creator Program', icon: Users },
  { id: 'agent', label: 'Agent Marketplace', icon: Briefcase },
  { id: 'navigation', label: 'Navigation', icon: MapPin },
];

const popularRoutes = [
  { path: '/my-trips', label: 'My Trips', icon: BookOpen },
  { path: '/browse-agents', label: 'Browse Agents', icon: Briefcase },
  { path: '/marketplace', label: 'Marketplace', icon: Sparkles },
  { path: '/apply/agent', label: 'Become an Agent', icon: Users },
  { path: '/creator-dashboard', label: 'Creator Dashboard', icon: Users },
  { path: '/corporate-contact', label: 'Contact Us', icon: UserCircle },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFAQs = searchQuery
    ? searchFAQs(searchQuery)
    : selectedCategory
    ? getFAQsByCategory(selectedCategory)
    : helpCenterFAQs;

  const filteredRoutes = searchQuery ? searchRoutes(searchQuery) : [];

  return (
    <div className="flex-1 bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
        {/* Back Button */}
        <BackButton className="mb-6" />

        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-4 sm:h-6 md:h-7 w-auto"
          loading="lazy"/>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-secondary text-primary mb-4">
            Help Center
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-8">
            Get instant answers with our AI assistant or browse FAQs below
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for help articles, pages, or ask a question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-10 sm:h-12 text-base"
            />
          </div>
        </div>

        {/* Search Results for Routes */}
        {searchQuery && filteredRoutes.length > 0 && (
          <div className="mb-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Pages matching "{searchQuery}"
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredRoutes.slice(0, 6).map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  className="flex items-start gap-3 p-3 rounded-md hover:bg-background transition-colors group"
                >
                  <div className="text-primary group-hover:scale-110 transition-transform">
                    →
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {route.label}
                    </div>
                    <div className="text-xs text-muted-foreground">{route.description}</div>
                    <div className="text-xs font-mono text-primary/60 mt-1">{route.path}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Guided Tours */}
        {!searchQuery && (
          <div className="mb-12">
            <h2 className="text-lg sm:text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
              <Compass className="h-5 w-5 text-primary" /> Guided Tours
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { to: "/how-it-works/traveler", label: "For Travelers", desc: "Plan and book trips with verified specialists." },
                { to: "/how-it-works/creator", label: "For Creators", desc: "Monetise your audience with trips and guides." },
                { to: "/how-it-works/agent", label: "For Agents", desc: "Win clients and run trips end-to-end." },
              ].map((c) => (
                <Link
                  key={c.to}
                  to={c.to}
                  className="block p-6 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors group"
                >
                  <div className="font-semibold mb-1 group-hover:text-primary transition-colors">{c.label}</div>
                  <div className="text-sm text-muted-foreground">{c.desc}</div>
                  <div className="text-xs text-primary mt-3">View guide →</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Popular Routes */}
        {!searchQuery && (
          <div className="mb-12">
            <h2 className="text-lg sm:text-xl font-semibold mb-6 text-center">Popular Pages</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularRoutes.map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors group"
                >
                  <route.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium group-hover:text-primary transition-colors">
                    {route.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Category Filters */}
        {!searchQuery && (
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Browse by Category</h2>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="gap-2"
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-lg sm:text-xl font-semibold mb-6">
            {searchQuery
              ? `Search Results (${filteredFAQs.length})`
              : selectedCategory
              ? `${categories.find(c => c.id === selectedCategory)?.label} FAQs`
              : 'Frequently Asked Questions'}
          </h2>

          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No results found. Try asking the AI assistant!</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left hover:text-primary text-sm sm:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Contact Support */}
        <div className="text-center p-8 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Still need help?</h3>
          <p className="text-muted-foreground mb-4">
            Contact our support team or chat with an AI assistant
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/corporate-contact">Contact Support</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/messages">Message Customer Service</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* AI Chat Widget */}
      <HelpCenterChat />
    </div>
  );
}
