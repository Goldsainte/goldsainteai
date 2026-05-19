import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/BackButton';
import {
  ShieldCheck,
  Info,
  Database,
  Settings,
  Users,
  Cookie,
  Lock,
  RefreshCw,
  Mail,
  MapPin,
  ArrowUp,
} from 'lucide-react';

const SectionHeader = ({
  icon: Icon,
  number,
  title,
}: {
  icon: typeof Info;
  number: string;
  title: string;
}) => (
  <CardTitle className="flex items-center gap-3 font-secondary text-2xl">
    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0c4d47]/10">
      <Icon className="h-5 w-5 text-[#0c4d47]" />
    </span>
    <span className="text-[#0a2225]">
      <span className="text-sm font-medium text-[#C7A962] mr-2">{number}</span>
      {title}
    </span>
  </CardTitle>
);

export default function PrivacyCookies() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>Privacy &amp; Cookies Policy · Goldsainte</title>
        <meta name="description" content="How Goldsainte collects, uses, shares, and safeguards your personal information — and your rights under GDPR, CCPA, and other privacy laws." />
      </Helmet>

      <BackButton className="mb-6" />

      <header className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151] mb-2">Legal</p>
        <h1 className="font-secondary text-4xl text-[#0a2225] mb-3">Privacy &amp; Cookies Policy</h1>
        <p className="text-sm text-[#4a4a4a]">Last updated: May 19, 2026</p>
      </header>

      <Alert className="mb-8">
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Goldsainte takes your privacy seriously. This policy explains what data we collect,
          how we use it, who we share it with, and your rights under GDPR, CCPA, and other
          privacy laws. You can request a copy of your data or deletion at any time by emailing{' '}
          <a href="mailto:privacy@goldsainte.com" className="text-[#0c4d47] underline">privacy@goldsainte.com</a>.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <SectionHeader icon={Info} number="1" title="Overview" />
          </CardHeader>
          <CardContent className="space-y-4 leading-relaxed">
            <p>
              Goldsainte ("we," "us," or "our") is committed to protecting your privacy and
              providing a safe and secure online experience. This Policy and Cookies Statement
              explains how we collect, use, and store your information when you access or use
              our website, mobile applications, and other digital services (collectively, the
              "Platform"), and how we use cookies and similar technologies.
            </p>
            <p>By using our Platform, you agree to the terms described in this Policy and Cookies Statement.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader icon={Database} number="2" title="Information We Collect" />
          </CardHeader>
          <CardContent className="space-y-4 leading-relaxed">
            <p>
              Goldsainte respects your privacy and processes your personal data in accordance with
              applicable data protection laws, including GDPR, CCPA, and other relevant legislation.
            </p>
            <p>We may collect the following types of information:</p>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">Personal Information</h4>
                <p>Name, email, phone number, address, and payment details when you make a booking or register on our Platform.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Travel and Booking Data</h4>
                <p>Reservation details, preferences, past bookings, and interactions with our Platform.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Usage Data</h4>
                <p>Information about your visits to our Platform, including IP address, browser type, pages visited, and time spent.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader icon={Settings} number="3" title="How We Use Your Information" />
          </CardHeader>
          <CardContent className="space-y-3 leading-relaxed">
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and manage our services, including bookings, payments, and customer support</li>
              <li>Personalize your experience on our Platform, including recommendations and offers</li>
              <li>Communicate important updates, marketing, and promotions (with your consent where required)</li>
              <li>Improve our Platform, security, and business operations</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader icon={Users} number="4" title="Sharing Your Information" />
          </CardHeader>
          <CardContent className="space-y-3 leading-relaxed">
            <p>We may share your data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers and partners</strong> to facilitate bookings and travel experiences</li>
              <li><strong>Legal authorities</strong> if required by law or to protect our rights</li>
              <li><strong>Other entities within the Goldsainte group</strong> for operational purposes</li>
            </ul>
            <p>We never sell your personal information to third parties.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader icon={Cookie} number="5" title="Cookies &amp; Similar Technologies" />
          </CardHeader>
          <CardContent className="space-y-4 leading-relaxed">
            <p>
              Goldsainte uses cookies and similar technologies to enhance your experience on our
              Platform, analyze usage, and provide personalized content and advertising.
            </p>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">Strictly Necessary Cookies</h4>
                <p>Essential for Platform functionality, such as logging in, managing bookings, and ensuring security.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Performance and Analytics Cookies</h4>
                <p>Help us understand how visitors interact with our Platform to improve features and usability.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Functional Cookies</h4>
                <p>Remember preferences, language settings, and login information.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Advertising and Targeting Cookies</h4>
                <p>Deliver relevant promotions, measure ad effectiveness, and provide personalized offers.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Managing Cookies</h4>
                <p>
                  You can manage your cookie preferences through your browser settings. Note that
                  disabling certain cookies may affect the functionality and user experience of our
                  Platform.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Third-Party Cookies</h4>
                <p>
                  Some cookies are set by third-party partners for analytics, advertising, or social
                  media integration. We do not control these cookies, and their use is governed by
                  the third party's privacy policy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader icon={ShieldCheck} number="6" title="Your Rights (GDPR / CCPA)" />
          </CardHeader>
          <CardContent className="space-y-4 leading-relaxed">
            <p>
              You have rights over your personal data, including access, correction, deletion, and
              objection to processing. To exercise your rights, please contact our Data Protection
              Officer at:
            </p>
            <div className="bg-muted/50 p-4 rounded-lg space-y-1">
              <p className="font-semibold">Goldsainte Data Protection Officer</p>
              <p>850 New Burton Road, Suite 201</p>
              <p>Dover, DE 19904, County of Kent</p>
              <p>Email: <a href="mailto:privacy@goldsainte.com" className="text-[#0c4d47] underline">privacy@goldsainte.com</a></p>
            </div>
            <p>We process privacy rights requests within 30 days as required by GDPR and CCPA.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader icon={Lock} number="7" title="Data Security &amp; Retention" />
          </CardHeader>
          <CardContent className="space-y-3 leading-relaxed">
            <p>
              We apply industry-standard administrative, technical, and physical safeguards to
              protect your personal data, including encryption in transit and at rest, access
              controls, and regular security reviews. Payment card data is handled directly by our
              PCI-DSS compliant payment processor (Stripe) — we never see or store full card
              numbers.
            </p>
            <p>
              After account deletion, transactional records (bookings, payouts, tax filings) are
              retained per legal and tax requirements for the minimum period required by law.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader icon={RefreshCw} number="8" title="Updates to This Policy" />
          </CardHeader>
          <CardContent className="space-y-3 leading-relaxed">
            <p>
              Goldsainte may update this Policy and Cookies Statement periodically to reflect
              changes in our practices, technology, or legal requirements. The latest version will
              always be available on our Platform, and we encourage you to review it regularly.
            </p>
            <p className="text-muted-foreground">
              We will notify you of any material changes by posting a notice on our Platform or by
              sending you an email notification.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader icon={Mail} number="9" title="Contact Us" />
          </CardHeader>
          <CardContent className="space-y-4 leading-relaxed">
            <p>
              If you have questions or concerns about this Policy and Cookies Statement, or if you
              would like to exercise your privacy rights, please contact us at:
            </p>
            <div className="bg-primary/5 p-6 rounded-lg space-y-4">
              <h3 className="font-secondary text-xl font-semibold">Goldsainte</h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#0c4d47] mt-0.5 flex-shrink-0" />
                <div>
                  <p>850 New Burton Road, Suite 201</p>
                  <p>Dover, DE 19904</p>
                  <p>County of Kent</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#0c4d47] flex-shrink-0" />
                <a href="mailto:privacy@goldsainte.com" className="text-[#0c4d47] underline">privacy@goldsainte.com</a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-secondary text-xl font-semibold mb-4">Related Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/terms" className="text-[#0c4d47] hover:underline">Terms of Service</Link>
              <Link to="/dispute-resolution" className="text-[#0c4d47] hover:underline">Dispute Resolution</Link>
              <Link to="/about" className="text-[#0c4d47] hover:underline">About Goldsainte</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 rounded-full w-12 h-12 shadow-lg bg-[#0c4d47] hover:bg-[#0a3d39] text-white"
          size="icon"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
