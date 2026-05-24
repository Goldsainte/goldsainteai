import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";
import { BackButton } from "@/components/ui/BackButton";
import founderImage from "@/assets/founder.jpg";
import openaiLogo from "@/assets/OpenAI_Logo.svg";
import goldsainteLogo from "@/assets/wordmark-green.svg";
import primaryLogoGreen from "@/assets/primary-horizontal-logo-green.svg";
import { 
  Sparkles, Share2, Briefcase, Map, BarChart3,
  DollarSign, ShieldCheck, FileCheck, MessageCircle, Inbox, CreditCard,
} from "lucide-react";

const About = () => {
  const { t } = useTranslation();
  const partners = [
    { name: "OpenAI", logo: openaiLogo },
  ];

  const featureCategories = [
    {
      category: "AI-Powered Trip Design",
      features: [
        {
          icon: Sparkles,
          title: "AI Trip Matching",
          description: "Describe your dream trip in plain language. Our AI reads your brief, infers destinations, budget and style, and matches you with the verified specialists best suited to design it."
        },
        {
          icon: Map,
          title: "Personalised Proposals",
          description: "Every proposal is a fully-priced itinerary tailored to your brief — destinations, accommodation, experiences, transfers and cancellation terms, side-by-side and easy to compare."
        }
      ]
    },
    {
      category: "Marketplace & Bookings",
      features: [
        {
          icon: Inbox,
          title: "Trip Request Marketplace",
          description: "Post a trip request once. Certified travel agents and creators submit tailored proposals you can compare side-by-side — itinerary, pricing, reviews and cancellation terms."
        },
        {
          icon: Briefcase,
          title: "Packaged Trips & Services",
          description: "Browse ready-to-book trips and creator-led services across every region and style — from short city breaks to multi-stop, multi-week journeys."
        },
        {
          icon: CreditCard,
          title: "Escrow & Milestone Payments",
          description: "All payments stay on-platform. Funds are held in escrow and released to your specialist as each milestone of your trip is delivered."
        },
        {
          icon: ShieldCheck,
          title: "Verified Specialists",
          description: "Every agent and creator is vetted, identity-verified through Stripe Identity, and held to clear marketplace standards before they can publish or take bookings."
        }
      ]
    },
    {
      category: "For Creators & Agents",
      features: [
        {
          icon: Share2,
          title: "Creator Profiles & Storefronts",
          description: "Creators turn their audience into bookings with a public profile, storyboards, packaged trips and digital guides — all monetised in one place."
        },
        {
          icon: DollarSign,
          title: "Industry-Leading Payouts",
          description: "Creators earn 85–92% commission depending on tier. Agents keep the full value of the trips they design, less a small marketplace fee. Payouts settle via Stripe Connect."
        },
        {
          icon: BarChart3,
          title: "Dashboards & Analytics",
          description: "Track requests, proposals, bookings, earnings and reviews from one workspace built for travel professionals."
        },
        {
          icon: MessageCircle,
          title: "On-Platform Messaging",
          description: "Real-time chat between travelers, agents and creators — with notifications, attachments and a full audit trail, so every conversation stays protected."
        }
      ]
    }
  ];

  return (
    <div className="bg-[#f7f3ea] text-[#0a2225] flex-1 selection:bg-[#c9a84c]/30">
      <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24 max-w-5xl">
        <BackButton className="mb-8" />
        {/* Editorial Hero */}
        <header className="text-center mb-20 md:mb-24">
          <div className="flex justify-center mb-10">
            <div className="w-px h-16 bg-[#0a2225]" />
          </div>
          <span className="block uppercase tracking-[0.3em] text-[9px] font-bold mb-8 text-[#c9a84c]">
            About Goldsainte
          </span>
          <h1
            className="text-5xl md:text-6xl italic mb-8 tracking-tight leading-[0.95] text-balance"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            The Smarter Travel Marketplace
          </h1>
          <p className="text-base md:text-lg text-[#0a2225]/70 font-light max-w-xl mx-auto leading-relaxed text-pretty">
            {t('home.hero.subtitle')}
          </p>
        </header>

      {/* Letter from the Founder - Main, Visible Section */}
      <Card className="mb-6 sm:mb-8 border-primary/20 shadow-lg">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl text-center">{t('about.founderLetter.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[200px_1fr] gap-6 sm:gap-8">
            {/* Founder Image */}
            <div className="flex justify-center md:justify-start">
              <div className="w-[160px] h-[200px] sm:w-[180px] sm:h-[225px] md:w-[180px] md:h-[225px] lg:w-[200px] lg:h-[250px] rounded-lg overflow-hidden shadow-md">
                <img 
                  src={founderImage}
                  alt="Goldsainte Founder"
                  className="w-full h-full object-cover"
                loading="lazy"/>
              </div>
            </div>
            
            {/* Letter Content */}
            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed">
              <p className="text-foreground">
                {t('about.founderLetter.p1')}
              </p>
              
              <p className="text-foreground font-semibold">
                {t('about.founderLetter.p2')}
              </p>

              <p className="text-foreground">
                {t('about.founderLetter.p3')}
              </p>
              
              <p className="text-foreground">
                {t('about.founderLetter.p4')}
              </p>
              
              <p className="text-foreground italic mt-4">
                {t('about.founderLetter.p5')}
              </p>
              
              <div className="mt-6 text-foreground leading-tight space-y-0">
                <p className="font-semibold">{t('about.founderLetter.signature')}</p>
                <p>{t('about.founderLetter.title2')}</p>
                <p>{t('about.founderLetter.company')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expandable Sections */}
      <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
        
        {/* What Is Goldsainte */}
        <AccordionItem value="what-is" className="border-0 rounded-lg px-4 sm:px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47] py-3 sm:py-4">
            {t('about.sections.whatIs.title')}
          </AccordionTrigger>
          <AccordionContent className="pt-3 sm:pt-4 space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed">
            <div className="flex justify-center mb-4 sm:mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-4 sm:h-5 md:h-7 w-auto"
              loading="lazy"/>
            </div>
            <p className="text-foreground">
              Goldsainte is a luxury travel marketplace that connects travelers with certified travel agents and travel creators through AI-powered trip planning. Browse curated trips, post a custom trip request, or work directly with a verified specialist to design your perfect journey.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* What We Offer */}
        <AccordionItem value="features" className="border-0 rounded-lg px-4 sm:px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47] py-3 sm:py-4">
            {t('about.sections.features.title')}
          </AccordionTrigger>
          <AccordionContent className="pt-4 sm:pt-6 space-y-6 sm:space-y-8">
            <div className="flex justify-center mb-4 sm:mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-4 sm:h-5 md:h-7 w-auto"
              loading="lazy"/>
            </div>
            {featureCategories.map((category, idx) => (
              <div key={category.category}>
                <h3 className="font-semibold text-sm sm:text-base mb-3 text-foreground">{category.category}</h3>
                <div className="grid gap-3 sm:gap-4">
                  {category.features.map((feature) => (
                    <div 
                      key={feature.title}
                      className="flex gap-3 sm:gap-4 items-start p-3 sm:p-4 rounded-lg hover:bg-accent/50 transition-all"
                    >
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3 text-foreground">{feature.title}</h3>
                        <p className="text-sm sm:text-base text-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {idx < featureCategories.length - 1 && (
                  <div className="mt-6 border-t border-border/50" />
                )}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Our Mission */}
        <AccordionItem value="mission" className="border-0 rounded-lg px-4 sm:px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47] py-3 sm:py-4">
            {t('about.sections.mission.title')}
          </AccordionTrigger>
          <AccordionContent className="pt-3 sm:pt-4 space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed">
            <div className="flex justify-center mb-4 sm:mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-4 sm:h-5 md:h-7 w-auto"
              loading="lazy"/>
            </div>
            <p className="text-foreground">
              {t('about.sections.mission.p1')}
            </p>
            <p className="text-foreground">
              {t('about.sections.mission.p2')}
            </p>
            <p className="text-foreground">
              {t('about.sections.mission.p3')}
            </p>
            <p className="text-foreground">
              {t('about.sections.mission.p4')}
            </p>
            <p className="text-foreground">
              {t('about.sections.mission.p5')}
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Partners & Technology */}
        <AccordionItem value="partners" className="border-0 rounded-lg px-4 sm:px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47] py-3 sm:py-4">
            {t('about.sections.partners.title')}
          </AccordionTrigger>
          <AccordionContent className="pt-4 sm:pt-6">
            <div className="flex justify-center mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-5 sm:h-7 w-auto"
              loading="lazy"/>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-6">
              {partners.map((partner) => (
                <div 
                  key={partner.name}
                  className="flex items-center justify-center p-6 rounded-lg border border-border/50 bg-card/50 hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <img 
                    src={partner.logo} 
                    alt={`${partner.name} logo`}
                    className="w-full h-auto max-h-12 object-contain filter dark:invert"
                  loading="lazy"/>
                </div>
              ))}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              {t('about.sections.partners.description')}
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Legal */}
        <AccordionItem value="legal" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47]">
            {t('about.sections.legal.title')}
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4 text-sm sm:text-base leading-relaxed">
            <div className="flex justify-center mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-5 sm:h-7 w-auto"
              loading="lazy"/>
            </div>
            <p className="text-sm sm:text-base text-foreground">
              {t('about.sections.legal.p1')}
            </p>
            <p className="text-sm sm:text-base text-foreground">
              {t('about.sections.legal.p2')}
            </p>
            <p className="text-sm sm:text-base text-foreground">
              {t('about.sections.legal.p3')}
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Accessibility Statement */}
        <AccordionItem value="accessibility" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47]">
            Accessibility Statement
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-6 text-sm sm:text-base leading-relaxed">
            <div className="flex justify-center mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-5 sm:h-7 w-auto"
              loading="lazy"/>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-3 text-foreground">Accessibility Statement for Goldsainte</h3>
              <p className="text-foreground">
                At Goldsainte, our mission is to make it easier for everyone to experience the world. We are committed to delivering barrier-free, inclusive experiences for all our users, and this involves making our digital services accessible to everyone, including persons with disabilities.
              </p>
            </div>
            
            <p className="text-foreground">
              We are continuously working to improve the accessibility of our digital services. This statement has been prepared to inform users about how we make our services more accessible, including aligning with the currently applicable US standards on accessibility requirements for ICT products and services ("Accessibility Standards"). This accessibility statement applies to the portions of our services covered by US accessibility legislation.
            </p>

            <div>
              <h3 className="font-semibold text-base mb-3 text-foreground">Description of the services and measures to support accessibility</h3>
              <p className="text-foreground mb-4">
                Goldsainte provides users with the capabilities to discover, search, book, and manage travel-related products or services ("Travel Experiences") across curated trip packages, agent-planned itineraries, and travel experiences. Our services are intended to be accessible across desktop and mobile websites, as well as applications ("Platforms"), allowing users to book Travel Experiences, and which support a broad range of user needs.
              </p>
              
              <p className="text-sm sm:text-base text-foreground mb-3">Specifically, we aim to deliver:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base text-foreground mb-4">
                <li><strong>Perceivable content:</strong> All visual and auditory information is presented in ways that are adaptable to users' needs.</li>
                <li><strong>Operable interface:</strong> The service is fully navigable by keyboard and works seamlessly with assistive technologies.</li>
                <li><strong>Understandable design:</strong> Our interface uses clear and simple language; it avoids unnecessary complexity.</li>
                <li><strong>Robust content:</strong> We ensure compatibility with current and future user agents, including assistive technologies.</li>
              </ul>

              <p className="text-sm sm:text-base text-foreground mb-3">In order to deliver these points, we have taken the following measures to provide more accessible services:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base text-foreground mb-4">
                <li><strong>Text-based descriptions:</strong> Detailed written information available in clear and simple language</li>
                <li><strong>Screen reader compatibility:</strong> Fully functional with popular screen readers (e.g., VoiceOver, TalkBack, NVDA, JAWS)</li>
                <li><strong>Accessible Rich Internet Applications ("ARIA") use:</strong> Implementation of ARIA roles and attributes</li>
                <li><strong>Multimedia alternatives:</strong> Subtitles, transcripts, and alternative text accompanying all visual and multimedia content, where applicable</li>
                <li><strong>High-contrast and zoom functionality:</strong> Compatible with adjustable contrast and text scaling settings and capabilities for users with visual disabilities</li>
                <li><strong>Simple navigation:</strong> Logical layouts with consistent headings, landmarks, and menus</li>
                <li><strong>Keyboard accessibility:</strong> All functions can be operated via keyboard</li>
                <li><strong>Help and support:</strong> Step-by-step content in accessible formats</li>
                <li><strong>Error notifications:</strong> Clear and descriptive error messages to guide users in resolving issues</li>
              </ul>

              <p className="text-foreground">
                Additionally, to maintain and improve conformance with Accessibility Standards and enhance every user's experience, we have implemented the following practices:
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2 text-foreground">Training and Education</h4>
              <p className="text-foreground mb-2">
                We are supporting our employees in developing the skills required to keep our services inclusive and conformant with Accessibility Standards by delivering the following:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm sm:text-base text-foreground">
                <li><strong>Role-specific, personalized training:</strong> Available for all employees on accessibility best practices.</li>
                <li><strong>Internal guidelines and documentation:</strong> Provides up-to-date knowledge for product teams and supplements the training.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2 text-foreground">Inclusive Design, Research, and Writing Practices</h4>
              <p className="text-foreground mb-2">
                We strive to ensure accessibility is considered as early as possible in the product life cycle, with support of the following:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm sm:text-base text-foreground">
                <li><strong>Accessible Design System:</strong> Our component library is built with accessibility requirements baked in, ensuring consistency on our Platform.</li>
                <li><strong>Annotation Kit:</strong> Implementation of a bespoke accessibility annotation kit and quality checklist, allowing UX designers and writers to clearly communicate requirements for assistive technology users during the development of features or flows.</li>
                <li><strong>Inclusive User Research:</strong> We conduct research and test our products with people with disabilities.</li>
                <li><strong>Non-functional requirements:</strong> Accessibility requirements are documented and are addressed at the product scoping and requirements phase.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2 text-foreground">Testing &amp; Quality Assurance ("QA") Processes</h4>
              <p className="text-foreground mb-2">
                We aim to embed accessibility testing practices within our development and QA processes, continually testing our services against the latest Accessibility Standards and detecting accessibility issues in our code.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm sm:text-base text-foreground">
                <li><strong>Automated testing:</strong> Utilizing third-party tooling to embed accessibility tests into pipeline testing and release processes. Additionally, we perform monthly automated scans of our web platforms to detect accessibility issues proactively.</li>
                <li><strong>Manual testing:</strong> Ad hoc manual testing performed as part of development and QA processes in pre- and post-production.</li>
                <li><strong>Assistive Technology Lab:</strong> Product teams have access to a range of devices set up with assistive technologies to easily test their products.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2 text-foreground">Auditing and Evaluation</h4>
              <p className="text-foreground mb-2">We conduct regular auditing with external experts to understand our performance:</p>
              <ul className="list-disc pl-6 space-y-1 text-sm sm:text-base text-foreground">
                <li><strong>Third-party audits:</strong> Periodic assessments by external accessibility experts, across all our Platforms.</li>
                <li><strong>Bug and defect management process:</strong> Robust company-wide bug tracking system, with set service level objectives for all accessibility-related bugs and defects identified from external audits.</li>
                <li><strong>Record keeping:</strong> Internal reporting on accessibility conformance maintained.</li>
                <li><strong>Self-audits:</strong> Self-audit mechanisms are in place to address coverage not captured in external audits.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2 text-foreground">Centralized Accessibility Support</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm sm:text-base text-foreground">
                <li>Centralized accessibility team established to provide guidance and support to all product teams.</li>
                <li>A cross-functional group established to support accessibility efforts across the company and spread awareness.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2 text-foreground">Feedback and Contact Information</h4>
              <p className="text-foreground mb-2">
                While we aim to ensure Digital Accessibility for all users, some limitations may exist. If you experience any issues, this section provides you with options for bringing them to our attention.
              </p>
              <p className="text-foreground mb-2">
                If you have a question about an existing booking or trip, or if you need us to get back to you, visit the Help Center.
              </p>
              <p className="text-foreground">
                If you have any questions about your Travel Experience (wheelchair access, walk-in baths, etc.), contact the service provider of the Travel Experience (including but not limited to the owner of a hotel or other property, a museum or park, or a travel specialist or service provider).
              </p>
            </div>
      </AccordionContent>
    </AccordionItem>

    {/* Customer Terms of Service */}
    <AccordionItem value="terms" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
      <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47]">
        Customer Terms of Service
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-6 text-sm sm:text-base leading-relaxed">
        <div className="flex justify-center mb-6">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-5 sm:h-7 w-auto"
          loading="lazy"/>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-foreground font-semibold mb-2">Complete Terms Available</p>
          <p className="text-sm sm:text-base text-muted-foreground mb-3">
            View the full, detailed Terms of Service document including all sections, subsections, and the Goldsainte Dictionary.
          </p>
          <Link 
            to="/terms" 
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            View Full Terms of Service Document →
          </Link>
        </div>
        
        <p className="text-sm sm:text-base text-muted-foreground">Updated October 17, 2025</p>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-base mb-3 text-foreground">A: General Terms</h3>
          
          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">A1-A3: Introduction</h3>
            <p className="text-sm sm:text-base text-foreground"><strong>A1:</strong> Certain terms in these Terms have specific meanings. Please refer to the Goldsainte Dictionary at the end of these Terms for clarity.</p>
            <p className="mt-2 text-sm sm:text-base text-foreground"><strong>A2:</strong> By using Goldsainte's platform or completing a booking, you agree to these Terms and their conditions, including mandatory arbitration for most disputes (see A20 for opt-out procedures) and waiver of class-action rights.</p>
            <p className="mt-2 text-sm sm:text-base text-foreground"><strong>A3:</strong> Goldsainte Inc., registered in Delaware, USA, provides and manages the Platform, including AI-powered services, CoCurate™ packages, Travel Agent Marketplace, and creator tools. We do not provide the travel experiences themselves—service providers are solely responsible for their services.</p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">A4-A10: Using the Platform</h3>
            <p className="text-sm sm:text-base text-foreground"><strong>A4-A10:</strong> The Platform provides AI-driven tools and marketplace for travel experiences. You must be 18+ to use it. You agree to pay all costs, follow provider policies, and comply with our terms and applicable laws. For accessibility requests on the Platform, contact Goldsainte Customer Support.</p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">A12-A14: Rewards, Insurance & Credits</h3>
            <p className="text-sm sm:text-base text-foreground"><strong>A12-A14:</strong> We offer Rewards, Credits, and Wallet for bookings and creator earnings. Insurance is governed by the provider's policy. Rewards are non-transferable and can be used for eligible purchases on the Platform.</p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">A15-A20: Legal Responsibilities</h3>
            <p className="text-sm sm:text-base text-foreground"><strong>A15-A20:</strong> We own all intellectual property rights in the Platform. Automated access or scraping is prohibited. Contact Customer Support for issues. We may suspend accounts for violations. Liability is limited to amounts paid. Disputes are resolved through binding arbitration (opt-out available within 30 days via Dispute Resolution page).</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-base mb-3 text-foreground">B-E: Service-Specific Terms</h3>
          
          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">B: Accommodations</h3>
            <p className="text-sm sm:text-base text-foreground">Booking is directly with the Service Provider; Goldsainte is not a contractual party. Service Providers are responsible for accuracy of information (facilities, policies, availability). Goldsainte provides the platform to search, compare, and book. Features include Price-Match (subject to criteria), Partner Offers (non-modifiable except for free cancellations), and Damage Policy (for property damage claims).</p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">C: Attractions</h3>
            <p className="text-sm sm:text-base text-foreground">Booking is with the Service Provider or Third-Party Aggregator; Goldsainte is not a contractual party. Goldsainte provides the platform for search, booking, and confirmation. Payment is organized through Goldsainte.</p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">E: Flights</h3>
            <p className="text-sm sm:text-base text-foreground">Booking is with the airline (via Third-Party Aggregator); Goldsainte is not a contractual party. You enter into an Intermediation Contract with the Aggregator and a Contract of Carriage with the airline. Your Contract of Carriage governs cancellations, changes, and refunds. You are responsible for all travel documentation (passport, visas) and for compliance with check-in and boarding requirements. Charges may include taxes, service fees, baggage, and seat selection. Prohibited practices (e.g., buying flights you don't intend to use) are not allowed. Code-share flights may be operated by a different airline. US regulations for passengers with reduced mobility may apply.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="font-semibold text-base mb-3 text-foreground">Governing Law</h3>
          <p className="text-sm sm:text-base text-foreground">Disputes not subject to arbitration will be resolved in state or federal courts in Delaware (or your county for small claims), and these Terms are governed by Delaware law.</p>
        </div>
      </AccordionContent>
    </AccordionItem>

    {/* Dispute Resolution */}
    <AccordionItem value="dispute-resolution" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
      <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47]">
        Dispute Resolution
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-6 text-sm sm:text-base leading-relaxed">
        <div className="flex justify-center mb-6">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-5 sm:h-7 w-auto"
          loading="lazy"/>
        </div>
        <p className="text-sm sm:text-base text-foreground">
          Goldsainte AI/Goldsainte Inc. is committed to resolving any disputes fairly and efficiently through a structured process.
        </p>
        
        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">A. Overview</h3>
          <p className="text-sm sm:text-base text-foreground">
            In the event of a disagreement, dispute, or claim arising from your use of our Platform or services, 
            we provide multiple resolution pathways including informal resolution, mediation, and arbitration.
          </p>
          <p className="mt-2 text-sm sm:text-base text-foreground">
            By using Goldsainte AI/Goldsainte Inc., you agree to resolve disputes according to the terms outlined below.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">B. Informal Resolution</h3>
          <p className="text-sm sm:text-base text-foreground">Before initiating formal legal action, you agree to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-sm sm:text-base text-foreground">
            <li>Contact Goldsainte AI/Goldsainte Inc. Customer Support promptly via your account, app, or Help Center.</li>
            <li>Provide relevant details including booking reference, contact information, issue summary, and supporting documentation.</li>
            <li>Allow us 30 days to review and attempt to resolve the issue informally.</li>
          </ul>
          <p className="mt-2 text-sm sm:text-base text-foreground">Most disputes are resolved at this stage without further escalation.</p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">C. Mediation</h3>
          <p className="text-sm sm:text-base text-foreground">If a dispute cannot be resolved informally, mediation is the next step:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-sm sm:text-base text-foreground">
            <li>Either party may initiate mediation by providing written notice.</li>
            <li>A mutually agreed-upon, neutral third-party mediator will facilitate the process.</li>
            <li>Mediation sessions take place virtually or in-person in Dover, Delaware, USA.</li>
            <li>Both parties must participate in good faith.</li>
            <li>Costs are shared equally unless otherwise agreed.</li>
            <li>If unresolved within 60 days, either party may proceed to arbitration.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">D. Arbitration</h3>
          <p className="text-sm sm:text-base text-foreground">All disputes that cannot be resolved through informal resolution or mediation will be resolved through binding arbitration:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-sm sm:text-base text-foreground">
            <li><strong>Arbitration Rules:</strong> Conducted under American Arbitration Association (AAA) rules.</li>
            <li><strong>Location:</strong> Dover, Delaware, USA, unless both parties agree otherwise.</li>
            <li><strong>Arbitrator:</strong> A single neutral arbitrator with relevant travel industry experience.</li>
            <li><strong>Decision:</strong> Final, binding, and enforceable in any court of competent jurisdiction.</li>
            <li><strong>Costs:</strong> Each party bears its own costs, including attorney's fees, unless determined otherwise.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">E. Exceptions</h3>
          <p className="text-sm sm:text-base text-foreground">Arbitration does not prevent either party from:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-sm sm:text-base text-foreground">
            <li>Seeking urgent injunctive or equitable relief in a court of competent jurisdiction.</li>
            <li>Filing claims in small claims court for amounts within the applicable jurisdictional limit.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">F. Class Action Waiver</h3>
          <p className="text-sm sm:text-base text-foreground">
            You and Goldsainte AI/Goldsainte Inc. agree that all disputes must be resolved individually, and not as a class or consolidated action. 
            Any arbitration or legal proceeding will apply only to you and us, and not to any other user or third party.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">G. Governing Law and Jurisdiction</h3>
          <p className="text-sm sm:text-base text-foreground">
            This Dispute Resolution section is governed by the laws of the State of Delaware, USA, without regard to its conflict of law rules. 
            Any court with jurisdiction in Kent County, Delaware may enforce arbitration awards or hear matters excluded from arbitration.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">H. Severability</h3>
          <p className="text-sm sm:text-base text-foreground">
            If any provision of this Dispute Resolution section is found invalid or unenforceable, the remaining provisions remain fully in effect.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">I. Contact for Disputes</h3>
          <div className="bg-muted p-4 rounded-lg mt-2">
            <p className="font-semibold">Goldsainte Ai / Goldsainte Inc.</p>
            <p>850 New Burton Road, Suite 201</p>
            <p>Dover, DE, 19904, County of Kent, USA</p>
            <p>Email: support@goldsainte.com</p>
          </div>
        </div>

        <Button
          onClick={() => window.location.href = '/dispute-resolution'}
          className="mt-4 w-full"
        >
          Submit Dispute Resolution Form
        </Button>
      </AccordionContent>
    </AccordionItem>

    {/* What We Do */}
    <AccordionItem value="what-we-do" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
      <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47]">
        What We Do
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-6 text-sm sm:text-base leading-relaxed">
        <div className="flex justify-center mb-6">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-5 sm:h-7 w-auto"
          loading="lazy"/>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-foreground font-semibold mb-2">Complete Service Details Available</p>
          <p className="text-sm sm:text-base text-muted-foreground mb-3">
            View the full, detailed information about all Goldsainte services including curated trip packages, agent-planned itineraries, and creator-led travel experiences.
          </p>
          <Link 
            to="/what-we-do" 
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            View Full Service Details →
          </Link>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-base mb-3 text-foreground">Our Services Overview</h3>
          
          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">How Our Platform Works</h3>
            <p className="text-sm sm:text-base text-foreground">Goldsainte provides an AI-powered marketplace that connects travelers with certified travel agents and travel creators to design curated trip packages, agent-planned itineraries, and creator-led travel experiences. When you book, you enter into a direct contract with the relevant specialist or supplier.</p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">1. Accommodations</h3>
            <p className="text-sm sm:text-base text-foreground">Search, compare, and book hotels and properties worldwide. Our platform displays real-time availability, pricing, and reviews from verified guests. Service Providers set their own rates and policies.</p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">2. Attractions</h3>
            <p className="text-sm sm:text-base text-foreground">Discover and book tours, activities, and attractions at your destination. We work with Service Providers and Third-Party Aggregators to offer a wide selection of experiences with transparent pricing.</p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">How We Make Money</h3>
            <p className="text-sm sm:text-base text-foreground">Goldsainte earns commission from Service Providers after bookings are completed. We don't charge booking fees to customers. Properties with "Preferred Partner" or "Ad" badges pay higher commissions for enhanced visibility.</p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 text-foreground">AI-Powered Recommendations</h3>
            <p className="text-sm sm:text-base text-foreground">Our recommendation systems use your search criteria, past interactions, and property performance metrics to suggest travel options you'll love. You can adjust sorting preferences and disable personalization in your account settings.</p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="human-rights" id="human-rights" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
      <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47]">
        Human Rights Statement
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-6 text-sm sm:text-base leading-relaxed">
        <div className="flex justify-center mb-6">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-5 sm:h-7 w-auto"
          loading="lazy"/>
        </div>
        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">1. Introduction</h3>
          <p className="text-sm sm:text-base text-foreground">
            Goldsainte is committed to respecting and promoting human rights wherever we operate. We believe that travel can bring out the best in humanity, and our mission is to ensure that our business activities and partnerships support this principle.
          </p>
          <p className="text-sm sm:text-base text-foreground mt-4">
            This statement articulates our approach to respecting and promoting human rights, in alignment with internationally recognized standards such as the United Nations Guiding Principles on Business and Human Rights and the International Bill of Human Rights.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">2. Our Commitment</h3>
          <p className="text-sm sm:text-base text-foreground mb-3">Goldsainte is committed to:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base text-foreground">
            <li>Respecting the rights and dignity of all individuals, including employees, contractors, suppliers, and travelers.</li>
            <li>Preventing, mitigating, and addressing adverse human rights impacts connected to our operations, products, and services.</li>
            <li>Promoting ethical business practices and positive social outcomes across all regions in which we operate.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">3. Scope</h3>
          <p className="text-sm sm:text-base text-foreground">
            This statement applies to all Goldsainte employees, contractors, suppliers, partners, and service providers. We also expect our business partners and supply chain participants to uphold the same human rights principles and standards.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">4. Human Rights Principles</h3>
          <p className="text-sm sm:text-base text-foreground mb-3">Goldsainte recognizes the following key principles as fundamental to our human rights approach:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base text-foreground">
            <li><strong>Non-discrimination:</strong> We do not tolerate discrimination based on race, ethnicity, gender, sexual orientation, religion, disability, or any other characteristic.</li>
            <li><strong>Freedom from forced labor:</strong> We prohibit forced, bonded, or compulsory labor in our operations and supply chain.</li>
            <li><strong>Child protection:</strong> We do not tolerate child labor in any form.</li>
            <li><strong>Health, safety, and well-being:</strong> We are committed to safe and healthy workplaces and promote well-being for all employees and travelers.</li>
            <li><strong>Freedom of association and collective bargaining:</strong> We respect the rights of workers to organize and engage in collective bargaining where legally permitted.</li>
            <li><strong>Privacy and data protection:</strong> We protect the personal data of our employees, travelers, and partners in accordance with applicable privacy laws.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">5. Due Diligence and Risk Management</h3>
          <p className="text-sm sm:text-base text-foreground mb-3">Goldsainte actively assesses human rights risks in our operations and supply chains. Key measures include:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base text-foreground">
            <li>Conducting supplier due diligence and audits.</li>
            <li>Integrating human rights considerations into procurement and partnership decisions.</li>
            <li>Monitoring, reporting, and addressing human rights concerns through established policies and procedures.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">6. Training and Awareness</h3>
          <p className="text-sm sm:text-base text-foreground">
            We provide training and resources for employees, contractors, and partners to ensure awareness of human rights risks and responsibilities. This includes guidance on how to identify and respond to potential human rights violations.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">7. Reporting and Accountability</h3>
          <p className="text-sm sm:text-base text-foreground">
            Goldsainte encourages employees, partners, and stakeholders to raise concerns or report potential human rights issues through our whistleblower channels or direct contact with our compliance team. All reports are investigated promptly and confidentially.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">8. Continuous Improvement</h3>
          <p className="text-sm sm:text-base text-foreground">
            We are committed to continually improving our human rights practices. We regularly review policies, procedures, and business operations to strengthen our human rights performance and align with evolving international standards.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">9. Approval</h3>
          <p className="text-sm sm:text-base text-foreground mb-4">
            This statement has been approved by the Board of Directors of Goldsainte and is signed on behalf of the company by:
          </p>
              <div className="bg-muted p-4 rounded-lg leading-tight space-y-0">
                <p className="font-semibold text-foreground">Andre C. Powell</p>
                <p className="text-muted-foreground">CEO & Founder, Goldsainte</p>
              </div>
        </div>
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="investor-relations" id="investor-relations" className="border-0 rounded-lg px-4 sm:px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
      <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline text-[#0c4d47]">
        Investor Relations
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-6 text-sm sm:text-base leading-relaxed">
        <div className="flex justify-center mb-6">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-5 sm:h-7 w-auto"
          loading="lazy"/>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
            Investor Relations — Goldsainte, Inc.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Redefining Luxury Travel with AI, Agents & Creators
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">Our Vision</h3>
          <p className="text-sm sm:text-base text-foreground">
            Goldsainte, Inc. is building the world's first AI-powered travel marketplace that combines real-time booking, AI trip planning, specialist matching, and creator-led experiences — all in one platform. By integrating technology, social media, and curated travel, we aim to transform how people discover, book, and experience travel.
          </p>
          <p className="text-sm sm:text-base text-foreground mt-4">
            Our vision is to empower travelers with personalized experiences, enable creators to monetize content meaningfully, and provide agents with dynamic opportunities — all while generating value for our shareholders.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">Why Invest in Goldsainte</h3>
          <p className="text-sm sm:text-base text-foreground mb-4">
            Goldsainte sits at the convergence of luxury travel, AI, and social commerce, offering investors access to a scalable, data-driven ecosystem with diverse revenue streams.
          </p>

          <div className="mb-4">
            <h4 className="font-semibold text-sm sm:text-base mb-2 text-foreground">AI-Powered Travel Marketplace</h4>
            <div className="pl-4 space-y-1 text-sm sm:text-base text-foreground">
              <p><strong>End-to-End Booking:</strong> Users can plan, customize, and book trips in real-time using AI-assisted planning and certified travel specialists.</p>
              <p><strong>Personalized Recommendations:</strong> Proprietary algorithms analyze traveler behavior, preferences, and past bookings to deliver highly targeted suggestions.</p>
              <p><strong>Dynamic Pricing:</strong> AI-driven insights help optimize trip margins while providing competitive pricing.</p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-sm sm:text-base mb-2 text-foreground">Agent Bidding Model</h4>
            <div className="pl-4 space-y-1 text-sm sm:text-base text-foreground">
              <p><strong>Competitive Agent Marketplace:</strong> Travel agents bid for bookings, creating value for travelers and ensuring high-quality service.</p>
              <p><strong>Revenue Optimization:</strong> Success fees and service commissions drive predictable revenue for the platform.</p>
              <p><strong>Data-Driven Matching:</strong> AI matches agents to travelers based on expertise, location, and previous performance.</p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-sm sm:text-base mb-2 text-foreground">Creator-Led Experiences</h4>
            <div className="pl-4 space-y-1 text-sm sm:text-base text-foreground">
              <p><strong>Monetized Content:</strong> Influencers and travel creators earn revenue by designing and promoting trips.</p>
              <p><strong>CoCurated Packages:</strong> High-quality, authentic itineraries attract users and increase engagement.</p>
              <p><strong>Social Commerce Integration:</strong> Creator-driven promotions amplify reach and drive bookings.</p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-sm sm:text-base mb-2 text-foreground">Luxury Positioning</h4>
            <div className="pl-4 space-y-1 text-sm sm:text-base text-foreground">
              <p><strong>Curated Packages:</strong> Premium experiences with detailed itineraries, exclusive access, and personalized amenities.</p>
              <p><strong>Industry Partnerships:</strong> Integrations with leading AI and travel technology providers.</p>
              <p><strong>Brand Differentiation:</strong> Combining AI technology, creator influence, and travel expertise positions Goldsainte uniquely in the luxury segment.</p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-sm sm:text-base mb-2 text-foreground">Scalable Growth</h4>
            <div className="pl-4 space-y-1 text-sm sm:text-base text-foreground">
              <p><strong>Global Market Reach:</strong> Multi-currency, multi-language support enables international expansion.</p>
              <p><strong>Modular Ecosystem:</strong> Flights, hotels, cars, restaurants, and events can scale independently.</p>
              <p><strong>Network Effects:</strong> Travelers attract agents; agents attract creators; creators attract travelers — creating a self-reinforcing growth loop.</p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-sm sm:text-base mb-2 text-foreground">Data & AI Advantage</h4>
            <div className="pl-4 space-y-1 text-sm sm:text-base text-foreground">
              <p><strong>AI Itinerary Builder:</strong> Personalised trip planning matched to certified travel specialists.</p>
              <p><strong>Predictive Analytics:</strong> Insights from search, bookings, and user engagement enable demand forecasting, seasonal offers, and upsell opportunities.</p>
              <p><strong>Rich Data Moat:</strong> User behavior, booking history, agent performance, and creator engagement provide unique competitive intelligence.</p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-sm sm:text-base mb-2 text-foreground">Diverse Revenue Streams</h4>
            <div className="pl-4 space-y-1 text-sm sm:text-base text-foreground">
              <p><strong>Agent Commissions:</strong> Service + success fees from agent bookings.</p>
              <p><strong>Creator Partnerships:</strong> Content monetization, affiliate deals, and brand collaborations.</p>
              <p><strong>Vendor Subscriptions:</strong> Multi-tiered plans (Bronze–Platinum) with marketing, analytics, and exposure benefits.</p>
              <p><strong>Platform Fees:</strong> Co-curated trip commissions and premium package fees.</p>
              <p><strong>Future Revenue Opportunities:</strong> Traveler subscriptions, premium listings, API/B2B offerings, and loyalty programs.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">Competitive Advantage / Moat</h3>
          <div className="pl-4 space-y-1 text-sm sm:text-base text-foreground">
            <p><strong>Proprietary Technology:</strong> AI trip planning, specialist matching, and personalised recommendation systems.</p>
            <p><strong>Triple-Sided Network:</strong> Integrated ecosystem connecting travelers, agents, and creators.</p>
            <p><strong>Trust & Safety Infrastructure:</strong> Verified agents, content moderation, escrow payouts, and transparent reviews.</p>
            <p><strong>Brand Loyalty:</strong> Curated trips and high-quality creator content increase repeat bookings and engagement.</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">Vision & Roadmap</h3>
          <div className="pl-4 space-y-1 text-sm sm:text-base text-foreground">
            <p><strong>Near-Term (0–6 months):</strong> AI-powered trip planning and agent matching, expanded agent and creator network, creator monetization, and dynamic pricing.</p>
            <p><strong>Mid-Term (6–12 months):</strong> International expansion, traveler subscription tiers, B2B API launch, and predictive AI for personalized packages.</p>
            <p><strong>Long-Term (12–24 months):</strong> White-label agency solutions, AR/VR trip previews, blockchain loyalty program, and crypto payment integration.</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">Key Information</h3>
          <div className="pl-4 space-y-1 text-sm sm:text-base text-foreground">
            <p><strong>Corporate Headquarters:</strong> 850 New Burton Road, Suite 201, Dover, DE, 19904, County of Kent</p>
            <p><strong>Incorporation:</strong> Delaware, USA</p>
            <p><strong>Stock Information:</strong> Goldsainte is currently a privately held company exploring strategic funding opportunities.</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">Governance</h3>
          <p className="text-sm sm:text-base text-foreground">
            We are committed to transparency, ethical business practices, and strong governance. Our leadership team brings deep experience in entrepreneurship, travel, technology, and scaling companies in dynamic markets.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">Human Rights Statement</h3>
          <p className="text-sm sm:text-base text-foreground">
            For detailed information, please refer to our Human Rights Statement above.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">Contact Investor Relations</h3>
          <p className="text-sm sm:text-base text-foreground mb-2">
            For investor inquiries, please contact:
          </p>
          <p className="text-sm sm:text-base">
            📧 <a href="mailto:investors@goldsainte.com" className="text-[#0c4d47] hover:underline font-medium">investors@goldsainte.com</a>
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>

    </Accordion>
    </div>
  );
};

export default About;