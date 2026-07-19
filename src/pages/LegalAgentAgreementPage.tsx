import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/BackButton';
import {
  Handshake, UserCheck, Sparkles, Percent, CreditCard, Lock, Share2, ShieldCheck,
  Gavel, Clock, Eye, Briefcase, AlertCircle, RefreshCw, Mail, ArrowUp, FileText, Scale,
} from 'lucide-react';

const SectionHeader = ({ icon: Icon, number, title }: { icon: typeof Handshake; number: string; title: string }) => (
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

export default function LegalAgentAgreementPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet><title>Agent Partnership Agreement · Goldsainte</title></Helmet>

      <BackButton className="mb-6" />

      <header className="mb-10">
        <p className="text-[12.5px] uppercase tracking-[0.2em] text-[#7A7151] mb-2">Legal</p>
        <h1 className="font-secondary text-4xl text-[#0a2225] mb-3">Agent Partnership Agreement</h1>
        <p className="text-sm text-[#4a4a4a]">Last updated: May 19, 2026</p>
      </header>

      <Alert className="mb-8">
        <Handshake className="h-4 w-4" />
        <AlertDescription className="text-sm">
          This Agent Partnership Agreement governs the relationship between you and Goldsainte AI, Inc.
          when you operate as a Travel Agent on the Goldsainte marketplace — bidding on trip requests,
          delivering bookings, and serving travelers. By creating an Agent account, you accept these terms.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card><CardHeader><SectionHeader icon={Handshake} number="1" title="Introduction &amp; Parties" /></CardHeader><CardContent className="space-y-4 leading-relaxed">
          <p>This Goldsainte Agent Partnership Agreement ("<strong>Agreement</strong>") is a legally binding contract between you, the licensed travel agent or travel agency ("<strong>Agent</strong>"), and Goldsainte AI, Inc. and its affiliates ("<strong>Goldsainte</strong>," "<strong>we</strong>," or "<strong>our</strong>"), which operate the Goldsainte marketplace, AI tooling, payment integrations, messaging, and safety systems (collectively, the "<strong>Goldsainte Platform</strong>").</p>
          <p>By submitting an Agent application, accepting trip requests, sending proposals, or otherwise participating on the Goldsainte Platform as an Agent, you agree to be bound by this Agreement, together with the Goldsainte Terms of Service, Privacy Policy, Marketplace Guidelines, and Cancellation &amp; Refund Policy.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={FileText} number="2" title="Definitions" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Traveler</strong> means a user purchasing or requesting travel services through the Goldsainte Platform.</li>
            <li><strong>Trip Request</strong> means a brief or RFP posted by a Traveler describing desired travel arrangements.</li>
            <li><strong>Proposal</strong> means a structured bid submitted by Agent in response to a Trip Request.</li>
            <li><strong>Booking</strong> means a confirmed engagement between Agent and Traveler facilitated via the Platform.</li>
            <li><strong>Supplier</strong> means a hotel, airline, ground operator, DMC, or other third-party provider sourced by Agent.</li>
            <li><strong>Platform Fee</strong> means Goldsainte's 7% marketplace fee (3.5% deducted from Agent, 3.5% added to Traveler) on each Booking.</li>
            <li><strong>Direct Payment</strong> means a payment processed by Stripe on Agent's own connected Stripe account, with Agent as the merchant of record and Goldsainte's platform fee collected automatically as an application fee.</li>
          </ul>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={UserCheck} number="3" title="Eligibility &amp; Verification" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>To operate as an Agent, you must:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Be at least 18 years old and legally able to contract;</li>
            <li>Hold valid travel agent credentials, IATA/CLIA/ARC/TIDS accreditation, host agency affiliation, or equivalent professional standing required in your jurisdiction;</li>
            <li>Maintain any required seller-of-travel registrations (e.g., California, Florida, Washington, Hawaii) and disclose them to Goldsainte upon request;</li>
            <li>Complete Stripe Identity verification (KYC) and Stripe Connect onboarding;</li>
            <li>Pass Goldsainte's admin review and accept this Agreement before being granted Agent privileges.</li>
          </ul>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Briefcase} number="4" title="Scope of Services" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Agent is an independent contractor offering travel advisory, sourcing, and booking services to Travelers through the Platform. Agent is solely responsible for sourcing Suppliers, negotiating rates, confirming inventory, issuing tickets/vouchers, and delivering the agreed itinerary.</p>
          <p>Goldsainte is a technology marketplace and is not a travel agent, tour operator, or seller of travel. Goldsainte does not own, operate, control, or guarantee any Supplier or Booking.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Sparkles} number="5" title="Proposals &amp; Bookings" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <h4 className="font-semibold">5.1 Proposals</h4>
          <p>Agent must submit proposals that are accurate, complete, and reflect a genuine ability to fulfill the Trip Request. Quoted pricing, inclusions, cancellation terms, and payment schedules become binding offers when sent.</p>
          <h4 className="font-semibold">5.2 Acceptance &amp; Contract Formation</h4>
          <p>A Booking is formed when Traveler accepts a Proposal and completes the required deposit through the Platform's Stripe checkout, charged to Agent as merchant of record. Agent must honor accepted Proposals as quoted.</p>
          <h4 className="font-semibold">5.3 Modifications</h4>
          <p>Any change in price, dates, inclusions, or terms after acceptance must be issued as a written change order through the Platform and accepted by Traveler before becoming effective.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Percent} number="6" title="Fees &amp; Commissions" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Goldsainte charges a <strong>7% Platform Fee</strong> on the total Booking value: <strong>3.5% deducted from Agent's payout</strong> and <strong>3.5% added to Traveler's invoice</strong>. Stripe processing fees are deducted separately by Stripe.</p>
          <p>Agent retains all Supplier commissions, override agreements, and net-rate margins earned outside the Platform Fee. Agent is responsible for disclosing total trip price clearly to Traveler.</p>
          <p>Goldsainte may adjust the Platform Fee on prospective Bookings with at least thirty (30) days' notice.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={CreditCard} number="7" title="Payments, Fees &amp; Processing" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>All Traveler payments must be processed through the Platform's Stripe checkout, charged directly on Agent's connected Stripe account with Agent as the merchant of record. Agent agrees not to invoice Traveler off-platform for any portion of a Booking sourced through Goldsainte.</p>
          <p>Traveler payments settle directly to Agent's Stripe account at the time of each charge, less Goldsainte's application fee (3.5% of the booking base; Travelers pay a separate 3.5% service fee on top). As merchant of record, Agent is responsible for card processing fees, refunds, and chargebacks on Agent's bookings, and for maintaining all registrations, licenses, bonding, or insolvency protections required to sell travel in Agent's jurisdiction and to Travelers in theirs. Goldsainte may suspend checkout for Agent's listings in cases of dispute, fraud, chargeback abuse, Supplier non-performance, or policy violation.</p>
          <p>Agent is responsible for all taxes, withholdings, and reporting obligations on amounts received.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Lock} number="8" title="On-Platform Communication &amp; Anti-Circumvention" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Agent must conduct all Traveler communication and transactions related to a Goldsainte-originated lead on the Platform. Agent must not:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Share personal email, phone, or external payment links before a Booking is confirmed;</li>
            <li>Redirect Travelers to off-platform booking systems for the originating trip;</li>
            <li>Solicit repeat business from Goldsainte-originated Travelers off-platform within twelve (12) months of last Platform contact.</li>
          </ul>
          <p>Violations may result in suspension, forfeiture of pending payouts, and liability for circumvention damages equal to the Platform Fee that would have applied.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={ShieldCheck} number="9" title="Standards of Service" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Agent must deliver services with professional care consistent with Goldsainte's luxury positioning, including: timely responses (target &lt;24h on active Bookings), accurate documentation, 24/7 in-trip support contact, and prompt notification of any disruption or Supplier failure.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Scale} number="10" title="Compliance &amp; Licensing" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Agent represents and warrants that it holds all licenses, registrations, bonds, and insurance required to sell travel in each jurisdiction where it operates, including any applicable seller-of-travel laws, consumer-protection statutes, and tax-collection obligations. Agent shall indemnify Goldsainte against claims arising from failure to maintain such compliance.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={AlertCircle} number="11" title="Cancellations, Refunds &amp; Disputes" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Cancellation and refund terms for each Booking are governed by the Supplier terms disclosed in the accepted Proposal and Goldsainte's <a href="/cancellation-refund-policy" className="text-[#0c4d47] underline">Cancellation &amp; Refund Policy</a>. Agent must clearly disclose Supplier penalties before acceptance.</p>
          <p>Disputes are handled through Goldsainte's resolution center. Goldsainte may, at its discretion, mediate and require Agent to issue refunds from Agent's Stripe account where Agent has materially breached this Agreement or failed to deliver agreed services.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Share2} number="12" title="Intellectual Property" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Agent retains ownership of its proprietary itineraries, brand assets, and content uploaded to the Platform, and grants Goldsainte a non-exclusive, worldwide, royalty-free license to host, display, reformat, and promote such content in connection with operating and marketing the Platform.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Eye} number="13" title="Data Protection &amp; Confidentiality" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Agent will treat Traveler personal data as confidential, use it solely to deliver the Booking, comply with applicable data-protection laws (including GDPR and CCPA), and not retain or repurpose Traveler data after the Booking concludes except as required by law.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Gavel} number="14" title="Liability &amp; Indemnification" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Agent is solely liable for the performance of its services and its Suppliers. Agent shall defend, indemnify, and hold harmless Goldsainte and its affiliates from any claim arising out of (a) the Booking or trip itself, (b) Agent's breach of this Agreement or applicable law, (c) Supplier acts or omissions, or (d) Agent's misrepresentations.</p>
          <p>To the maximum extent permitted by law, Goldsainte's aggregate liability to Agent under this Agreement shall not exceed the Platform Fees Goldsainte received from Agent during the six (6) months preceding the claim.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Clock} number="15" title="Term &amp; Termination" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>This Agreement takes effect when Agent is approved and continues until terminated. Either party may terminate for convenience with thirty (30) days' notice. Goldsainte may suspend or terminate immediately for material breach, fraud, safety risk, or repeated policy violations. Bookings already in-flight at termination must be completed in accordance with this Agreement.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={RefreshCw} number="16" title="Changes to this Agreement" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Goldsainte may update this Agreement from time to time. Material changes will be communicated in-app or by email at least fifteen (15) days before taking effect. Continued use of the Platform after the effective date constitutes acceptance.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Gavel} number="17" title="Governing Law &amp; Dispute Resolution" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>This Agreement is governed by the laws of the State of Delaware, USA, without regard to conflict-of-laws principles. Disputes will be resolved through binding arbitration administered by JAMS in accordance with its Streamlined Arbitration Rules, except that either party may seek injunctive relief in court for IP or confidentiality breaches.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Mail} number="18" title="Contact" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>For questions about this Agreement, contact <a href="mailto:partners@goldsainte.com" className="text-[#0c4d47] underline">partners@goldsainte.com</a>.</p>
        </CardContent></Card>
      </div>

      <div className="mt-10 flex justify-center">
        <Button onClick={scrollToTop} className="bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white gap-2">
          <ArrowUp className="h-4 w-4" /> Back to top
        </Button>
      </div>
    </div>
  );
}
