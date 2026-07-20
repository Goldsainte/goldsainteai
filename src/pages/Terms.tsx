import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/BackButton';
import {
  ShieldCheck,
  FileText,
  Info,
  Users,
  CreditCard,
  Lock,
  AlertCircle,
  Plane,
  Car,
  Bus,
  Anchor,
  BookOpen,
  ArrowUp,
} from 'lucide-react';

const SectionHeader = ({
  icon: Icon,
  number,
  title,
}: {
  icon: typeof FileText;
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

export default function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>Terms of Service · Goldsainte</title>
        <meta
          name="description"
          content="Goldsainte Terms of Service — the legal agreement between you and Goldsainte AI, Inc. governing use of our travel marketplace."
        />
      </Helmet>

      <BackButton className="mb-6" />

      <header className="mb-10">
        <p className="text-[12.5px] uppercase tracking-[0.2em] text-[#7A7151] mb-2">Legal</p>
        <h1 className="font-secondary text-4xl text-[#0a2225] mb-3">
          Goldsainte Terms of Service
        </h1>
        <p className="text-sm text-[#4a4a4a]">Last updated: July 19, 2026</p>
      </header>

      <Alert className="mb-8">
        <FileText className="h-4 w-4" />
        <AlertDescription className="text-sm">
          These Terms of Service constitute a legal agreement between you and Goldsainte AI, Inc.
          By using our platform, you agree to be bound by these terms. Please read them carefully.
          If you do not agree, please do not use the service.
        </AlertDescription>
      </Alert>

      <Alert className="mb-8 border-[#C7A962]/40 bg-[#FDF9F0]">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <span className="font-semibold">Availability notice:</span> Trip bookings are not
          currently offered to residents of California, Florida, Hawaii, Iowa, or Washington,
          which require Seller of Travel registration. Residents of these states may not
          purchase trips on the Platform at this time. Creator services and travel guides are
          not affected. Your state of residence is collected at checkout to apply this policy.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {/* Section A: General Terms */}
        <Card>
          <CardHeader>
            <SectionHeader icon={FileText} number="A" title="General Terms" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8 leading-relaxed">
              <div id="a1">
                <h3 className="font-secondary text-xl font-semibold mb-3">A1. Definitions</h3>
                <p>Capitalized terms used throughout these Terms have specific meanings defined in the Goldsainte Dictionary at the end of this document.</p>
              </div>

              <div id="a2">
                <h3 className="font-secondary text-xl font-semibold mb-3">A2. About These Terms</h3>
                <p className="mb-3">These Terms govern your use of our Platform and the booking of Travel Experiences. By creating an Account or making a Booking, you agree to these Terms.</p>
                <p className="mb-3">We may update these Terms from time to time. We'll notify you of material changes, and your continued use of our Platform after such changes constitutes acceptance.</p>
                <p className="mb-3 font-semibold">IMPORTANT: Please read Section A20 carefully. It contains an arbitration agreement that affects your legal rights, including your right to file a lawsuit in court and to have a jury trial.</p>
              </div>

              <div id="a3">
                <h3 className="font-secondary text-xl font-semibold mb-3">A3. About Goldsainte</h3>
                <p className="mb-3">Goldsainte operates as a platform connecting travelers with Service Providers offering various Travel Experiences including accommodations, flights, car rentals, attractions, and transportation services.</p>
                <p className="mb-3"><strong>Seller of record:</strong> All bookable trips and travel packages on the marketplace are offered, sold, contracted, and fulfilled exclusively by independent travel agents or travel agencies authorized to sell travel; the selling agent or agency is the seller and merchant of record for those bookings. References on the Platform to “specialists” or “certified specialists” mean such independent travel agents or agencies. Creators are not sellers of travel: creators may publish digital guides and destination content, offer their own non-travel services (for which the creator is the seller of record), provide trip inspiration, and earn disclosed referral or affiliate compensation — creators do not offer, price, contract for, book, collect payment for, or fulfill travel services. In all cases, payments are processed by Stripe directly to the applicable seller's own Stripe account; Goldsainte provides the marketplace technology, collects a platform fee, and does not itself sell travel or hold your travel funds.</p>
                <p className="mb-3">Depending on the service:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Goldsainte B.V. facilitates bookings for accommodations, flights, and attractions</li>
                  <li>Goldsainte Transport Limited facilitates ground transportation bookings</li>
                </ul>
                <p className="mt-3">We act as an intermediary, not as the principal provider of travel services.</p>
              </div>

              <div id="a4">
                <h3 className="font-secondary text-xl font-semibold mb-3">A4. Our Platform</h3>
                <p className="mb-3">Our Platform allows you to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Search and compare Travel Experiences from various Service Providers</li>
                  <li>Read reviews from other travelers</li>
                  <li>Make bookings and manage your reservations</li>
                  <li>Save favorites and create collections</li>
                  <li>Communicate with Service Providers and travel agents</li>
                  <li>Access your booking history and travel documents</li>
                </ul>
                <p className="mt-3">You must be at least 18 years old to create an Account and make bookings.</p>
              </div>

              <div id="a5">
                <h3 className="font-secondary text-xl font-semibold mb-3">A5. Our Values</h3>
                <p className="mb-3">Goldsainte is committed to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Transparency in pricing and booking processes</li>
                  <li>Providing accurate information about Travel Experiences</li>
                  <li>Protecting your privacy and personal data</li>
                  <li>Ensuring accessibility for all travelers</li>
                  <li>Supporting sustainable and responsible travel</li>
                  <li>Maintaining high standards of customer service</li>
                </ul>
              </div>

              <div id="a6">
                <h3 className="font-secondary text-xl font-semibold mb-3">A6. Your Experience on Goldsainte</h3>
                <p className="mb-3"><strong>Creating an Account:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Provide accurate and complete information</li>
                  <li>Keep your account credentials secure</li>
                  <li>You are responsible for all activity under your Account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
                <p className="mb-3"><strong>Making Bookings:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Ensure all information provided is accurate</li>
                  <li>Review booking details carefully before confirming</li>
                  <li>You enter into a contract with the Service Provider (in most cases)</li>
                  <li>Follow the Service Provider's policies and requirements</li>
                </ul>
                <p className="mb-3"><strong>Acceptable Use:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the Platform only for lawful purposes</li>
                  <li>Do not engage in fraudulent activities</li>
                  <li>Do not attempt to manipulate reviews or ratings</li>
                  <li>Respect intellectual property rights</li>
                  <li>Do not use automated systems to scrape data</li>
                </ul>
              </div>

              <div id="a7">
                <h3 className="font-secondary text-xl font-semibold mb-3">A7. Prices and Payments</h3>
                <p className="mb-3"><strong>Pricing:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>All prices displayed include applicable taxes and fees unless stated otherwise</li>
                  <li>Prices are subject to availability and may change</li>
                  <li>Currency conversion rates may vary</li>
                  <li>Additional charges may apply at the Service Provider's location</li>
                </ul>
                <p className="mb-3"><strong>Payment:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payment is required at the time of booking unless otherwise specified</li>
                  <li>We accept major credit cards and other payment methods as displayed</li>
                  <li>Your payment card may be charged immediately or at a later date depending on the Service Provider's policies</li>
                  <li>You authorize the applicable seller to charge, via Stripe, the payment method provided for the total amount</li>
                </ul>
              </div>

              <div id="a8">
                <h3 className="font-secondary text-xl font-semibold mb-3">A8. Policies</h3>
                <p className="mb-3">Each Travel Experience is subject to specific policies including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Cancellation Policies:</strong> Terms under which you can cancel and receive a refund</li>
                  <li><strong>Modification Policies:</strong> Rules for changing your booking</li>
                  <li><strong>Check-in/Check-out:</strong> Timing requirements for accommodations</li>
                  <li><strong>Baggage Policies:</strong> Allowances and restrictions for flights</li>
                  <li><strong>Age Requirements:</strong> Minimum age for rentals or activities</li>
                  <li><strong>Special Requirements:</strong> Documentation, health requirements, etc.</li>
                </ul>
                <p className="mt-3">Always review the specific policies for your booking before confirming your reservation.</p>
              </div>

              <div id="a9">
                <h3 className="font-secondary text-xl font-semibold mb-3">A9. Privacy and Cookies</h3>
                <p className="mb-3">We collect and process your personal data in accordance with our Privacy Policy. By using our Platform, you consent to such collection and use.</p>
                <p className="mb-3">We use cookies and similar technologies to enhance your experience. You can manage your cookie preferences through your browser settings or our cookie consent tool.</p>
              </div>

              <div id="a10">
                <h3 className="font-secondary text-xl font-semibold mb-3">A10. Accessibility Requests</h3>
                <p className="mb-3">We are committed to making travel accessible for everyone. If you have specific accessibility needs:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Contact us before booking to discuss your requirements</li>
                  <li>Verify that the Service Provider can accommodate your needs</li>
                  <li>Provide detailed information about required accommodations</li>
                  <li>Inform Service Providers directly of your needs upon arrival</li>
                </ul>
                <p className="mt-3">While we strive to help, ultimate responsibility for accommodations lies with the Service Provider.</p>
              </div>

              <div id="a12">
                <h3 className="font-secondary text-xl font-semibold mb-3">A12. Insurance</h3>
                <p className="mb-3">We strongly recommend purchasing travel insurance to protect against:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Trip cancellations or interruptions</li>
                  <li>Medical emergencies</li>
                  <li>Lost or delayed baggage</li>
                  <li>Travel delays</li>
                  <li>Other unforeseen circumstances</li>
                </ul>
                <p className="mt-3">Insurance options may be offered during the booking process. Review policy terms carefully before purchasing.</p>
              </div>

              <div id="a13">
                <h3 className="font-secondary text-xl font-semibold mb-3">A13. Goldsainte Rewards &amp; Creator Incentives</h3>
                <p className="mb-3">Our rewards program offers benefits to frequent users and content creators:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Rewards Points:</strong> Earn points on eligible bookings</li>
                  <li><strong>Creator Benefits:</strong> Special incentives for travel influencers and content creators</li>
                  <li><strong>Redemption:</strong> Use rewards for discounts on future bookings</li>
                  <li><strong>Expiration:</strong> Points may expire according to program terms</li>
                </ul>
                <p className="mt-3">Program terms are subject to change. Full program rules are available in your Account settings.</p>
              </div>

              <div id="a14">
                <h3 className="font-secondary text-xl font-semibold mb-3">A14. Wallet, Credits &amp; Payments</h3>
                <p className="mb-3">Your Goldsainte Wallet may contain:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Travel Credits:</strong> Credits from refunds, cancellations, or promotions</li>
                  <li><strong>Cash Credits:</strong> Monetary credits that can be applied to bookings</li>
                  <li><strong>Credit Card Cashback:</strong> Cashback from partner credit cards</li>
                </ul>
                <p className="mt-3 mb-3"><strong>Using Credits:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Credits are automatically applied at checkout unless you opt out</li>
                  <li>Credits may have expiration dates</li>
                  <li>Credits are non-transferable</li>
                  <li>Some credits may have usage restrictions</li>
                </ul>
              </div>

              <div id="a15">
                <h3 className="font-secondary text-xl font-semibold mb-3">A15. Intellectual Property Rights</h3>
                <p className="mb-3">All content on our Platform, including text, graphics, logos, images, and software, is owned by Goldsainte or our licensors and protected by intellectual property laws.</p>
                <p className="mb-3"><strong>You may not:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Copy, reproduce, or distribute Platform content without permission</li>
                  <li>Use our trademarks or branding without authorization</li>
                  <li>Modify or create derivative works from our content</li>
                  <li>Use automated systems to scrape or extract data</li>
                </ul>
                <p className="mt-3"><strong>User-Generated Content:</strong> When you post reviews, photos, or other content, you grant us a non-exclusive license to use, display, and distribute that content on our Platform.</p>
              </div>

              <div id="a16">
                <h3 className="font-secondary text-xl font-semibold mb-3">A16. Customer Support &amp; Complaints</h3>
                <p className="mb-3">We provide customer support through:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>24/7 customer service hotline</li>
                  <li>Email support</li>
                  <li>In-app messaging</li>
                  <li>Help center with FAQs</li>
                </ul>
                <p className="mb-3"><strong>Filing a Complaint:</strong></p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Contact us within a reasonable time after the issue occurs</li>
                  <li>Provide booking details and a clear description of the problem</li>
                  <li>Include any supporting documentation (photos, receipts, etc.)</li>
                  <li>We will investigate and respond within 10 business days</li>
                </ol>
                <p className="mt-3">If we cannot resolve your complaint to your satisfaction, you may have recourse through arbitration (see Section A20) or other dispute resolution mechanisms.</p>
              </div>

              <div id="a17">
                <h3 className="font-secondary text-xl font-semibold mb-3">A17. Communication with Service Providers</h3>
                <p className="mb-3">After booking, you may need to communicate directly with Service Providers regarding:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Special requests or requirements</li>
                  <li>Changes to your booking</li>
                  <li>Issues during your stay or service</li>
                  <li>Specific policies or procedures</li>
                </ul>
                <p className="mt-3">We provide Service Provider contact information in your Booking Confirmation. While we facilitate initial bookings, direct communication with Service Providers is often necessary for service-related matters.</p>
              </div>

              <div id="a18">
                <h3 className="font-secondary text-xl font-semibold mb-3">A18. Measures Against Unacceptable Behavior</h3>
                <p className="mb-3">We maintain high standards for behavior on our Platform and during travel. Unacceptable behavior includes:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Harassment, discrimination, or abusive language</li>
                  <li>Fraudulent activities or identity theft</li>
                  <li>Manipulation of reviews or ratings</li>
                  <li>Damage to property or theft</li>
                  <li>Violation of laws or regulations</li>
                  <li>Breach of these Terms or Service Provider policies</li>
                </ul>
                <p className="mb-3"><strong>Consequences may include:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Suspension or termination of your Account</li>
                  <li>Cancellation of bookings without refund</li>
                  <li>Legal action</li>
                  <li>Reporting to authorities</li>
                  <li>Permanent ban from the Platform</li>
                </ul>
              </div>

              <div id="a19">
                <h3 className="font-secondary text-xl font-semibold mb-3">A19. Limitation of Liability</h3>
                <p className="mb-3">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Goldsainte acts as an intermediary and is not responsible for the acts or omissions of Service Providers</li>
                  <li>We do not guarantee the accuracy of all information provided by Service Providers</li>
                  <li>We are not liable for delays, cancellations, or changes made by Service Providers</li>
                  <li>We are not responsible for loss, injury, or damage occurring during Travel Experiences</li>
                  <li>Our total liability to you for any claim is limited to the amount you paid for the relevant booking</li>
                </ul>
                <p className="mb-3"><strong>Exceptions:</strong> Nothing in these Terms limits liability for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Death or personal injury caused by our negligence</li>
                  <li>Fraud or fraudulent misrepresentation</li>
                  <li>Any liability that cannot be excluded by law</li>
                </ul>
              </div>

              <div id="a20">
                <h3 className="font-secondary text-xl font-semibold mb-3">A20. Arbitration Agreement</h3>
                <div className="bg-muted/50 p-6 rounded-lg border mb-6">
                  <p className="font-semibold text-lg mb-3">IMPORTANT: PLEASE REVIEW CAREFULLY</p>
                  <p>This section contains an arbitration agreement and class action waiver that affect your legal rights. By using our Platform, you agree to resolve disputes through binding arbitration rather than in court, and you waive your right to participate in class actions.</p>
                </div>

                <h4 className="text-lg font-semibold mb-3 mt-6">Applicability</h4>
                <p className="mb-3">This Arbitration Agreement applies to any dispute, claim, or controversy arising out of or relating to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>These Terms</li>
                  <li>Your use of the Platform</li>
                  <li>Any bookings made through the Platform</li>
                  <li>Our relationship with you</li>
                </ul>

                <h4 className="text-lg font-semibold mb-3 mt-6">Internal Review Procedure</h4>
                <p className="mb-3">Before initiating arbitration, you must first contact our Customer Service department to attempt to resolve the dispute informally. Provide:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your name and contact information</li>
                  <li>A description of the dispute</li>
                  <li>The relief you seek</li>
                </ul>
                <p className="mt-3">We will attempt to resolve the dispute within 60 days. If unresolved, either party may initiate arbitration.</p>

                <h4 className="text-lg font-semibold mb-3 mt-6">Waiver of Jury Trial</h4>
                <p className="mb-3">YOU AND GOLDSAINTE WAIVE ANY CONSTITUTIONAL AND STATUTORY RIGHTS TO SUE IN COURT AND HAVE A TRIAL IN FRONT OF A JUDGE OR JURY. You and Goldsainte are instead electing to have claims and disputes resolved by arbitration.</p>

                <h4 className="text-lg font-semibold mb-3 mt-6">Waiver of Class Action</h4>
                <p className="mb-3">YOU AND GOLDSAINTE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE ACTION.</p>
                <p>Unless both you and Goldsainte agree otherwise, the arbitrator may not consolidate more than one person's claims and may not otherwise preside over any form of representative or class proceeding.</p>

                <h4 className="text-lg font-semibold mb-3 mt-6">Rules and Forum</h4>
                <p className="mb-3">The arbitration will be administered by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules. You can find the AAA Rules and forms at www.adr.org or by calling 1-800-778-7879.</p>
                <p>The arbitration may be conducted in person, through document submission, by phone, or online.</p>

                <h4 className="text-lg font-semibold mb-3 mt-6">Arbitrator</h4>
                <p>The arbitrator will be either a retired judge or an attorney licensed to practice law and will be selected according to AAA Rules. The arbitrator will apply applicable substantive law and is bound by these Terms.</p>

                <h4 className="text-lg font-semibold mb-3 mt-6">Authority</h4>
                <p className="mb-3">The arbitrator has exclusive authority to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Resolve all disputes arising out of or relating to these Terms</li>
                  <li>Determine arbitrability of disputes</li>
                  <li>Award damages and other relief</li>
                </ul>
                <p className="mt-3">The arbitrator's decision is final and binding, subject only to limited review by courts as provided by law.</p>

                <h4 className="text-lg font-semibold mb-3 mt-6">Attorneys' Fees and Costs</h4>
                <p>In any arbitration, the prevailing party will be entitled to an award of reasonable attorneys' fees and costs, except where prohibited by law.</p>

                <h4 className="text-lg font-semibold mb-3 mt-6">Batch Arbitration</h4>
                <p>If 25 or more similar claims are asserted against Goldsainte by the same or coordinated counsel, they will be resolved in batches according to AAA's Supplementary Rules for Multiple Case Filings.</p>

                <h4 className="text-lg font-semibold mb-3 mt-6">Invalidity, Expiration, or Severability</h4>
                <p>If any portion of this Arbitration Agreement is found to be invalid or unenforceable, the remaining portions will remain in full force and effect. If the class action waiver is found invalid, the entire Arbitration Agreement will be unenforceable.</p>

                <h4 className="text-lg font-semibold mb-3 mt-6">30-Day Right to Opt Out</h4>
                <p className="mb-3">You have the right to opt out of this Arbitration Agreement by sending written notice within 30 days of first accepting these Terms. Send notice to:</p>
                <p className="pl-6 mb-3">Goldsainte Legal Department<br />[Address]<br />Email: support@goldsainte.com</p>
                <p>Your notice must include your name, address, and a clear statement that you wish to opt out. If you opt out, all other parts of these Terms will continue to apply.</p>

                <h4 className="text-lg font-semibold mb-3 mt-6">Modification</h4>
                <p>Notwithstanding any provision in these Terms to the contrary, we agree that if Goldsainte makes any material change to this Arbitration Agreement, you may reject the change by sending written notice within 30 days of the change, in which case your Account will be subject to the arbitration agreement in effect prior to the change.</p>

                <h4 className="text-lg font-semibold mb-3 mt-6">Governing Courts and Law</h4>
                <p>These Terms are governed by the laws of [Jurisdiction], without regard to conflict of law principles. Any disputes not subject to arbitration will be resolved in the courts of [Jurisdiction], and you consent to the personal jurisdiction of such courts.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section B */}
        <Card>
          <CardHeader>
            <SectionHeader icon={Users} number="B" title="Accommodations" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8 leading-relaxed">
              <div id="b1">
                <h3 className="font-secondary text-xl font-semibold mb-3">B1. Scope of this section</h3>
                <p>This section contains specific terms for Accommodation services. It applies in addition to Section A (which applies to all Travel Experiences).</p>
              </div>
              <div id="b2">
                <h3 className="font-secondary text-xl font-semibold mb-3">B2. Contractual relationship</h3>
                <p className="mb-3">When you book an Accommodation, you're entering into a contract directly with the Accommodation provider (hotel, host, property owner, etc.). Goldsainte facilitates the booking but is not a party to the contract between you and the Accommodation provider.</p>
                <p>You agree to comply with these Terms and the Accommodation provider's policies.</p>
              </div>
              <div id="b3">
                <h3 className="font-secondary text-xl font-semibold mb-3">B3. What Goldsainte will do</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide the Platform to search, compare, and book Accommodations</li>
                  <li>Display accurate information as provided by Accommodation providers</li>
                  <li>Process your payment securely</li>
                  <li>Send you a Booking Confirmation with all relevant details</li>
                  <li>Provide Accommodation provider contact information</li>
                  <li>Offer customer support for booking-related issues</li>
                </ul>
              </div>
              <div id="b4">
                <h3 className="font-secondary text-xl font-semibold mb-3">B4. What you need to do</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Review Accommodation details, photos, amenities, and policies carefully</li>
                  <li>Provide accurate guest information and contact details</li>
                  <li>Arrive during stated check-in hours (contact provider if arriving outside hours)</li>
                  <li>Present valid identification and payment card at check-in</li>
                  <li>Follow Accommodation rules and policies</li>
                  <li>Treat the property and staff with respect</li>
                  <li>Leave the property in reasonable condition</li>
                  <li>Check out by the stated check-out time</li>
                  <li>Notify the provider and us immediately of any issues during your stay</li>
                </ul>
              </div>
              <div id="b5">
                <h3 className="font-secondary text-xl font-semibold mb-3">B5. Price and payment</h3>
                <p className="mb-3"><strong>What's Included:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Room rate for specified dates</li>
                  <li>Applicable taxes (unless stated otherwise)</li>
                  <li>Any included amenities or services listed in booking</li>
                </ul>
                <p className="mb-3"><strong>What May Be Extra:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Resort fees or destination charges</li>
                  <li>City/tourism taxes collected at property</li>
                  <li>Parking fees</li>
                  <li>Minibar, room service, or other incidentals</li>
                  <li>Early check-in or late check-out fees</li>
                  <li>Damage deposits</li>
                </ul>
                <p className="mb-3"><strong>Payment Timing:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Pay Now:</strong> Payment charged at time of booking</li>
                  <li><strong>Pay Later:</strong> Payment charged closer to check-in or at property (as specified)</li>
                  <li>The Accommodation provider may pre-authorize or charge your card before arrival</li>
                </ul>
              </div>
              <div id="b6">
                <h3 className="font-secondary text-xl font-semibold mb-3">B6. Amendments, cancellations, and refunds</h3>
                <p className="mb-3"><strong>Cancellation Policies:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Free Cancellation:</strong> Cancel by specified date/time for full refund</li>
                  <li><strong>Partially Refundable:</strong> Cancellation fee or one night charged</li>
                  <li><strong>Non-Refundable:</strong> No refund if you cancel</li>
                </ul>
                <p className="mb-3">The specific cancellation policy for your booking is shown before you confirm and in your Booking Confirmation.</p>
                <p className="mb-3"><strong>Making Changes:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Contact us or the Accommodation provider to request changes</li>
                  <li>Changes are subject to availability and may incur fees</li>
                  <li>Some bookings cannot be modified</li>
                </ul>
                <p className="mb-3"><strong>No-Shows:</strong></p>
                <p>If you don't arrive and haven't cancelled, you'll be charged the full booking amount (no-show fee).</p>
                <p className="mb-3 mt-4"><strong>Provider Cancellations:</strong></p>
                <p>If the Accommodation provider cancels your booking, we'll help you find alternative accommodations or provide a full refund.</p>
              </div>
              <div id="b7">
                <h3 className="font-secondary text-xl font-semibold mb-3">B7. What else do you need to know?</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Special Requests:</strong> We'll pass requests to providers, but they cannot be guaranteed</li>
                  <li><strong>Group Bookings:</strong> Multiple rooms may have separate policies</li>
                  <li><strong>Children &amp; Extra Guests:</strong> Additional fees may apply; check property policies</li>
                  <li><strong>Pets:</strong> Contact property in advance if traveling with pets</li>
                  <li><strong>Accessibility:</strong> Verify accessibility features meet your needs before booking</li>
                  <li><strong>Reviews:</strong> Reviews reflect individual experiences and opinions</li>
                  <li><strong>Photos:</strong> Photos are representative and may not reflect your specific room</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section C */}
        <Card>
          <CardHeader>
            <SectionHeader icon={Info} number="C" title="Attractions" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8 leading-relaxed">
              <div id="c1">
                <h3 className="font-secondary text-xl font-semibold mb-3">C1. Scope of this section</h3>
                <p>This section contains specific terms for Attraction bookings (tours, activities, attractions, experiences). It applies in addition to Section A (which applies to all Travel Experiences).</p>
              </div>
              <div id="c2">
                <h3 className="font-secondary text-xl font-semibold mb-3">C2. Contractual relationship</h3>
                <p>When you book an Attraction, you're entering into a contract with the Service Provider or Third-Party Aggregator. Our Terms govern the booking process, but you're also subject to the Service Provider's terms and conditions.</p>
              </div>
              <div id="c3">
                <h3 className="font-secondary text-xl font-semibold mb-3">C3. What Goldsainte will do</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide the Platform to search and book Attractions</li>
                  <li>Process your booking and payment</li>
                  <li>Send you a Booking Confirmation with voucher or e-ticket</li>
                  <li>Provide Service Provider contact information</li>
                  <li>Offer customer support for booking issues</li>
                </ul>
              </div>
              <div id="c4">
                <h3 className="font-secondary text-xl font-semibold mb-3">C4. What you need to do</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Review Attraction details, duration, meeting point, and requirements</li>
                  <li>Arrive at the meeting point on time</li>
                  <li>Present your voucher/e-ticket (printed or on mobile device)</li>
                  <li>Bring required items (ID, confirmation number, appropriate clothing/gear)</li>
                  <li>Meet any age, height, health, or fitness requirements</li>
                  <li>Follow safety instructions and Service Provider rules</li>
                  <li>Notify the Service Provider of any relevant medical conditions or special needs</li>
                </ul>
              </div>
              <div id="c5">
                <h3 className="font-secondary text-xl font-semibold mb-3">C5. Price and payment</h3>
                <p className="mb-3">Price typically includes:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Activity or attraction admission</li>
                  <li>Items listed as "included" in the description</li>
                  <li>Applicable taxes</li>
                </ul>
                <p className="mb-3">May not include:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Gratuities/tips</li>
                  <li>Food and beverages (unless specified)</li>
                  <li>Transportation to meeting point</li>
                  <li>Personal expenses</li>
                  <li>Optional extras or upgrades</li>
                </ul>
              </div>
              <div id="c6">
                <h3 className="font-secondary text-xl font-semibold mb-3">C6. Amendments, cancellations, and refunds</h3>
                <p className="mb-3">Cancellation policies vary by Attraction:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Flexible:</strong> Cancel up to 24-48 hours before for full refund</li>
                  <li><strong>Moderate:</strong> Cancel within specific timeframe for partial refund</li>
                  <li><strong>Strict:</strong> Non-refundable or very limited cancellation window</li>
                </ul>
                <p className="mb-3">Check your specific booking's cancellation policy in your Booking Confirmation.</p>
                <p className="mb-3"><strong>Weather or Operational Changes:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Service Provider may cancel due to weather, safety concerns, or insufficient participants</li>
                  <li>You'll be offered an alternative date or full refund</li>
                  <li>If you choose not to participate due to weather, standard cancellation policy applies</li>
                </ul>
              </div>
              <div id="c7">
                <h3 className="font-secondary text-xl font-semibold mb-3">C7. What else do you need to know?</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Confirmation:</strong> Some Attractions require confirmation from provider; this may take up to 48 hours</li>
                  <li><strong>Timing:</strong> Durations are approximate; actual time may vary</li>
                  <li><strong>Accessibility:</strong> Not all Attractions are wheelchair accessible; check details carefully</li>
                  <li><strong>Age Restrictions:</strong> Some activities have minimum/maximum age requirements</li>
                  <li><strong>Health &amp; Safety:</strong> You participate at your own risk; follow all safety guidelines</li>
                  <li><strong>Photography:</strong> Photo packages may be offered separately</li>
                  <li><strong>Language:</strong> Tours may be offered in specific languages; verify before booking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section D */}
        <Card>
          <CardHeader>
            <SectionHeader icon={Car} number="D" title="Car Rentals" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8 leading-relaxed">
              <div id="d1">
                <h3 className="font-secondary text-xl font-semibold mb-3">D1. Scope of this section</h3>
                <p>This section contains specific terms for Car Rental bookings. It applies in addition to Section A (which applies to all Travel Experiences).</p>
              </div>
              <div id="d2">
                <h3 className="font-secondary text-xl font-semibold mb-3">D2. Contractual relationship</h3>
                <p className="mb-3">When you book a Car Rental, you're entering into a contract directly with the car rental company. At pick-up, you'll sign a Rental Agreement with the Service Provider that governs your rental.</p>
                <p>Our Terms govern the booking process, but the Rental Agreement takes precedence for the actual rental.</p>
              </div>
              <div id="d3">
                <h3 className="font-secondary text-xl font-semibold mb-3">D3. What Goldsainte will do</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide the Platform to search and compare Car Rentals</li>
                  <li>Process your booking</li>
                  <li>Send you a Booking Confirmation with rental details</li>
                  <li>Provide Service Provider contact and location information</li>
                  <li>Facilitate communication between you and the rental company</li>
                </ul>
              </div>
              <div id="d4">
                <h3 className="font-secondary text-xl font-semibold mb-3">D4. What you need to do</h3>
                <p className="mb-3"><strong>Before Pick-Up:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Ensure the Main Driver meets age requirements (usually 21-25+)</li>
                  <li>Verify the Main Driver has a valid driver's license (held for minimum period, usually 1-2 years)</li>
                  <li>Check if an International Driving Permit is required</li>
                  <li>Have a valid credit card in the Main Driver's name (debit cards often not accepted)</li>
                </ul>
                <p className="mb-3"><strong>At Pick-Up:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Present your Booking Confirmation</li>
                  <li>Show valid driver's license and credit card</li>
                  <li>Review and sign the Rental Agreement</li>
                  <li>Inspect the vehicle thoroughly and note any existing damage</li>
                  <li>Understand the fuel policy</li>
                  <li>Confirm insurance coverage</li>
                </ul>
                <p className="mb-3"><strong>During Rental:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Only authorized drivers may operate the vehicle</li>
                  <li>Follow all traffic laws and regulations</li>
                  <li>Do not use the vehicle for illegal purposes</li>
                  <li>Do not take the vehicle across borders without permission</li>
                  <li>Notify the rental company immediately of accidents or mechanical issues</li>
                </ul>
                <p className="mb-3"><strong>At Return:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Return the vehicle by the agreed time to avoid additional charges</li>
                  <li>Return with the agreed fuel level</li>
                  <li>Return to the agreed location</li>
                  <li>Remove all personal belongings</li>
                </ul>
              </div>
              <div id="d5">
                <h3 className="font-secondary text-xl font-semibold mb-3">D5. Price and payment</h3>
                <p className="mb-3"><strong>What's Typically Included:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Vehicle rental for specified period</li>
                  <li>Specified mileage (unlimited or per-day allowance)</li>
                  <li>Basic insurance (varies by location and provider)</li>
                  <li>Taxes included in display price</li>
                </ul>
                <p className="mb-3"><strong>What May Be Extra:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Additional drivers (fee per driver)</li>
                  <li>Young driver surcharge (under 25)</li>
                  <li>GPS navigation system</li>
                  <li>Child seats</li>
                  <li>Additional insurance coverage</li>
                  <li>Fuel (if not returned with agreed level)</li>
                  <li>Toll charges and parking fees</li>
                  <li>One-way rental fees (if dropping off at different location)</li>
                  <li>After-hours pick-up/drop-off fees</li>
                </ul>
                <p className="mb-3"><strong>Payment:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Prepaid:</strong> Pay in full at booking</li>
                  <li><strong>Pay at Pick-Up:</strong> Pay rental company directly</li>
                  <li>Security deposit will be held on Main Driver's credit card (amount varies)</li>
                </ul>
              </div>
              <div id="d6">
                <h3 className="font-secondary text-xl font-semibold mb-3">D6. Amendments, cancellations, and refunds</h3>
                <p className="mb-3">Policies vary by rental company and booking type:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Free Cancellation:</strong> Cancel by specified date/time for full refund</li>
                  <li><strong>Prepaid Non-Refundable:</strong> Better rates but no refund if you cancel</li>
                  <li><strong>Pay at Pick-Up:</strong> Usually free cancellation until pick-up</li>
                </ul>
                <p className="mb-3"><strong>Changes:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Contact us to request changes to dates, location, or vehicle type</li>
                  <li>Changes subject to availability</li>
                  <li>Price may change based on new dates/location</li>
                </ul>
                <p className="mb-3"><strong>No-Shows:</strong></p>
                <p>If you don't pick up the vehicle and haven't cancelled, you'll be charged the full amount.</p>
              </div>
              <div id="d7">
                <h3 className="font-secondary text-xl font-semibold mb-3">D7. What else do you need to know?</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Insurance:</strong> Review coverage carefully; your personal auto insurance or credit card may provide coverage</li>
                  <li><strong>Vehicle Upgrades:</strong> Rental company may offer upgrades at pick-up</li>
                  <li><strong>Damage &amp; Theft:</strong> You're responsible for damage or theft unless covered by insurance</li>
                  <li><strong>Traffic Violations:</strong> You're responsible for all fines and violations</li>
                  <li><strong>Cross-Border Travel:</strong> Requires permission; additional fees and insurance apply</li>
                  <li><strong>Vehicle Availability:</strong> Specific model not guaranteed; you'll receive same category or better</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section E */}
        <Card>
          <CardHeader>
            <SectionHeader icon={Plane} number="E" title="Flights" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8 leading-relaxed">
              <div id="e1">
                <h3 className="font-secondary text-xl font-semibold mb-3">E1. Scope of this section</h3>
                <p>This section contains specific terms for Flight bookings. It applies in addition to Section A (which applies to all Travel Experiences).</p>
              </div>
              <div id="e2">
                <h3 className="font-secondary text-xl font-semibold mb-3">E2. Contractual relationship</h3>
                <p className="mb-3">When you book a Flight, you're entering into a Contract of Carriage directly with the airline(s). Goldsainte acts as an agent facilitating your booking.</p>
                <p className="mb-3">The airline's terms and conditions govern your flight. You must comply with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>These Terms (for the booking process)</li>
                  <li>The airline's Contract of Carriage</li>
                  <li>The airline's policies and procedures</li>
                  <li>Applicable aviation regulations</li>
                </ul>
              </div>
              <div id="e3">
                <h3 className="font-secondary text-xl font-semibold mb-3">E3. What Goldsainte will do</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide the Platform to search and compare Flights</li>
                  <li>Process your booking with the airline(s)</li>
                  <li>Send you a Booking Confirmation with flight details and ticket number(s)</li>
                  <li>Provide airline contact information</li>
                  <li>Facilitate communication for booking-related issues</li>
                  <li>Assist with certain booking changes (subject to airline policies)</li>
                </ul>
              </div>
              <div id="e4">
                <h3 className="font-secondary text-xl font-semibold mb-3">E4. What you need to do</h3>
                <p className="mb-3"><strong>When Booking:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Enter passenger names EXACTLY as they appear on travel documents</li>
                  <li>Verify all flight details (dates, times, airports) before confirming</li>
                  <li>Provide accurate contact information</li>
                  <li>Review baggage allowances and restrictions</li>
                  <li>Check visa and documentation requirements for your destination</li>
                </ul>
                <p className="mb-3"><strong>Before Travel:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Check in online (usually 24-48 hours before departure)</li>
                  <li>Verify flight status before going to airport</li>
                  <li>Arrive at airport with sufficient time (usually 2-3 hours for international)</li>
                  <li>Bring valid travel documents (passport, visa, etc.)</li>
                  <li>Meet health requirements (vaccinations, testing, etc.)</li>
                </ul>
                <p className="mb-3"><strong>At Airport:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Complete check-in if not done online</li>
                  <li>Check bags according to airline policy</li>
                  <li>Proceed through security screening</li>
                  <li>Arrive at departure gate on time</li>
                  <li>Have boarding pass and ID ready</li>
                </ul>
                <p className="mb-3"><strong>During Flight:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Follow crew instructions</li>
                  <li>Comply with safety regulations</li>
                  <li>Respect other passengers and crew</li>
                  <li>Do not engage in disruptive behavior</li>
                </ul>
              </div>
              <div id="e5">
                <h3 className="font-secondary text-xl font-semibold mb-3">E5. Price and payment</h3>
                <p className="mb-3"><strong>What's Typically Included:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Base airfare</li>
                  <li>Mandatory taxes and fees</li>
                  <li>Standard seat (seat selection may cost extra)</li>
                  <li>Personal item (size restrictions apply)</li>
                </ul>
                <p className="mb-3"><strong>What May Be Extra:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Checked baggage (fees vary by airline and route)</li>
                  <li>Seat selection</li>
                  <li>Priority boarding</li>
                  <li>In-flight meals and beverages</li>
                  <li>Wi-Fi and entertainment</li>
                  <li>Changes and cancellations</li>
                  <li>Travel insurance</li>
                </ul>
                <p className="mb-3"><strong>Fare Types:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Basic Economy:</strong> Lowest price, most restrictions, no changes</li>
                  <li><strong>Main Cabin/Economy:</strong> Standard fare with some flexibility</li>
                  <li><strong>Premium Economy:</strong> Enhanced comfort and amenities</li>
                  <li><strong>Business/First Class:</strong> Premium service and flexibility</li>
                </ul>
              </div>
              <div id="e6">
                <h3 className="font-secondary text-xl font-semibold mb-3">E6. Amendments, cancellations, and refunds</h3>
                <p className="mb-3">Policies vary significantly by airline and fare type:</p>
                <p className="mb-3"><strong>Name Changes:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Most airlines DO NOT allow name changes</li>
                  <li>Minor corrections (misspellings) may be allowed</li>
                  <li>Fees and restrictions apply</li>
                </ul>
                <p className="mb-3"><strong>Date/Time Changes:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Depends on fare type purchased</li>
                  <li>Basic economy often not changeable</li>
                  <li>Change fees typically $50-$300+ per ticket</li>
                  <li>Plus any fare difference</li>
                </ul>
                <p className="mb-3"><strong>Cancellations:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Refundable Tickets:</strong> Can be cancelled for refund (minus any fees)</li>
                  <li><strong>Non-Refundable Tickets:</strong> Cancellation results in credit for future travel (with fees and restrictions)</li>
                  <li><strong>24-Hour Rule:</strong> U.S. regulations allow free cancellation within 24 hours of booking if booked 7+ days before departure</li>
                </ul>
                <p className="mb-3"><strong>Airline-Initiated Changes:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Airlines may change flight times or routes</li>
                  <li>Significant changes may entitle you to a refund</li>
                  <li>Contact airline or us immediately if you receive a schedule change notice</li>
                </ul>
                <p className="mb-3"><strong>Missed Flights:</strong></p>
                <p>If you miss your flight, contact the airline immediately. They may rebook you on the next available flight (fees may apply), but there's no guarantee.</p>
              </div>
              <div id="e7">
                <h3 className="font-secondary text-xl font-semibold mb-3">E7. What else do you need to know?</h3>
                <h4 className="text-lg font-semibold mb-2 mt-4">Code Share</h4>
                <p>Some flights are operated by partner airlines (code share). Your ticket may show one airline, but another operates the flight. The operating airline's policies apply.</p>
                <h4 className="text-lg font-semibold mb-2 mt-4">Prohibited Practices</h4>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Hidden City Ticketing:</strong> Booking a flight with a connection and getting off at the connection point is prohibited and may result in penalties</li>
                  <li><strong>Back-to-Back Ticketing:</strong> Using two one-way tickets to avoid restrictions is prohibited</li>
                  <li><strong>Throwaway Ticketing:</strong> Not using return portion to get a cheaper fare is prohibited</li>
                </ul>
                <h4 className="text-lg font-semibold mb-2 mt-4">Overbooking</h4>
                <p className="mb-3">Airlines may oversell flights. If denied boarding due to overbooking, you may be entitled to compensation under applicable regulations (e.g., EU 261, U.S. DOT rules).</p>
                <h4 className="text-lg font-semibold mb-2 mt-4">Use of Flight Segments</h4>
                <p className="mb-3">You must use flight segments in the order ticketed. If you miss a segment, subsequent segments may be cancelled by the airline.</p>
                <h4 className="text-lg font-semibold mb-2 mt-4">One-way vs. Round-trip Tickets</h4>
                <p className="mb-3">Some round-trip tickets have restrictions requiring completion of all segments. Verify requirements before booking.</p>
                <h4 className="text-lg font-semibold mb-2 mt-4">International Travel</h4>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Passport must be valid for 6 months beyond return date</li>
                  <li>Visas may be required; check before booking</li>
                  <li>Health documentation may be required (vaccinations, testing)</li>
                  <li>Customs and immigration requirements apply</li>
                  <li>You're responsible for having proper documentation</li>
                </ul>
                <h4 className="text-lg font-semibold mb-2 mt-4">Additional Charges and Fees</h4>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Airlines charge separately for many services</li>
                  <li>Baggage fees, seat selection, food, etc.</li>
                  <li>Review airline's fee schedule</li>
                  <li>Some credit cards offer benefits that offset fees</li>
                </ul>
                <h4 className="text-lg font-semibold mb-2 mt-4">Boarding Requirements</h4>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Must present valid government-issued photo ID</li>
                  <li>International flights require passport</li>
                  <li>Name on ticket must match ID exactly</li>
                  <li>Arrive at gate before boarding cutoff time</li>
                </ul>
                <h4 className="text-lg font-semibold mb-2 mt-4">Dangerous Goods</h4>
                <p className="mb-3">Certain items are prohibited or restricted on aircraft:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Explosives, flammables, and hazardous materials</li>
                  <li>Lithium batteries (restrictions on quantity and placement)</li>
                  <li>Liquids over 3.4oz/100ml in carry-on (international)</li>
                  <li>Sharp objects and weapons</li>
                </ul>
                <h4 className="text-lg font-semibold mb-2 mt-4">EU Regulation 261/2004</h4>
                <p className="mb-3">For flights departing from EU or arriving in EU on EU carriers, you may be entitled to compensation for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Denied boarding (overbooking)</li>
                  <li>Cancellations (unless due to extraordinary circumstances)</li>
                  <li>Long delays (3+ hours)</li>
                </ul>
                <p className="mt-3">Compensation ranges from €250-€600 depending on distance and delay length. Contact the airline to file a claim.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section F */}
        <Card>
          <CardHeader>
            <SectionHeader icon={Bus} number="F" title="Private and Public Transportation" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8 leading-relaxed">
              <div id="f1">
                <h3 className="font-secondary text-xl font-semibold mb-3">F1. Scope of this section</h3>
                <p>This section contains the specific terms for Private and Public Transportation products and services. It applies in addition to Section A (which applies to all Travel Experiences).</p>
              </div>
              <div id="f2">
                <h3 className="font-secondary text-xl font-semibold mb-3">F2. Contractual relationship</h3>
                <p className="mb-3">When you pre-book Private or Public Transportation, your booking will be directly with the Service Provider or via a Third-Party Aggregator who will allocate your booking to a Service Provider. In all cases, our Terms will govern the booking process.</p>
                <p className="mb-3"><strong>Pre-Booked Private Transportation:</strong> You and the Service Provider both agree to comply with these Terms. By making a booking, you confirm that you have read and accepted the Service Provider or Third-Party Aggregator's terms (where applicable). Not all Service Providers have their own terms, but you're welcome to review all terms we've been provided.</p>
                <p><strong>Public Transportation:</strong> You'll be provided with the Service Provider's terms during the booking process. If there is any discrepancy between their terms and our Terms, their terms will apply.</p>
              </div>
              <div id="f3">
                <h3 className="font-secondary text-xl font-semibold mb-3">F3. What we will do</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Provide the Platform on which Service Providers can promote and sell their Travel Experiences, and you can search for, compare, and book them</li>
                  <li>Once you've made your booking, we'll give the Service Provider your details (e.g., your name, phone number, pick-up location)</li>
                </ul>
                <p className="mb-3"><strong>All Private Transportation:</strong> We'll give you the Service Provider's contact details.</p>
                <p className="mb-3"><strong>Pre-Booked Private Transportation:</strong> We'll ensure the Service Provider knows the size vehicle you've requested.</p>
                <p><strong>Public Transportation:</strong> We'll give you (or tell you how to collect) your ticket(s).</p>
              </div>
              <div id="f4">
                <h3 className="font-secondary text-xl font-semibold mb-3">F4. What you need to do</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Check your booking details carefully and provide all information we need to arrange your booking (requirements, contact details, etc.)</li>
                  <li>Ensure everyone in your group complies with our Terms and, if applicable, the Service Provider's terms you saw and accepted during booking. Breaches may result in:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Additional charges</li>
                      <li>Cancellation of your booking</li>
                      <li>Refusal of transport by the driver</li>
                    </ul>
                  </li>
                  <li>Keep in mind that estimated journey times don't account for traffic</li>
                </ul>
                <p className="mb-3"><strong>All Private Transportation:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Ensure all passengers are at the pick-up location on time</li>
                  <li>Have your phone switched on at pick-up to receive calls or texts from the driver. Messaging apps like WhatsApp or Viber may not be supported</li>
                </ul>
                <p className="mb-3"><strong>Pre-Booked Private Transportation (airport pick-up):</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Provide flight details at least 24 hours in advance. If the Service Provider cannot provide transport after a delay or cancellation, contact Customer Service</li>
                </ul>
                <p className="mb-3"><strong>Public Transportation:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Ensure all passengers arrive on time, leaving sufficient time to collect tickets</li>
                </ul>
                <p className="mb-3"><strong>Additional Requirements:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You must be 18+ to book; passengers under 18 must be accompanied by a responsible adult</li>
                  <li>Ensure no passenger behaves inappropriately or endangers anyone</li>
                  <li>Choose transportation suitable for party size, luggage, accessibility, etc.</li>
                </ul>
              </div>
              <div id="f5">
                <h3 className="font-secondary text-xl font-semibold mb-3">F5. Price and payment</h3>
                <p className="mb-3">Goldsainte Transport Limited will arrange payment. Refer to Section A8 ("Payment") for details.</p>
                <p className="mb-3"><strong>Pre-Booked Private Transportation:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Price includes tolls, congestion charges, taxes, and peak surcharges</li>
                  <li>Payment is taken at booking</li>
                  <li>Price for shared services is per seat</li>
                </ul>
                <p className="mb-3"><strong>Public Transportation:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Payment is taken when booking is confirmed</li>
                  <li>Tickets/e-tickets must be kept on you at all times</li>
                </ul>
                <p>The Service Provider/driver may charge extra if you request changes in person; they are not obliged to accommodate requests.</p>
              </div>
              <div id="f6">
                <h3 className="font-secondary text-xl font-semibold mb-3">F6. Amendments, cancellations, and refunds</h3>
                <h4 className="text-lg font-semibold mb-3 mt-4">Cancellation</h4>
                <p className="mb-3">In most cases:</p>
                <p className="mb-3"><strong>Pre-Booked Private Transportation:</strong> Cancel free up to 24 hours before pick-up (two hours in some cases; check your confirmation). Late cancellation = no refund.</p>
                <p className="mb-3"><strong>Public Transportation:</strong> No refund once booking is confirmed. Contact Customer Service if plans change.</p>
                <p className="mb-3">Service Provider or Third-Party Aggregator's cancellation policy takes precedence if different.</p>
                <p className="mb-3">Goldsainte or Service Provider may cancel with little or no notice in specific cases (e.g., insolvency, you breach Terms). Full refund if no alternative can be arranged.</p>
                <p className="mb-3">For Shared Pre-Booked Private Transportation, cancelling cancels all tickets.</p>
                <h4 className="text-lg font-semibold mb-3 mt-6">Amendments</h4>
                <ol className="list-decimal pl-6 space-y-2 mb-4">
                  <li><strong>Pre-Booked Private Transportation:</strong> Your confirmation email indicates how much notice is required for changes</li>
                  <li><strong>Public Transportation:</strong> Booking cannot be changed once confirmed</li>
                  <li>If we/Service Provider need to change your booking (e.g., strike), we'll notify you. Refunds may apply if you cancel under these circumstances</li>
                  <li>For multiple tickets on Shared Pre-Booked Private Transportation, amendments apply to all tickets</li>
                </ol>
                <h4 className="text-lg font-semibold mb-3 mt-6">Refunds</h4>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Apply for a refund in writing within 14 days after pick-up time</li>
                  <li>Refunds may take up to 5 business days</li>
                  <li><strong>All Private Transportation:</strong> If the driver is late, you can request a refund; we'll investigate</li>
                  <li>No refund if issues occur due to: incorrect details, late passengers, unreasonable change requests, or inability to contact you</li>
                </ol>
              </div>
              <div id="f7">
                <h3 className="font-secondary text-xl font-semibold mb-3">F7. What else do you need to know?</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Pre-Booked Private Transportation:</strong> Review your confirmation for driver waiting times</li>
                  <li><strong>Repair or cleaning fees:</strong> You are responsible for any unreasonable damage or cleaning costs</li>
                  <li><strong>How we work:</strong> See How We Work for reviews, ranking, and monetization info</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section G */}
        <Card>
          <CardHeader>
            <SectionHeader icon={Anchor} number="G" title="Cruises" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 leading-relaxed">
              <p>Goldsainte does not resell, offer, or provide cruises on our own behalf. Cruises are offered and sold by World Travel Holdings, Inc. ("WTH"). Interacting with Goldsainte Cruises means you are interacting directly with WTH. Booking a cruise creates a contract with WTH, and you are subject to WTH's Terms &amp; Conditions. Goldsainte has no liability regarding your cruise.</p>
            </div>
          </CardContent>
        </Card>

        {/* Dictionary */}
        <Card>
          <CardHeader>
            <SectionHeader icon={BookOpen} number="§" title="Goldsainte Dictionary" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Capitalized terms used throughout these Terms have the following meanings:</p>
            <div className="grid gap-4">
              {[
                ['Account', 'Account through which you can book Travel Experiences on our Platform.'],
                ['Accommodation', 'Provision of an accommodation service by a Service Provider (Section B).'],
                ['Attraction', 'Provision of an Attraction service by a Service Provider (Section C).'],
                ['Booking', 'Booking of a Travel Experience on our Platform, paid now or later.'],
                ['Goldsainte / us / we / our', 'Goldsainte B.V. (accommodation, flights, attractions) or Goldsainte Transport Limited (ground transport).'],
                ['Booking Confirmation', 'Confirmation email/voucher explaining Booking details.'],
                ['Contract of Carriage', 'Contract between you and the Service Provider for Flights.'],
                ['Flight', 'Provision of a flight by a Service Provider (Section E).'],
                ['Main Driver', "Driver whose details were entered at booking."],
                ['Platform', 'Website/app to book Travel Experiences, owned/managed by Goldsainte or affiliates.'],
                ['Pre-Booked Private Transportation', 'Private vehicle requested ≥30 minutes before pick-up.'],
                ['Private Transportation Journey', 'Journey details as set out in booking.'],
                ['Public Transportation Journey', 'Journey details as set out in booking.'],
                ['Rental / Car Rental', 'Car provision by Service Provider (Section D).'],
                ['Shared Pre-Booked Private Transportation', 'Shared vehicle; individual seat purchase.'],
                ['Rental Agreement', 'Contract signed at pick-up for Car Rental.'],
                ['Rewards / Travel Credits / Cash Credits / Credit Card Cashback', 'Benefits or monetary credits.'],
                ['Service Provider', 'Provider of a travel product/service on the Platform.'],
                ['Services (F section)', 'Public or Private Transportation provision.'],
                ['Terms', 'These terms of service.'],
                ['Third-Party Aggregator', 'Intermediary or reseller of Travel Experiences.'],
                ['Third-Party Terms', 'Contracts with Aggregator or airline (Flights).'],
                ['Upfront Payment', 'Payment made at booking.'],
                ['Wallet', 'Dashboard showing Rewards, Credits, and incentives.'],
              ].map(([term, defn]) => (
                <div key={term} className="border-l-4 border-[#0c4d47] pl-4">
                  <h4 className="font-semibold mb-1">{term}</h4>
                  <p className="text-muted-foreground">{defn}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-12 pt-8 border-t text-center text-muted-foreground">
        <p className="text-sm">© 2026 Goldsainte AI, Inc. All rights reserved.</p>
      </footer>

      <Button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 rounded-full shadow-lg bg-[#0c4d47] hover:bg-[#0a3d39] text-white"
        size="icon"
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
}
