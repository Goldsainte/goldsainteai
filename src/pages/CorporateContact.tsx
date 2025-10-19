import { useState } from "react";
import { ContactCard } from "@/components/ContactCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Building2, Users, Briefcase, Info, TrendingUp, Search, HelpCircle, BookOpen, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export default function CorporateContact() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 h-12 text-base"
          size="lg"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>

        {/* Hero Section */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-6">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-secondary text-primary mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Find the right team to help you. Choose the department that best matches your inquiry for the fastest response.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredContacts.map((contact, index) => (
            <ContactCard key={index} {...contact} />
          ))}
        </div>

        {/* Additional Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Help Center</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Find answers to common questions in our comprehensive help center
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/help">
                      Visit Help Center
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Community Guidelines</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Learn about our community standards and policies
                  </p>
                  <Button variant="outline" size="sm" asChild>
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
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Business Hours</h3>
            <p className="text-sm text-muted-foreground">
              Our support teams operate Monday through Friday, 9:00 AM - 6:00 PM EST.
              For urgent matters outside business hours, please mark your email as "Urgent" in the subject line.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
