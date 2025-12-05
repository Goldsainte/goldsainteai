import { useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

export default function LegalCreatorAgreementPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>Creator Partnership Agreement · Goldsainte</title>
      </Helmet>
      <BackButton className="mb-6" />

      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-3 font-secondary">
          Goldsainte Creator Partnership Agreement
        </h1>
        <p className="text-muted-foreground">Last updated: May 2025</p>
      </header>

      {/* Table of Contents */}
      <nav className="mb-12 p-6 bg-muted/50 rounded-lg border">
        <h2 className="text-2xl font-semibold mb-4 font-secondary">
          Table of Contents
        </h2>
        <ul className="space-y-2 text-base">
          <li>
            <a href="#section-1" className="text-primary hover:underline">
              1. Introduction & Parties
            </a>
          </li>
          <li>
            <a href="#section-2" className="text-primary hover:underline">
              2. Definitions
            </a>
          </li>
          <li>
            <a href="#section-3" className="text-primary hover:underline">
              3. Campaign Brief & Scope of Work
            </a>
          </li>
          <li>
            <a href="#section-4" className="text-primary hover:underline">
              4. Content Standards, Safety & Prohibited Conduct
            </a>
          </li>
          <li>
            <a href="#section-5" className="text-primary hover:underline">
              5. Approval, Posting & On-Platform Communication
            </a>
          </li>
          <li>
            <a href="#section-6" className="text-primary hover:underline">
              6. Fees, Escrow, Refunds & Cancellations
            </a>
          </li>
          <li>
            <a href="#section-7" className="text-primary hover:underline">
              7. Intellectual Property & Licenses
            </a>
          </li>
          <li>
            <a href="#section-8" className="text-primary hover:underline">
              8. Confidentiality & Data Protection
            </a>
          </li>
          <li>
            <a href="#section-9" className="text-primary hover:underline">
              9. Term, Suspension & Termination
            </a>
          </li>
          <li>
            <a href="#section-10" className="text-primary hover:underline">
              10. Representations & Warranties
            </a>
          </li>
          <li>
            <a href="#section-11" className="text-primary hover:underline">
              11. Disclaimers & Limitation of Liability
            </a>
          </li>
          <li>
            <a href="#section-12" className="text-primary hover:underline">
              12. Indemnity
            </a>
          </li>
          <li>
            <a href="#section-13" className="text-primary hover:underline">
              13. Goldsainte AI & Automation
            </a>
          </li>
          <li>
            <a href="#section-14" className="text-primary hover:underline">
              14. Governing Law, Dispute Resolution & Relationship
            </a>
          </li>
          <li>
            <a href="#section-15" className="text-primary hover:underline">
              15. Entire Agreement & Changes
            </a>
          </li>
        </ul>
      </nav>

      <main className="space-y-10 text-base leading-relaxed text-foreground">
        {/* 1. Introduction & Parties */}
        <section id="section-1" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            1. Introduction & Parties
          </h2>
          <p>
            This Goldsainte Creator Partnership Agreement (&quot;
            <strong>Agreement</strong>&quot;) is a legally binding contract
            between:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              the brand, advertiser, traveler, or partner engaging through the
              Goldsainte platform (&quot;<strong>Brand</strong>&quot;); and
            </li>
            <li>
              the creator, influencer, videographer, travel storyteller, or
              service provider participating in campaigns through Goldsainte
              (&quot;<strong>Creator</strong>&quot;).
            </li>
          </ul>
          <p>
            Goldsainte Holdings LLC and its affiliates
            (&quot;<strong>Goldsainte</strong>,&quot; &quot;
            <strong>we</strong>,&quot; or &quot;<strong>our</strong>&quot;)
            operate the Goldsainte marketplace, AI tooling, messaging,
            escrow/payments, and safety systems (collectively, the &quot;
            <strong>Goldsainte Platform</strong>&quot;).
          </p>
          <p>
            By accepting a campaign invitation, submitting proposals or
            deliverables, or otherwise participating in a Brand–Creator
            engagement via the Goldsainte Platform, Brand and Creator (each, a
            &quot;<strong>Party</strong>&quot; and together, the &quot;
            <strong>Parties</strong>&quot;) agree to be bound by this
            Agreement, in addition to the Goldsainte Terms of Service, Privacy
            Policy, and Creator Safety &amp; Conduct Policy.
          </p>
        </section>

        {/* 2. Definitions */}
        <section id="section-2" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            2. Definitions
          </h2>
          <p>For purposes of this Agreement:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Campaign</strong> means a collaboration, project, or
              booking between Brand and Creator facilitated through the
              Goldsainte Platform, which may include content creation, travel
              recommendations, trip proposals, or experiential storytelling.
            </li>
            <li>
              <strong>Campaign Brief</strong> means the written instructions,
              requirements, and details provided by Brand (through Goldsainte)
              describing deliverables, timelines, creative direction, usage
              rights, and compensation.
            </li>
            <li>
              <strong>Creator Content</strong> means all content, materials, and
              services produced or provided by Creator in connection with a
              Campaign, including videos, images, captions, itineraries, travel
              recommendations, scripts, edits, and related assets.
            </li>
            <li>
              <strong>Deliverables</strong> means the specific Creator Content
              required under a Campaign Brief (for example, a certain number of
              TikTok videos, Reels, posts, or trip proposal documents).
            </li>
            <li>
              <strong>Brand Assets</strong> means logos, trademarks, brand
              guidelines, music, images, footage, copy, or any other material
              supplied by Brand for use in a Campaign.
            </li>
            <li>
              <strong>Escrow</strong> means the payment arrangement where
              Brand&apos;s funds are held securely by Goldsainte until certain
              conditions (such as delivery and approval of Deliverables) are
              met.
            </li>
            <li>
              <strong>Goldsainte AI</strong> means Goldsainte&apos;s internal
              AI tools, including recommendation systems, moderation systems,
              and any content-drafting features made available on the
              Goldsainte Platform.
            </li>
            <li>
              <strong>Campaign Period</strong> means the duration of a Campaign
              specified in the Campaign Brief. If no period is specified, the
              default Campaign Period is one (1) year from the first public
              publication of the Creator Content for that Campaign.
            </li>
          </ul>
        </section>

        {/* 3. Campaign Brief & Scope of Work */}
        <section id="section-3" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            3. Campaign Brief &amp; Scope of Work
          </h2>
          <h3 className="font-semibold">3.1 Campaign Brief</h3>
          <p>
            For each Campaign, Brand will provide a Campaign Brief through the
            Goldsainte Platform. The Campaign Brief should clearly specify:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>the nature and number of Deliverables;</li>
            <li>Deadlines, milestones, and posting windows;</li>
            <li>Platforms on which content will be posted;</li>
            <li>
              any required talking points, disclosures, tags, or hashtags;
            </li>
            <li>Brand Assets and guidance on how they may be used; and</li>
            <li>
              Compensation details, including any staged payments or milestone
              payments.
            </li>
          </ul>

          <h3 className="font-semibold">3.2 Creator Responsibilities</h3>
          <p>Creator agrees to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              produce the Deliverables with professional care, consistent with
              Goldsainte&apos;s luxury travel positioning;
            </li>
            <li>
              follow the Campaign Brief and any applicable Goldsainte policies,
              including the Creator Safety &amp; Conduct Policy;
            </li>
            <li>
              provide accurate and honest travel information, recommendations,
              and descriptions;
            </li>
            <li>
              maintain professional, respectful communication at all times; and
            </li>
            <li>
              use reasonable efforts to meet all agreed deadlines and
              Deliverables.
            </li>
          </ul>

          <h3 className="font-semibold">3.3 Creator Autonomy</h3>
          <p>
            Subject to compliance with this Agreement, the Campaign Brief, and
            applicable law, Creator retains autonomy over creative style,
            approach, and production methods, including the time, place, and
            manner in which Creator Content is produced.
          </p>

          <h3 className="font-semibold">3.4 Third-Party Assistance</h3>
          <p>
            Creator may involve third parties (such as editors, assistants, or
            talent) in producing Creator Content, provided that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Creator remains fully responsible for all Deliverables;</li>
            <li>
              all necessary permissions, releases, and clearances are obtained;
            </li>
            <li>
              any individuals featured in Creator Content are approved by Brand
              if the Campaign Brief requires such approval; and
            </li>
            <li>
              Creator ensures compliance with Goldsainte&apos;s safety, privacy,
              and conduct standards.
            </li>
          </ul>
        </section>

        {/* 4. Content Standards, Safety & Prohibited Conduct */}
        <section id="section-4" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            4. Content Standards, Safety &amp; Prohibited Conduct
          </h2>

          <h3 className="font-semibold">4.1 Quality & Brand Alignment</h3>
          <p>
            Creator Content must meet a high standard of production quality and
            reflect Goldsainte&apos;s positioning as a luxury travel brand.
            This includes clear visuals, appropriate sound quality, and
            thoughtful representation of destinations, experiences, and
            partners.
          </p>

          <h3 className="font-semibold">4.2 Safety & Travel Standards</h3>
          <p>Creator agrees to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              recommend only vetted, lawful, and reasonably safe experiences and
              accommodations;
            </li>
            <li>
              avoid encouraging or glamorizing dangerous, reckless, or illegal
              behavior;
            </li>
            <li>
              disclose any known material risks associated with activities or
              destinations featured in Creator Content;
            </li>
            <li>
              follow Goldsainte&apos;s Traveler Safety guidelines and any
              relevant health, safety, or travel advisories; and
            </li>
            <li>
              promptly report to Goldsainte any Brand instructions that may be
              unsafe, unlawful, or inconsistent with Goldsainte policies.
            </li>
          </ul>

          <h3 className="font-semibold">4.3 Communication & Harassment</h3>
          <p>
            Creator must adhere to Goldsainte&apos;s Communication Standards and
            Harassment Policy. Creator must not engage in:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>harassment, bullying, discrimination, or hate speech;</li>
            <li>sexual harassment or inappropriate messages;</li>
            <li>coercive, manipulative, or intimidating behavior;</li>
            <li>abusive language, threats, or personal attacks; or</li>
            <li>
              retaliation against any user or party for making a report or
              raising concerns.
            </li>
          </ul>

          <h3 className="font-semibold">4.4 Prohibited Content</h3>
          <p>
            Creator Content may not include or promote any of the following:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>illegal activities or unlicensed travel services;</li>
            <li>hate speech, extremist content, or incitement of violence;</li>
            <li>pornographic or explicit sexual content;</li>
            <li>
              misleading, deceptive, or materially inaccurate representations;
            </li>
            <li>
              unlicensed music, images, video, or other copyrighted material;
            </li>
            <li>
              content that infringes privacy, publicity, or other personal
              rights; or
            </li>
            <li>
              any material that substantially conflicts with Goldsainte&apos;s
              brand values, or that would reasonably be expected to damage the
              reputation of Goldsainte, Brand, or other partners.
            </li>
          </ul>
        </section>

        {/* 5. Approval, Posting & On-Platform Communication */}
        <section id="section-5" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            5. Approval, Posting &amp; On-Platform Communication
          </h2>

          <h3 className="font-semibold">5.1 Submission & Review</h3>
          <p>
            Unless otherwise stated in the Campaign Brief, Creator must submit
            Creator Content for review through the Goldsainte Platform before
            public posting. Brand may request reasonable revisions consistent
            with the Campaign Brief and this Agreement.
          </p>

          <h3 className="font-semibold">5.2 Posting Requirements</h3>
          <p>
            Where posting is required, Creator will publish approved Creator
            Content using Creator&apos;s designated social media accounts or
            channels, as specified in the Campaign Brief. Creator will:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              include all required disclosures (for example, &quot;Ad,&quot;
              &quot;Paid Partnership,&quot; or equivalent);
            </li>
            <li>use required tags, mentions, or hashtags; and</li>
            <li>
              comply with platform-specific policies (such as TikTok, Instagram,
              or other relevant platforms).
            </li>
          </ul>

          <h3 className="font-semibold">5.3 On-Platform Communication</h3>
          <p>
            To protect all parties and maintain a clear audit trail, Creator
            agrees to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              keep all Brand–Creator communication related to the Campaign on
              the Goldsainte Platform;
            </li>
            <li>not solicit or accept off-platform payments for the Campaign;</li>
            <li>
              promptly respond to reasonable Brand and Goldsainte messages;
            </li>
            <li>
              use respectful and professional language in all communications.
            </li>
          </ul>
        </section>

        {/* 6. Fees, Escrow, Refunds & Cancellations */}
        <section id="section-6" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            6. Fees, Escrow, Refunds &amp; Cancellations
          </h2>

          <h3 className="font-semibold">6.1 Creator Fee & Escrow</h3>
          <p>
            The Creator fee for a Campaign (&quot;
            <strong>Creator Fee</strong>&quot;) will be specified in the
            Campaign Brief or invitation. Unless otherwise stated, Creator Fee
            payments will be processed through Goldsainte&apos;s escrow system.
            Brand&apos;s funds are held in Escrow and are released to Creator
            when the relevant conditions are met (for example, approval of
            Deliverables or completion of a booking).
          </p>

          <h3 className="font-semibold">6.2 Refunds &amp; Cancellations</h3>
          <p>
            Refunds and cancellations are governed by the Goldsainte Refund &
            Cancellation Policy, which is incorporated into this Agreement by
            reference. In general:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Brand may be entitled to a full or partial refund depending on the
              stage of work completed at the time of cancellation;
            </li>
            <li>
              once Creator Content has been publicly posted or used, refunds are
              typically not available;
            </li>
            <li>
              Goldsainte may intervene in disputes and determine the appropriate
              allocation of funds based on platform records, submissions, and
              policy compliance.
            </li>
          </ul>
          <p>
            Creator acknowledges and agrees that Goldsainte&apos;s
            determinations in connection with refunds and Escrow distribution
            are final.
          </p>

          <h3 className="font-semibold">6.3 Taxes</h3>
          <p>
            Creator is solely responsible for all taxes, social contributions,
            or similar obligations arising from Creator Fees or other amounts
            paid under this Agreement. Creator may be required to provide tax
            forms or identification information as reasonably requested.
          </p>
        </section>

        {/* 7. Intellectual Property & Licenses */}
        <section id="section-7" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            7. Intellectual Property &amp; Licenses
          </h2>

          <h3 className="font-semibold">7.1 Ownership of Creator Content</h3>
          <p>
            As between Brand and Creator, Creator retains ownership of the
            intellectual property in Creator Content, except that Brand retains
            ownership of Brand Assets and Goldsainte retains ownership of the
            Goldsainte Platform and any Goldsainte materials.
          </p>

          <h3 className="font-semibold">7.2 License to Brand</h3>
          <p>
            Subject to full payment of the Creator Fee, Creator grants Brand a
            worldwide, royalty-free, non-exclusive license to use Creator
            Content:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              for the duration of the Campaign Period and any extension
              specified in the Campaign Brief;
            </li>
            <li>
              on the platforms and in the formats contemplated in the Campaign
              Brief (for example, social media, digital ads, and promotional
              materials); and
            </li>
            <li>
              with minor modifications for technical or formatting reasons
              (resizing, adding captions, product tags, or tracking links)
              provided such changes do not materially misrepresent Creator or
              Creator&apos;s views.
            </li>
          </ul>
          <p>
            Any use beyond the scope described here (such as long-term paid
            media campaigns, whitelisting, or perpetual usage) must be agreed
            separately in writing.
          </p>

          <h3 className="font-semibold">7.3 License to Creator</h3>
          <p>
            Brand grants Creator a limited, revocable, non-exclusive license to
            use Brand Assets solely for purposes of the Campaign and in
            accordance with Brand&apos;s instructions and this Agreement.
          </p>

          <h3 className="font-semibold">7.4 License to Goldsainte</h3>
          <p>
            Creator and Brand grant Goldsainte a limited license to host, store,
            transmit, and display Creator Content and related data as necessary
            to operate the Goldsainte Platform, provide support, enhance safety,
            and comply with legal obligations. Goldsainte may also use
            de-identified or aggregated data derived from Campaigns to improve
            services and features.
          </p>
        </section>

        {/* 8. Confidentiality & Data Protection */}
        <section id="section-8" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            8. Confidentiality &amp; Data Protection
          </h2>
          <p>
            Each Party may receive confidential or non-public information from
            the other Party, including business plans, strategies, pricing,
            private itineraries, and traveler personal data (&quot;
            <strong>Confidential Information</strong>&quot;). Confidential
            Information does not include information that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>is or becomes publicly available through no fault of the recipient;</li>
            <li>
              was already lawfully known to the recipient without an obligation
              of confidentiality; or
            </li>
            <li>
              is independently developed without use of the other Party&apos;s
              Confidential Information.
            </li>
          </ul>
          <p>
            Parties agree to use Confidential Information only as necessary to
            perform under this Agreement, to apply reasonable safeguards, and to
            limit access to individuals with a legitimate need to know.
          </p>
          <p>
            Creator also agrees to comply with applicable privacy and data
            protection laws and with Goldsainte&apos;s Privacy Policy when
            handling personal data shared via the Goldsainte Platform.
          </p>
        </section>

        {/* 9. Term, Suspension & Termination */}
        <section id="section-9" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            9. Term, Suspension &amp; Termination
          </h2>
          <h3 className="font-semibold">9.1 Term</h3>
          <p>
            This Agreement becomes effective when Creator accepts a Campaign or
            otherwise indicates acceptance via the Goldsainte Platform, and it
            continues for so long as any Campaign is active or as otherwise
            provided by Goldsainte&apos;s Terms of Service.
          </p>

          <h3 className="font-semibold">9.2 Suspension</h3>
          <p>
            Goldsainte may, at its discretion, suspend or restrict Creator&apos;s
            or Brand&apos;s access to the Goldsainte Platform or specific
            features if it believes there has been a violation of this
            Agreement, the Terms of Service, or any safety or conduct policy, or
            to protect users, travelers, or the platform.
          </p>

          <h3 className="font-semibold">9.3 Termination by Parties</h3>
          <p>
            Unless otherwise specified in the Campaign Brief, either Party may
            terminate a Campaign before completion by providing written notice
            through the Goldsainte Platform. Any such termination will be
            subject to the Goldsainte Refund &amp; Cancellation Policy and any
            applicable usage rights agreed between Brand and Creator.
          </p>

          <h3 className="font-semibold">9.4 Effect of Termination</h3>
          <p>
            Upon termination of a Campaign (and absent a separate agreement to
            the contrary):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Creator is no longer obligated to produce additional Deliverables
              for that Campaign;
            </li>
            <li>
              Brand must cease use of Creator Content after the Campaign Period,
              except for any extended usage rights expressly agreed in writing;
            </li>
            <li>
              any outstanding fees or refunds will be handled according to the
              Goldsainte Refund &amp; Cancellation Policy; and
            </li>
            <li>
              provisions of this Agreement that reasonably should survive
              termination (including sections on payment, IP, confidentiality,
              limitations of liability, and indemnity) will continue in effect.
            </li>
          </ul>
        </section>

        {/* 10. Representations & Warranties */}
        <section id="section-10" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            10. Representations &amp; Warranties
          </h2>

          <h3 className="font-semibold">10.1 Mutual Representations</h3>
          <p>
            Each Party represents and warrants that it has the legal right and
            authority to enter into this Agreement and to perform its
            obligations hereunder, and that it will comply with applicable laws
            in connection with this Agreement.
          </p>

          <h3 className="font-semibold">10.2 Creator Representations</h3>
          <p>Creator further represents and warrants that:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Creator is at least 18 years old (or the age of majority in Creator&apos;s jurisdiction);</li>
            <li>
              Creator Content is original to Creator or properly licensed, and
              does not infringe any third-party rights;
            </li>
            <li>
              all endorsements and sponsored content disclosures will be clear,
              conspicuous, and in compliance with applicable regulations and
              platform rules;
            </li>
            <li>
              Creator will not knowingly make false or misleading claims about
              travel services, destinations, or Brands; and
            </li>
            <li>
              Creator is not subject to any obligation or restriction that would
              prevent full performance of this Agreement.
            </li>
          </ul>

          <h3 className="font-semibold">10.3 Brand Representations</h3>
          <p>Brand represents and warrants that:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Brand owns or has all necessary rights in Brand Assets and
              Campaign directives;
            </li>
            <li>
              Brand will not require Creator to engage in unsafe, unlawful, or
              misleading practices;
            </li>
            <li>
              Brand will provide clear and accurate information regarding its
              offerings; and
            </li>
            <li>
              Brand&apos;s use of Creator Content will be in accordance with
              this Agreement and applicable law.
            </li>
          </ul>
        </section>

        {/* 11. Disclaimers & Limitation of Liability */}
        <section id="section-11" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            11. Disclaimers &amp; Limitation of Liability
          </h2>
          <p>
            To the fullest extent allowed by law, except as expressly stated in
            this Agreement, neither Party makes any other warranties, express or
            implied, including any implied warranties of merchantability,
            fitness for a particular purpose, or non-infringement.
          </p>
          <p>
            In no event will either Party be liable to the other for any
            indirect, incidental, special, consequential, or punitive damages,
            or for any loss of profits or revenue, whether in contract, tort, or
            otherwise, arising out of or relating to this Agreement, even if
            advised of the possibility of such damages.
          </p>
          <p>
            Except for amounts payable under indemnity obligations, or for
            unpaid Creator Fees that are properly owed, each Party&apos;s
            aggregate liability under this Agreement will not exceed the greater
            of (a) the total Creator Fee associated with the Campaign giving
            rise to the claim, or (b) USD $50,000.
          </p>
        </section>

        {/* 12. Indemnity */}
        <section id="section-12" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            12. Indemnity
          </h2>
          <p>
            Each Party (the &quot;Indemnifying Party&quot;) agrees to indemnify,
            defend, and hold harmless the other Party (the &quot;Indemnified
            Party&quot;) from and against any third-party claims, damages,
            losses, and expenses (including reasonable legal fees) arising out
            of or related to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              the Indemnifying Party&apos;s material breach of this Agreement;
            </li>
            <li>
              the Indemnifying Party&apos;s violation of applicable law; or
            </li>
            <li>
              claims that the Indemnifying Party&apos;s content or materials
              infringe a third party&apos;s intellectual property or other rights.
            </li>
          </ul>
        </section>

        {/* 13. Goldsainte AI & Automation */}
        <section id="section-13" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            13. Goldsainte AI &amp; Automation
          </h2>
          <p>
            The Goldsainte Platform may provide AI-generated suggestions,
            draft copy, or recommendations. Creator understands and agrees that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Goldsainte AI outputs are informational only and do not constitute
              legal, financial, or professional advice;
            </li>
            <li>
              Creator remains fully responsible for reviewing, editing, and
              approving any content that incorporates AI suggestions;
            </li>
            <li>
              Creator will not rely solely on AI for factual accuracy,
              regulatory compliance, or safety decisions; and
            </li>
            <li>
              any use of AI-generated content is at Creator&apos;s discretion
              and risk, subject to this Agreement and applicable law.
            </li>
          </ul>
        </section>

        {/* 14. Governing Law, Dispute Resolution & Relationship */}
        <section id="section-14" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            14. Governing Law, Dispute Resolution &amp; Relationship
          </h2>
          <p>
            This Agreement will be governed by and construed in accordance with
            the laws of the jurisdiction specified in the Goldsainte Terms of
            Service, without regard to its conflict-of-laws rules.
          </p>
          <p>
            The Parties agree to first attempt to resolve any disputes
            informally and in good faith. If informal resolution is not
            successful, the Parties agree that disputes will be resolved in the
            courts specified in the Goldsainte Terms of Service, subject to any
            applicable arbitration or dispute-resolution provisions in those
            Terms.
          </p>
          <p>
            Nothing in this Agreement creates a partnership, joint venture,
            employment, or agency relationship between Brand and Creator.
            Creator is an independent contractor, responsible for Creator&apos;s
            own business operations, expenses, and obligations.
          </p>
        </section>

        {/* 15. Entire Agreement & Changes */}
        <section id="section-15" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            15. Entire Agreement &amp; Changes
          </h2>
          <p>
            This Agreement, together with the Goldsainte Terms of Service,
            Privacy Policy, Refund &amp; Cancellation Policy, and Creator Safety
            &amp; Conduct Policy, constitutes the entire agreement between Brand
            and Creator with respect to the subject matter herein and supersedes
            all prior or contemporaneous agreements, proposals, or
            communications (whether oral or written) relating to that subject
            matter.
          </p>
          <p>
            Goldsainte may update this Agreement from time to time. Continued
            use of the Goldsainte Platform after changes become effective
            constitutes acceptance of the revised Agreement.
          </p>
        </section>
      </main>

      {/* Scroll to top button */}
      <div className="mt-12 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-4 w-4" />
          Back to top
        </Button>
      </div>
    </div>
  );
}
