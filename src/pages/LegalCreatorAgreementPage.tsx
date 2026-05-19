import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/BackButton';
import {
  Handshake, UserCheck, Sparkles, Percent, CreditCard, Lock, Share2, TrendingUp,
  Gavel, Clock, Eye, Briefcase, AlertCircle, RefreshCw, Mail, ArrowUp, FileText, Bot,
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

export default function LegalCreatorAgreementPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet><title>Creator Partnership Agreement · Goldsainte</title></Helmet>

      <BackButton className="mb-6" />

      <header className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151] mb-2">Legal</p>
        <h1 className="font-secondary text-4xl text-[#0a2225] mb-3">Creator Partnership Agreement</h1>
        <p className="text-sm text-[#4a4a4a]">Last updated: May 19, 2026</p>
      </header>

      <Alert className="mb-8">
        <Handshake className="h-4 w-4" />
        <AlertDescription className="text-sm">
          This Creator Partnership Agreement governs the relationship between you and Goldsainte AI, Inc.
          when you publish content, packaged trips, itinerary guides, or custom services on the Goldsainte
          marketplace. By creating a Creator account, you accept these terms.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card><CardHeader><SectionHeader icon={Handshake} number="1" title="Introduction &amp; Parties" /></CardHeader><CardContent className="space-y-4 leading-relaxed">
          <p>This Goldsainte Creator Partnership Agreement ("<strong>Agreement</strong>") is a legally binding contract between:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>the brand, advertiser, traveler, or partner engaging through the Goldsainte platform ("<strong>Brand</strong>"); and</li>
            <li>the creator, influencer, videographer, travel storyteller, or service provider participating in campaigns through Goldsainte ("<strong>Creator</strong>").</li>
          </ul>
          <p>Goldsainte Holdings LLC and its affiliates ("<strong>Goldsainte</strong>," "<strong>we</strong>," or "<strong>our</strong>") operate the Goldsainte marketplace, AI tooling, messaging, escrow/payments, and safety systems (collectively, the "<strong>Goldsainte Platform</strong>").</p>
          <p>By accepting a campaign invitation, submitting proposals or deliverables, or otherwise participating in a Brand–Creator engagement via the Goldsainte Platform, Brand and Creator (each, a "<strong>Party</strong>" and together, the "<strong>Parties</strong>") agree to be bound by this Agreement, in addition to the Goldsainte Terms of Service, Privacy Policy, and Creator Safety &amp; Conduct Policy.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={FileText} number="2" title="Definitions" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>For purposes of this Agreement:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Campaign</strong> means a collaboration, project, or booking between Brand and Creator facilitated through the Goldsainte Platform.</li>
            <li><strong>Campaign Brief</strong> means the written instructions, requirements, and details provided by Brand describing deliverables, timelines, creative direction, usage rights, and compensation.</li>
            <li><strong>Creator Content</strong> means all content, materials, and services produced or provided by Creator in connection with a Campaign.</li>
            <li><strong>Deliverables</strong> means the specific Creator Content required under a Campaign Brief.</li>
            <li><strong>Brand Assets</strong> means logos, trademarks, brand guidelines, music, images, footage, copy, or any other material supplied by Brand for use in a Campaign.</li>
            <li><strong>Escrow</strong> means the payment arrangement where Brand's funds are held securely by Goldsainte until certain conditions are met.</li>
            <li><strong>Goldsainte AI</strong> means Goldsainte's internal AI tools, including recommendation systems, moderation systems, and any content-drafting features.</li>
            <li><strong>Campaign Period</strong> means the duration of a Campaign specified in the Campaign Brief. If no period is specified, the default Campaign Period is one (1) year from first public publication.</li>
          </ul>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={UserCheck} number="3" title="Campaign Brief &amp; Scope of Work" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <h4 className="font-semibold">3.1 Campaign Brief</h4>
          <p>For each Campaign, Brand will provide a Campaign Brief through the Goldsainte Platform specifying nature and number of Deliverables, deadlines, platforms, required talking points/disclosures/tags, Brand Assets, and compensation details.</p>
          <h4 className="font-semibold">3.2 Creator Responsibilities</h4>
          <p>Creator agrees to produce Deliverables with professional care consistent with Goldsainte's luxury travel positioning; follow the Campaign Brief and applicable Goldsainte policies; provide accurate and honest travel information; maintain professional communication; and use reasonable efforts to meet all agreed deadlines.</p>
          <h4 className="font-semibold">3.3 Creator Autonomy</h4>
          <p>Subject to compliance with this Agreement, the Campaign Brief, and applicable law, Creator retains autonomy over creative style, approach, and production methods.</p>
          <h4 className="font-semibold">3.4 Third-Party Assistance</h4>
          <p>Creator may involve third parties (editors, assistants, talent) provided Creator remains fully responsible for all Deliverables, all necessary permissions are obtained, individuals featured are approved where required, and Goldsainte's safety/privacy/conduct standards are met.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Sparkles} number="4" title="Content Standards, Safety &amp; Prohibited Conduct" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <h4 className="font-semibold">4.1 Quality &amp; Brand Alignment</h4>
          <p>Creator Content must meet a high standard of production quality and reflect Goldsainte's positioning as a luxury travel brand.</p>
          <h4 className="font-semibold">4.2 Safety &amp; Travel Standards</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>recommend only vetted, lawful, and reasonably safe experiences and accommodations;</li>
            <li>avoid encouraging or glamorizing dangerous, reckless, or illegal behavior;</li>
            <li>disclose any known material risks associated with featured activities or destinations;</li>
            <li>follow Goldsainte's Traveler Safety guidelines and any relevant health, safety, or travel advisories; and</li>
            <li>promptly report unsafe, unlawful, or non-compliant Brand instructions.</li>
          </ul>
          <h4 className="font-semibold">4.3 Communication &amp; Harassment</h4>
          <p>Creator must adhere to Goldsainte's Communication Standards and Harassment Policy. Creator must not engage in harassment, bullying, discrimination, hate speech, sexual harassment, coercive behavior, abusive language, or retaliation.</p>
          <h4 className="font-semibold">4.4 Prohibited Content</h4>
          <p>Creator Content may not include or promote illegal activities, hate speech or extremism, pornographic content, misleading representations, unlicensed copyrighted material, content infringing privacy or publicity rights, or material that substantially conflicts with Goldsainte's brand values.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Share2} number="5" title="Approval, Posting &amp; On-Platform Communication" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <h4 className="font-semibold">5.1 Submission &amp; Review</h4>
          <p>Unless otherwise stated, Creator must submit Creator Content for review through the Goldsainte Platform before public posting. Brand may request reasonable revisions consistent with the Campaign Brief.</p>
          <h4 className="font-semibold">5.2 Posting Requirements</h4>
          <p>Where posting is required, Creator will publish approved Creator Content using designated social media accounts, including all required disclosures (e.g., "Ad," "Paid Partnership"), required tags or hashtags, and platform-specific policies.</p>
          <h4 className="font-semibold">5.3 On-Platform Communication</h4>
          <p>Creator agrees to keep all Brand–Creator communication on the Goldsainte Platform, not solicit or accept off-platform payments, promptly respond to messages, and use respectful and professional language.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Percent} number="6" title="Fees, Escrow, Refunds &amp; Cancellations" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <h4 className="font-semibold">6.1 Creator Fee &amp; Escrow</h4>
          <p>The Creator fee for a Campaign ("<strong>Creator Fee</strong>") will be specified in the Campaign Brief. Creator Fee payments will be processed through Goldsainte's escrow system. Brand's funds are held in Escrow and released to Creator when relevant conditions are met.</p>
          <h4 className="font-semibold">6.2 Refunds &amp; Cancellations</h4>
          <p>Refunds and cancellations are governed by the Goldsainte Refund &amp; Cancellation Policy. Brand may be entitled to a full or partial refund depending on the stage of work completed; once Creator Content has been publicly posted or used, refunds are typically not available. Goldsainte's determinations regarding refunds and Escrow distribution are final.</p>
          <h4 className="font-semibold">6.3 Taxes</h4>
          <p>Creator is solely responsible for all taxes, social contributions, or similar obligations arising from Creator Fees. Creator may be required to provide tax forms or identification information as reasonably requested.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Lock} number="7" title="Intellectual Property &amp; Licenses" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <h4 className="font-semibold">7.1 Ownership of Creator Content</h4>
          <p>As between Brand and Creator, Creator retains ownership of the intellectual property in Creator Content, except that Brand retains ownership of Brand Assets and Goldsainte retains ownership of the Goldsainte Platform.</p>
          <h4 className="font-semibold">7.2 License to Brand</h4>
          <p>Subject to full payment of the Creator Fee, Creator grants Brand a worldwide, royalty-free, non-exclusive license to use Creator Content for the duration of the Campaign Period, on the platforms and formats contemplated, with minor formatting modifications. Use beyond this scope must be agreed separately in writing.</p>
          <h4 className="font-semibold">7.3 License to Creator</h4>
          <p>Brand grants Creator a limited, revocable, non-exclusive license to use Brand Assets solely for purposes of the Campaign.</p>
          <h4 className="font-semibold">7.4 License to Goldsainte</h4>
          <p>Creator and Brand grant Goldsainte a limited license to host, store, transmit, and display Creator Content and related data as necessary to operate the Goldsainte Platform.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Eye} number="8" title="Confidentiality &amp; Data Protection" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Each Party may receive confidential or non-public information from the other Party ("<strong>Confidential Information</strong>"). Parties agree to use Confidential Information only as necessary to perform under this Agreement, apply reasonable safeguards, and limit access to those with a legitimate need to know. Creator also agrees to comply with applicable privacy and data protection laws and with Goldsainte's Privacy Policy.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Clock} number="9" title="Term, Suspension &amp; Termination" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <h4 className="font-semibold">9.1 Term</h4>
          <p>This Agreement becomes effective when Creator accepts a Campaign and continues for so long as any Campaign is active or as otherwise provided by Goldsainte's Terms of Service.</p>
          <h4 className="font-semibold">9.2 Suspension</h4>
          <p>Goldsainte may suspend or restrict access to the Goldsainte Platform if it believes there has been a violation of this Agreement, the Terms of Service, or any safety/conduct policy.</p>
          <h4 className="font-semibold">9.3 Termination</h4>
          <p>Either Party may terminate a Campaign before completion by providing written notice through the Goldsainte Platform, subject to the Goldsainte Refund &amp; Cancellation Policy.</p>
          <h4 className="font-semibold">9.4 Effect of Termination</h4>
          <p>Upon termination, Creator is no longer obligated to produce additional Deliverables; Brand must cease use of Creator Content after the Campaign Period; outstanding fees or refunds will be handled per the Refund Policy; and surviving provisions (payment, IP, confidentiality, liability, indemnity) continue in effect.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={UserCheck} number="10" title="Representations &amp; Warranties" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Each Party represents it has legal authority to enter into this Agreement and will comply with applicable laws.</p>
          <p><strong>Creator</strong> further represents that Creator is 18+; Creator Content is original or properly licensed; all sponsored content disclosures will be clear and compliant; Creator will not knowingly make false claims; and Creator is not subject to obligations preventing full performance.</p>
          <p><strong>Brand</strong> represents that Brand owns or has all necessary rights in Brand Assets; will not require unsafe, unlawful, or misleading practices; will provide accurate information; and will use Creator Content in accordance with this Agreement.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={AlertCircle} number="11" title="Disclaimers &amp; Limitation of Liability" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>To the fullest extent allowed by law, except as expressly stated, neither Party makes any other warranties, express or implied.</p>
          <p>In no event will either Party be liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits or revenue.</p>
          <p>Except for indemnity obligations or unpaid Creator Fees, each Party's aggregate liability will not exceed the greater of (a) the total Creator Fee associated with the Campaign giving rise to the claim, or (b) USD $50,000.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Briefcase} number="12" title="Indemnity" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>Each Party (the "Indemnifying Party") agrees to indemnify, defend, and hold harmless the other Party (the "Indemnified Party") from third-party claims, damages, losses, and expenses (including reasonable legal fees) arising out of the Indemnifying Party's material breach of this Agreement, violation of applicable law, or infringement of third-party rights.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Bot} number="13" title="Goldsainte AI &amp; Automation" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>The Goldsainte Platform may provide AI-generated suggestions, draft copy, or recommendations. Creator understands that AI outputs are informational only and do not constitute legal, financial, or professional advice; Creator remains fully responsible for reviewing, editing, and approving any content incorporating AI suggestions; Creator will not rely solely on AI for factual accuracy or safety; and any use is at Creator's discretion and risk.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Gavel} number="14" title="Governing Law, Dispute Resolution &amp; Relationship" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>This Agreement is governed by the laws of the jurisdiction specified in the Goldsainte Terms of Service, without regard to conflict-of-laws rules.</p>
          <p>The Parties agree to first attempt to resolve disputes informally and in good faith. If informal resolution is not successful, disputes will be resolved in the courts specified in the Goldsainte Terms of Service, subject to applicable arbitration provisions.</p>
          <p>Nothing in this Agreement creates a partnership, joint venture, employment, or agency relationship. Creator is an independent contractor.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={RefreshCw} number="15" title="Entire Agreement &amp; Changes" /></CardHeader><CardContent className="space-y-3 leading-relaxed">
          <p>This Agreement, together with the Goldsainte Terms of Service, Privacy Policy, Refund &amp; Cancellation Policy, and Creator Safety &amp; Conduct Policy, constitutes the entire agreement between Brand and Creator and supersedes all prior or contemporaneous agreements.</p>
          <p>Goldsainte may update this Agreement from time to time. Continued use of the Goldsainte Platform after changes become effective constitutes acceptance of the revised Agreement.</p>
        </CardContent></Card>

        <Card><CardHeader><SectionHeader icon={Mail} number="16" title="Contact" /></CardHeader><CardContent className="space-y-2 leading-relaxed">
          <p>Questions about this agreement: <a href="mailto:legal@goldsainte.com" className="text-[#0c4d47] underline">legal@goldsainte.com</a></p>
          <p>Operations support: <a href="mailto:support@goldsainte.com" className="text-[#0c4d47] underline">support@goldsainte.com</a></p>
        </CardContent></Card>
      </div>

      <div className="mt-12 flex justify-end">
        <Button onClick={scrollToTop} className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white gap-2" size="sm">
          <ArrowUp className="h-4 w-4" />
          Back to top
        </Button>
      </div>
    </div>
  );
}
