import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

export default function TransparencyAgreement() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>Transparency Agreement · Goldsainte</title>
        <meta name="description" content="Learn about Goldsainte's commitment to transparency, honest communication, and on-platform collaboration between creators, brands, and travelers." />
      </Helmet>
      <BackButton className="mb-6" />

      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold mb-3 font-secondary">
          Goldsainte Transparency Agreement
        </h1>
        <p className="text-muted-foreground">Last updated: May 2025</p>
      </header>

      {/* On-platform only callout */}
      <div className="mb-10 rounded-lg border bg-amber-50 px-4 py-3 text-sm text-[#92400e] text-left">
        <p className="font-semibold mb-1">
          On-platform only: no external DMs, calls, or side deals
        </p>
        <p>
          To protect both creators and travelers, all communications and
          transactions for Goldsainte campaigns must stay on the Goldsainte
          Platform. By using Goldsainte, you agree to keep all
          campaign-related communication on Goldsainte — no external DMs, no
          email or messaging apps, no Zoom or similar calls for deal-making,
          and no off-platform payments or side deals.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="mb-12 p-6 bg-muted/50 rounded-lg border">
        <h2 className="text-2xl font-semibold mb-4 font-secondary">
          Table of Contents
        </h2>
        <ul className="space-y-2 text-base">
          <li>
            <a href="#section-1" className="text-primary hover:underline">
              1. Purpose &amp; Scope
            </a>
          </li>
          <li>
            <a href="#section-2" className="text-primary hover:underline">
              2. Definitions
            </a>
          </li>
          <li>
            <a href="#section-3" className="text-primary hover:underline">
              3. Platform &amp; Marketplace Transparency
            </a>
          </li>
          <li>
            <a href="#section-4" className="text-primary hover:underline">
              4. Pricing, Fees &amp; Compensation
            </a>
          </li>
          <li>
            <a href="#section-5" className="text-primary hover:underline">
              5. Creator Transparency Obligations
            </a>
          </li>
          <li>
            <a href="#section-6" className="text-primary hover:underline">
              6. Brand Transparency Obligations
            </a>
          </li>
          <li>
            <a href="#section-7" className="text-primary hover:underline">
              7. AI, Recommendations &amp; Limitations
            </a>
          </li>
          <li>
            <a href="#section-8" className="text-primary hover:underline">
              8. Safety, Accuracy &amp; Changes to Experiences
            </a>
          </li>
          <li>
            <a href="#section-9" className="text-primary hover:underline">
              9. Reviews, Ratings &amp; Conflicts of Interest
            </a>
          </li>
          <li>
            <a href="#section-10" className="text-primary hover:underline">
              10. Enforcement, Reporting &amp; Remedies
            </a>
          </li>
          <li>
            <a href="#section-11" className="text-primary hover:underline">
              11. Relationship to Other Goldsainte Terms
            </a>
          </li>
          <li>
            <a href="#section-12" className="text-primary hover:underline">
              12. Changes to this Transparency Agreement
            </a>
          </li>
        </ul>
      </nav>

      <main className="space-y-10 text-base leading-relaxed text-foreground">
        {/* 1. Purpose & Scope */}
        <section id="section-1" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            1. Purpose &amp; Scope
          </h2>
          <p>
            Goldsainte is built on trust, clarity, and safety. This Transparency
            Agreement (&quot;<strong>Agreement</strong>&quot;) explains how
            Goldsainte, Brands, Creators, and Travelers commit to communicating
            honestly about experiences, pricing, compensation, and the role of
            AI on the Goldsainte Platform.
          </p>
          <p>
            This Agreement applies to all users of the Goldsainte Platform,
            including Brands, Creators, and Travelers, and is incorporated by
            reference into the Goldsainte Terms of Service, Creator Partnership
            Agreement, and other applicable policies.
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
              <strong>Goldsainte Platform</strong> means the Goldsainte
              marketplace, websites, mobile experiences, AI tools, messaging,
              booking flows, and related services.
            </li>
            <li>
              <strong>Brand</strong> means any advertiser, travel provider,
              hospitality partner, or business using Goldsainte to promote
              services, experiences, or products.
            </li>
            <li>
              <strong>Creator</strong> means any individual or entity providing
              content, trip proposals, travel storytelling, or related services
              through the Goldsainte Platform.
            </li>
            <li>
              <strong>Traveler</strong> means a Goldsainte user who engages with
              Creators or Brands for travel inspiration, consultation, or
              bookings.
            </li>
            <li>
              <strong>Compensation</strong> includes any form of payment,
              commission, affiliate revenue, gifted stay, discount, credit, or
              in-kind benefit.
            </li>
            <li>
              <strong>Sponsored Content</strong> means any content or
              recommendation where the Creator or Brand receives Compensation in
              connection with featuring a destination, provider, hotel,
              experience, or product.
            </li>
            <li>
              <strong>Goldsainte AI</strong> means Goldsainte&apos;s AI features
              that support recommendations, matching, content drafting,
              moderation, or other automated assistance.
            </li>
          </ul>
        </section>

        {/* 3. Platform & Marketplace Transparency */}
        <section id="section-3" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            3. Platform &amp; Marketplace Transparency
          </h2>
          <p>Goldsainte will use reasonable efforts to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              clearly describe the role of Goldsainte as a marketplace that
              connects Brands, Creators, and Travelers;
            </li>
            <li>
              disclose when Goldsainte charges platform or service fees and to
              whom those fees apply;
            </li>
            <li>
              indicate when particular experiences, itineraries, or listings are
              sponsored, boosted, or recommended based on Compensation or
              commercial arrangements; and
            </li>
            <li>
              explain, in reasonable detail, how key flows such as trip
              requests, proposals, bookings, and payouts are intended to work.
            </li>
          </ul>
          <p>
            Goldsainte is not a travel agency, carrier, or insurance provider,
            and does not guarantee the performance of third-party services. Our
            role is to provide a curated, safety-focused, luxury marketplace and
            tools for collaboration.
          </p>

          <h3 className="font-semibold">
            3.3 On-Platform Communication &amp; Transactions
          </h3>
          <p>
            To maintain a clear record, protect both sides of every
            collaboration, and uphold safety standards, all campaign-related
            communications and transactions must remain on the Goldsainte
            Platform. This includes trip requests, proposals, negotiations,
            approvals, changes, and payment flows.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>No external DMs or direct messages</strong> (including
              Instagram, TikTok, X, Facebook, LinkedIn, or similar) for
              negotiating or managing Goldsainte campaigns.
            </li>
            <li>
              <strong>No off-platform calls or conferencing tools</strong> (such
              as Zoom, Google Meet, FaceTime, WhatsApp, or similar) for
              deal-making, unless expressly approved in writing by Goldsainte
              and fully documented in the Goldsainte Platform.
            </li>
            <li>
              <strong>No off-platform payments, side deals, or attempts to move
              a Goldsainte campaign or booking outside</strong> of the
              Goldsainte Platform.
            </li>
            <li>
              All material decisions, approvals, and changes must be captured in
              Goldsainte messaging, booking, or proposal tools so they are
              visible to all relevant parties and can be reviewed in the event
              of a dispute.
            </li>
          </ul>
          <p>
            Any attempt to circumvent on-platform communication or payments may
            result in suspension or removal from the Goldsainte Platform and may
            affect eligibility for support, refunds, or dispute resolution.
          </p>
        </section>

        {/* 4. Pricing, Fees & Compensation */}
        <section id="section-4" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            4. Pricing, Fees &amp; Compensation
          </h2>
          <h3 className="font-semibold">4.1 Goldsainte Fees</h3>
          <p>
            Goldsainte may charge service, platform, or processing fees to
            Brands and/or Creators. Where applicable, Goldsainte will disclose:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>the existence of such fees;</li>
            <li>whether they are charged to Brand, Creator, or both; and</li>
            <li>
              whether they are shown separately or included in overall pricing.
            </li>
          </ul>

          <h3 className="font-semibold">4.2 Creator &amp; Brand Compensation</h3>
          <p>Creators and Brands agree to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              clearly represent the nature of any Compensation associated with
              content, recommendations, or specific experiences;
            </li>
            <li>
              comply with all disclosure requirements for sponsored content,
              gifted stays, or affiliate relationships; and
            </li>
            <li>
              not misrepresent pricing, commissions, markups, or included
              services.
            </li>
          </ul>

          <h3 className="font-semibold">4.3 Transparency to Travelers</h3>
          <p>
            When a Traveler receives a proposal, itinerary, or recommendation
            via Goldsainte, Creators and Brands agree to ensure:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              any key exclusions, add-on costs, or &quot;from&quot; pricing
              disclaimers are clear and not misleading;
            </li>
            <li>
              any major supplier relationships (for example, preferred hotel
              partners) are disclosed when reasonably relevant; and
            </li>
            <li>
              Travelers are not misled about what is included in a quoted price.
            </li>
          </ul>
        </section>

        {/* 5. Creator Transparency Obligations */}
        <section id="section-5" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            5. Creator Transparency Obligations
          </h2>
          <p>
            In addition to the Creator Partnership Agreement and Safety &amp;
            Conduct Policy, Creators agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              make clear, conspicuous disclosures when content is sponsored, or
              when the Creator receives Compensation in connection with specific
              hotels, experiences, or brands;
            </li>
            <li>
              not present sponsored experiences as purely &quot;organic&quot; if
              there is material compensation involved;
            </li>
            <li>
              accurately describe the nature of any perks, complimentary stays,
              or upgrades received;
            </li>
            <li>
              be honest about the Creator&apos;s own experience with the
              destination, including whether the Creator has personally visited
              or is relying on second-hand or AI-assisted information; and
            </li>
            <li>
              correct material errors in published content where they become
              aware of inaccuracies that could mislead Travelers.
            </li>
          </ul>
        </section>

        {/* 6. Brand Transparency Obligations */}
        <section id="section-6" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            6. Brand Transparency Obligations
          </h2>
          <p>Brands agree to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              provide Creators with accurate and non-misleading information
              about their properties, experiences, inclusions, and restrictions;
            </li>
            <li>
              disclose any material limitations, blackout dates, or terms
              associated with packages or offers promoted via Goldsainte;
            </li>
            <li>
              not instruct Creators to conceal or downplay important risks,
              restrictions, or costs; and
            </li>
            <li>
              promptly notify Creators and Goldsainte if significant aspects of
              an offer or experience change after content has been created.
            </li>
          </ul>
        </section>

        {/* 7. AI, Recommendations & Limitations */}
        <section id="section-7" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            7. AI, Recommendations &amp; Limitations
          </h2>
          <p>
            Goldsainte AI may assist with destination suggestions, itinerary
            structure, copywriting, or content concepts. Goldsainte will use
            reasonable efforts to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              indicate where recommendations are AI-assisted or based on
              automated ranking or matching;
            </li>
            <li>
              explain, at a high level, how certain AI-driven recommendations
              (such as Creator–Brand matching) generally work; and
            </li>
            <li>
              call out the limits of AI suggestions, including that they may not
              reflect real-time pricing, availability, or local conditions.
            </li>
          </ul>
          <p>
            Creators and Brands understand and agree that they are ultimately
            responsible for verifying the accuracy, safety, and legality of any
            content, offer, or representation they present to Travelers,
            regardless of whether Goldsainte AI was used.
          </p>
        </section>

        {/* 8. Safety, Accuracy & Changes to Experiences */}
        <section id="section-8" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            8. Safety, Accuracy &amp; Changes to Experiences
          </h2>
          <p>All parties commit to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              avoid making statements that are knowingly misleading or likely to
              create unrealistic expectations;
            </li>
            <li>
              update or clarify information when material changes occur (for
              example, a hotel closing, an experience being discontinued, or a
              major safety advisory);
            </li>
            <li>
              disclose when images or footage are illustrative or historical
              rather than current; and
            </li>
            <li>
              promptly communicate material changes to affected Travelers,
              Creators, or Brands where feasible.
            </li>
          </ul>
          <p>
            While Goldsainte aims to cultivate trustworthy, current information,
            the nature of travel means that conditions can change. All users are
            encouraged to double-check critical details directly with providers
            before booking or travel.
          </p>
        </section>

        {/* 9. Reviews, Ratings & Conflicts of Interest */}
        <section id="section-9" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            9. Reviews, Ratings &amp; Conflicts of Interest
          </h2>
          <p>
            Where reviews, ratings, or testimonials appear on or through the
            Goldsainte Platform:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Goldsainte may apply mechanisms to detect and limit fraudulent or
              manipulative reviews, but cannot guarantee that all improper
              reviews will be identified;
            </li>
            <li>
              Creators and Brands agree not to post fake reviews, pay for
              reviews, or otherwise artificially manipulate ratings; and
            </li>
            <li>
              any material conflicts of interest (for example, reviewing a
              property you own or manage) should be disclosed where relevant.
            </li>
          </ul>
        </section>

        {/* 10. Enforcement, Reporting & Remedies */}
        <section id="section-10" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            10. Enforcement, Reporting &amp; Remedies
          </h2>
          <p>
            Goldsainte may take actions it deems appropriate where it believes
            transparency obligations have been violated, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>warnings or educational notices;</li>
            <li>content labels, demotion, or removal;</li>
            <li>temporary feature or account restrictions;</li>
            <li>permanent suspension from the Goldsainte Platform; and</li>
            <li>
              cooperation with applicable authorities where required by law.
            </li>
          </ul>
          <p>
            Users are encouraged to report suspected deceptive, misleading, or
            unsafe behavior through the in-platform reporting tools or support
            channels. Goldsainte will review such reports in line with its
            policies and available resources.
          </p>
        </section>

        {/* 11. Relationship to Other Goldsainte Terms */}
        <section id="section-11" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            11. Relationship to Other Goldsainte Terms
          </h2>
          <p>
            This Transparency Agreement works together with, and is
            incorporated into, the Goldsainte Terms of Service, Privacy Policy,
            Creator Partnership Agreement, Refund &amp; Cancellation Policy, and
            Creator Safety &amp; Conduct Policy. If there is a conflict between
            this Agreement and other Goldsainte terms, Goldsainte will interpret
            them together to maximize user protection, clarity, and legal
            compliance.
          </p>
        </section>

        {/* 12. Changes to this Transparency Agreement */}
        <section id="section-12" className="space-y-4">
          <h2 className="text-2xl font-semibold font-secondary">
            12. Changes to this Transparency Agreement
          </h2>
          <p>
            Goldsainte may update this Transparency Agreement from time to time
            to reflect changes in our platform, applicable law, or best
            practices in transparency and consumer protection. When we make
            material changes, we will take reasonable steps to notify users, and
            the &quot;Last updated&quot; date at the top of this Agreement will
            be revised.
          </p>
          <p>
            Continued use of the Goldsainte Platform after updates become
            effective constitutes acceptance of the revised Transparency
            Agreement.
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
