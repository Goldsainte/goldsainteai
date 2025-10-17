import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowUp, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const PrivacyCookies = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Privacy and Cookies Policy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your privacy matters to us. Learn how Goldsainte collects, uses, and protects your personal information.
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-12 px-4 border-b">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Table of Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a href="#introduction" className="text-primary hover:underline">1. Introduction</a>
                <a href="#privacy-policy" className="text-primary hover:underline">2. Our Privacy Policy</a>
                <a href="#cookies" className="text-primary hover:underline">3. Cookies and Similar Technologies</a>
                <a href="#updates" className="text-primary hover:underline">4. Updates to This Statement</a>
                <a href="#contact" className="text-primary hover:underline">5. Contact Us</a>
              </nav>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl space-y-12">
          {/* Introduction */}
          <div id="introduction" className="scroll-mt-20">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">1. Introduction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base">
                  Goldsainte ("we," "us," or "our") is committed to protecting your privacy and providing a safe and secure online experience. This Policy and Cookies Statement explains how we collect, use, and store your information when you access or use our website, mobile applications, and other digital services (collectively, the "Platform"), and how we use cookies and similar technologies.
                </p>
                <p className="text-base">
                  By using our Platform, you agree to the terms described in this Policy and Cookies Statement.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Policy */}
          <div id="privacy-policy" className="scroll-mt-20">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">2. Our Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-base">
                  Goldsainte respects your privacy and processes your personal data in accordance with applicable data protection laws, including GDPR, CCPA, and other relevant legislation.
                </p>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="data-collection">
                    <AccordionTrigger className="text-xl font-semibold">
                      Information We Collect
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <p className="text-base">We may collect the following types of information:</p>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-base font-semibold mb-2">Personal Information</h4>
                          <p className="text-base">Name, email, phone number, address, and payment details when you make a booking or register on our Platform.</p>
                        </div>

                        <div>
                          <h4 className="text-base font-semibold mb-2">Travel and Booking Data</h4>
                          <p className="text-base">Reservation details, preferences, past bookings, and interactions with our Platform.</p>
                        </div>

                        <div>
                          <h4 className="text-base font-semibold mb-2">Usage Data</h4>
                          <p className="text-base">Information about your visits to our Platform, including IP address, browser type, pages visited, and time spent.</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="how-we-use">
                    <AccordionTrigger className="text-xl font-semibold">
                      How We Use Your Information
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-base">We use your information to:</p>
                      <ul className="list-disc list-inside space-y-2 text-base">
                        <li>Provide and manage our services, including bookings, payments, and customer support</li>
                        <li>Personalize your experience on our Platform, including recommendations and offers</li>
                        <li>Communicate important updates, marketing, and promotions (with your consent where required)</li>
                        <li>Improve our Platform, security, and business operations</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="sharing">
                    <AccordionTrigger className="text-xl font-semibold">
                      Sharing Your Information
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-base">We may share your data with:</p>
                      <ul className="list-disc list-inside space-y-2 text-base">
                        <li><strong>Service Providers and partners</strong> to facilitate bookings and travel experiences</li>
                        <li><strong>Legal authorities</strong> if required by law or to protect our rights</li>
                        <li><strong>Other entities within the Goldsainte group</strong> for operational purposes</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="your-rights">
                    <AccordionTrigger className="text-xl font-semibold">
                      Your Rights
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-base">
                        You have rights over your personal data, including access, correction, deletion, and objection to processing. To exercise your rights, please contact our Data Protection Officer at:
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <p className="text-base font-semibold">Goldsainte Data Protection Officer</p>
                        <p className="text-base">850 New Burton Road, Suite 201</p>
                        <p className="text-base">Dover, DE 19904, County of Kent</p>
                        <p className="text-base">Email: support@goldsainte.com</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Cookies */}
          <div id="cookies" className="scroll-mt-20">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">3. Cookies and Similar Technologies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-base">
                  Goldsainte uses cookies and similar technologies to enhance your experience on our Platform, analyze usage, and provide personalized content and advertising.
                </p>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="cookie-types">
                    <AccordionTrigger className="text-xl font-semibold">
                      Types of Cookies We Use
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-base font-semibold mb-2">Strictly Necessary Cookies</h4>
                          <p className="text-base">Essential for Platform functionality, such as logging in, managing bookings, and ensuring security.</p>
                        </div>

                        <div>
                          <h4 className="text-base font-semibold mb-2">Performance and Analytics Cookies</h4>
                          <p className="text-base">Help us understand how visitors interact with our Platform to improve features and usability.</p>
                        </div>

                        <div>
                          <h4 className="text-base font-semibold mb-2">Functional Cookies</h4>
                          <p className="text-base">Remember preferences, language settings, and login information.</p>
                        </div>

                        <div>
                          <h4 className="text-base font-semibold mb-2">Advertising and Targeting Cookies</h4>
                          <p className="text-base">Deliver relevant promotions, measure ad effectiveness, and provide personalized offers.</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="managing-cookies">
                    <AccordionTrigger className="text-xl font-semibold">
                      Managing Cookies
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-base">
                        You can manage your cookie preferences through your browser settings. Note that disabling certain cookies may affect the functionality and user experience of our Platform.
                      </p>
                      <p className="text-base text-muted-foreground">
                        Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="third-party">
                    <AccordionTrigger className="text-xl font-semibold">
                      Third-Party Cookies
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-base">
                        Some cookies are set by third-party partners for analytics, advertising, or social media integration. We do not control these cookies, and their use is governed by the third party's privacy policy.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Updates */}
          <div id="updates" className="scroll-mt-20">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">4. Updates to This Statement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base">
                  Goldsainte may update this Policy and Cookies Statement periodically to reflect changes in our practices, technology, or legal requirements. The latest version will always be available on our Platform, and we encourage you to review it regularly.
                </p>
                <p className="text-base text-muted-foreground">
                  We will notify you of any material changes by posting a notice on our Platform or by sending you an email notification.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact */}
          <div id="contact" className="scroll-mt-20">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">5. Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base">
                  If you have questions or concerns about this Policy and Cookies Statement, or if you would like to exercise your privacy rights, please contact us at:
                </p>
                
                <div className="bg-primary/5 p-6 rounded-lg space-y-4">
                  <h3 className="text-xl font-semibold">Goldsainte</h3>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-base">850 New Burton Road, Suite 201</p>
                      <p className="text-base">Dover, DE 19904</p>
                      <p className="text-base">County of Kent</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                    <a href="mailto:support@goldsainte.com" className="text-base text-primary hover:underline">
                      support@goldsainte.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Related Links */}
          <div className="pt-8">
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">Related Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                  <Link to="/dispute-resolution" className="text-primary hover:underline">
                    Dispute Resolution
                  </Link>
                  <Link to="/about" className="text-primary hover:underline">
                    About Goldsainte
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 rounded-full w-12 h-12 shadow-lg"
          size="icon"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default PrivacyCookies;
