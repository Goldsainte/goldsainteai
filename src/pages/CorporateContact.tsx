import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Building2, Users, Briefcase, Info, TrendingUp, Search, HelpCircle, BookOpen, MessageSquare, Mail, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import primaryLogoGreen from "@/assets/primary-horizontal-logo-green.svg";
import { useToast } from "@/hooks/use-toast";

export default function CorporateContact() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Email copied",
      description: "Email address copied to clipboard",
    });
  };

  const contacts = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Customer Support",
      description: "Get help with your bookings and account",
      email: "support@goldsainte.com",
      responseTime: "Usually responds within 24 hours",
      details: [
        "Help with bookings and cancellations",
        "Payment and refund inquiries",
        "Account management",
        "Technical support"
      ]
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Travel Agent Support",
      description: "Support for travel agents and partners",
      email: "agent@goldsainte.com",
      responseTime: "Usually responds within 12 hours",
      details: [
        "Agent-specific inquiries",
        "Partnership opportunities",
        "Commission and payment questions",
        "Technical tools and platform support"
      ]
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Creator Support",
      description: "Support for content creators",
      email: "creator@goldsainte.com",
      responseTime: "Usually responds within 24 hours",
      details: [
        "Content creator inquiries",
        "Monetization questions",
        "Platform features and tools",
        "Partnership opportunities"
      ]
    },
    {
      icon: <Info className="h-6 w-6" />,
      title: "General Information",
      description: "General inquiries and information",
      email: "info@goldsainte.com",
      responseTime: "Usually responds within 48 hours",
      details: [
        "General questions about our services",
        "Media inquiries and press",
        "Partnership and collaboration opportunities",
        "Corporate information"
      ]
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Investor Relations",
      description: "For investors and financial inquiries",
      email: "investors@goldsainte.com",
      responseTime: "Usually responds within 2-3 business days",
      details: [
        "Investment opportunities",
        "Financial information and reports",
        "Corporate governance",
        "Shareholder inquiries"
      ]
    }
  ];

  const filteredContacts = contacts.filter(contact => 
    searchQuery === "" || 
    contact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.details.some(detail => detail.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 max-w-5xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 h-12 text-sm sm:text-base"
          size="lg"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Back
        </Button>

        {/* Logo Section */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-4 sm:h-6 md:h-7 w-auto"
          />
        </div>

        {/* Hero Section */}
        <div className="mb-8 sm:mb-12 text-center max-w-3xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-secondary text-primary mb-4">
            Contact Us
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 px-2">
            Find the right team to help you. Choose the department that best matches your inquiry for the fastest response.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 sm:h-12 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Contact Departments Accordion */}
        <Accordion type="single" collapsible className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          {filteredContacts.map((contact, index) => (
            <AccordionItem 
              key={index} 
              value={`contact-${index}`}
              className="border-0 rounded-lg px-4 sm:px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors"
            >
              <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47] py-3 sm:py-4">
                <div className="flex items-center gap-3">
                  {contact.icon}
                  <span>{contact.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-3 sm:pt-4 space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <img 
                    src={primaryLogoGreen} 
                    alt="Goldsainte" 
                    className="h-4 sm:h-5 md:h-7 w-auto"
                  />
                </div>
                
                <p className="text-foreground">{contact.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <a href={`mailto:${contact.email}`} className="hover:underline">
                      {contact.email}
                    </a>
                  </div>
                  {contact.responseTime && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {contact.responseTime}
                    </p>
                  )}
                </div>

                {contact.details && contact.details.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">We can help with:</h4>
                    <ul className="space-y-1 text-foreground">
                      {contact.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button 
                    size="sm" 
                    asChild
                    className="text-xs sm:text-sm"
                  >
                    <a href={`mailto:${contact.email}`}>
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Send Email
                    </a>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopyEmail(contact.email)}
                    className="text-xs sm:text-sm"
                  >
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Copy Email
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Additional Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="bg-primary/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                  <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Help Center</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                    Find answers to common questions in our comprehensive help center
                  </p>
                  <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
                    <a href="/help">
                      Visit Help Center
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Community Guidelines</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                    Learn about our community standards and policies
                  </p>
                  <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
                    <a href="/community-guidelines">
                      Read Guidelines
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Hours Notice */}
        <Card className="max-w-3xl mx-auto">
          <CardContent className="p-4 sm:p-6 text-center">
            <h3 className="text-base sm:text-lg font-semibold mb-2">Business Hours</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Our support teams operate Monday through Friday, 9:00 AM - 6:00 PM EST.
              For urgent matters outside business hours, please mark your email as "Urgent" in the subject line.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
