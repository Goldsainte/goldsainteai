import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import founderImage from "@/assets/founder.jpg";
import amadeusLogo from "@/assets/Amadeus_CRS_Logo.svg";
import ticketmasterLogo from "@/assets/TicketMaster_wordmark.svg";
import openaiLogo from "@/assets/OpenAI_Logo.svg";
import geminiLogo from "@/assets/Google_Gemini_logo_2025.svg";
import shopifyLogo from "@/assets/shopify-logo.svg";
import etsyLogo from "@/assets/etsy-logo.svg";
import goldsainteLogo from "@/assets/wordmark-green.svg";
import primaryLogoGreen from "@/assets/primary-horizontal-logo-green.svg";
import { 
  Mic, Sparkles, Share2, Briefcase, Package, BarChart3, 
  DollarSign, Users, FileCheck, MessageCircle, 
} from "lucide-react";

const About = () => {
  const partners = [
    { name: "Amadeus", logo: amadeusLogo },
    { name: "Ticketmaster", logo: ticketmasterLogo },
    { name: "OpenAI", logo: openaiLogo },
    { name: "Google Gemini", logo: geminiLogo },
    { name: "Shopify", logo: shopifyLogo },
    { name: "Etsy", logo: etsyLogo }
  ];

  const featureCategories = [
    {
      category: "AI-Powered Intelligence",
      features: [
        {
          icon: Mic,
          title: "Voice AI Concierge",
          description: "Just say 'Hey, Goldsainte' anywhere on our site to start a natural conversation about flights, hotels, dining, and more—hands-free."
        },
        {
          icon: Sparkles,
          title: "Personal AI Agent",
          description: "Your AI learns your style, budget, and preferences to deliver smarter, personalized recommendations every time you travel."
        }
      ]
    },
    {
      category: "Creator Economy",
      features: [
        {
          icon: Share2,
          title: "Create, Share & Earn",
          description: "A social platform where content creators can showcase journeys, build interactive travel plans, and generate income."
        },
        {
          icon: Package,
          title: "CoCutures™ Packages",
          description: "Exclusive travel experiences designed by top creators and experts, blending inspiration with seamless booking."
        },
        {
          icon: BarChart3,
          title: "Creator Dashboard",
          description: "Comprehensive tools, analytics, and partnerships—all built to empower creators with insights and growth."
        },
        {
          icon: DollarSign,
          title: "Creator Payouts",
          description: "Multiple revenue streams with tiered commissions (5-15%) based on performance and engagement."
        }
      ]
    },
    {
      category: "Seamless Experience",
      features: [
        {
          icon: Briefcase,
          title: "Expert Agent Marketplace",
          description: "Post complex itineraries, get AI-matched with certified agents, and pay securely in milestones with real-time tracking."
        },
        {
          icon: Users,
          title: "Group Bookings & Split Payments",
          description: "Make group planning seamless with secure payment links, split tracking, and transparent cost sharing."
        },
        {
          icon: FileCheck,
          title: "Itinerary Management",
          description: "Keep everything organized—day-by-day plans, document uploads, calendar sync, and travel information in one place."
        },
        {
          icon: MessageCircle,
          title: "Real-Time Communication",
          description: "Instant chat with agents, push notifications for updates, and seamless communication throughout your journey."
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
      {/* Page Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <img 
            src={goldsainteLogo} 
            alt="Goldsainte" 
            className="h-5 sm:h-7 w-auto"
          />
        </div>
        <p className="text-sm text-muted-foreground max-w-4xl mx-auto leading-relaxed">
          Discover. Book. Create. Earn. — Travel Reinvented with AI, Agent Bidding & Creator Collaborations. Plan faster with AI, let agents bid to save more, or book CoCurated trips built by pros, amplified by creators, and designed to deliver real value.
        </p>
      </div>

      {/* Letter from the Founder - Main, Visible Section */}
      <Card className="mb-8 border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Letter from the Founder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-[200px_1fr] gap-8">
            {/* Founder Image */}
            <div className="flex justify-center md:justify-start">
              <div className="w-[200px] h-[250px] rounded-lg overflow-hidden shadow-md">
                <img 
                  src={founderImage}
                  alt="Goldsainte Founder"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Letter Content */}
            <div className="space-y-4 text-base leading-relaxed">
              <p className="text-foreground">
                When Goldsainte first launched, people asked how we were different from other services. The answer was clear: we brought innovation, safety, and elevated experiences to transportation. Today, we've grown far beyond those roots.
              </p>
              
              <p className="text-foreground font-semibold">
                We're now building something bigger: a global AI-powered travel ecosystem that transforms how people explore, plan, and share their adventures.
              </p>

              <p className="text-foreground">
                At Goldsainte, we believe travel is more than logistics—it's about creating experiences worth sharing, building community, and empowering both travelers and creators to thrive.
              </p>
              
              <p className="text-foreground">
                From our beginnings to today's AI-driven platform, we've always stood for trust, innovation, and empowerment. The future of travel isn't just about where you go—it's about how seamlessly and meaningfully you get there.
              </p>
              
              <p className="text-foreground italic mt-4">
                Thank you for being part of this journey. The best adventures are still ahead.
              </p>
              
              <div className="mt-6 text-foreground">
                <p className="font-semibold">Andre C. Powell Jr.</p>
                <p>CEO & Founder</p>
                <p>Goldsainte, Inc.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expandable Sections */}
      <Accordion type="single" collapsible className="space-y-4">
        
        {/* What Is Goldsainte */}
        <AccordionItem value="what-is" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-base font-medium hover:no-underline text-[#0c4d47]">
            What is Goldsainte?
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4 text-base leading-relaxed">
            <div className="flex justify-center mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-5 sm:h-7 w-auto"
              />
            </div>
            <p className="text-foreground">
              Goldsainte AI is a voice-activated, AI-powered travel marketplace that merges automation with verified human expertise to deliver fully personalized, end-to-end trip planning and booking. With the wake word "Hey, Goldsainte," users can engage a conversational concierge to search, plan, and book flights, hotels, dining, events, and transportation—completely hands-free and in real-time.
            </p>
            <p className="text-foreground">
              At the core of the platform is a travel agent marketplace where users can post complex itineraries, receive competitive bids from certified agents, and pay securely through milestone-based transactions. The system supports group bookings, split payments, full itinerary management, and real-time messaging, making it easy to coordinate even the most intricate trips.
            </p>
            <p className="text-foreground">
              Goldsainte also powers a unique creator economy: content creators collaborate with agents to co-create and promote curated travel experiences, while transportation vendors can onboard, promote their services, and be included in creator or agent-led packages. This three-way ecosystem—AI + Agents + Creators—makes Goldsainte the first platform to unify inspiration, planning, and booking within one intelligent, social commerce environment.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* What We Offer */}
        <AccordionItem value="features" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-base font-medium hover:no-underline text-[#0c4d47]">
            What We Offer
          </AccordionTrigger>
          <AccordionContent className="pt-6 space-y-8">
            <div className="flex justify-center mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-5 sm:h-7 w-auto"
              />
            </div>
            {featureCategories.map((category, idx) => (
              <div key={category.category}>
                <h3 className="text-base font-semibold mb-4 text-foreground">{category.category}</h3>
                <div className="grid gap-4">
                  {category.features.map((feature) => (
                    <div 
                      key={feature.title}
                      className="flex gap-4 items-start p-4 rounded-lg hover:bg-accent/50 transition-all"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base mb-1 text-foreground">{feature.title}</h4>
                        <p className="text-base text-muted-foreground">{feature.description}</p>
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
        <AccordionItem value="mission" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-base font-medium hover:no-underline text-[#0c4d47]">
            Our Mission
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4 text-base leading-relaxed">
            <div className="flex justify-center mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-5 sm:h-7 w-auto"
              />
            </div>
            <p className="text-foreground">
              At Goldsainte, we believe that travel is more than just booking a flight or reserving a hotel—it's about creating unforgettable experiences, building meaningful connections, and empowering people to share their journeys in ways that inspire others.
            </p>
            <p className="text-foreground">
              Our mission is to redefine the travel industry by combining cutting-edge AI technology with the creativity and passion of travelers, creators, and travel experts worldwide. We're dedicated to making travel more accessible, personalized, and rewarding.
            </p>
            <p className="text-foreground">
              Whether you're a solo explorer seeking hidden gems, a content creator building your brand, or a travel expert sharing your knowledge, Goldsainte provides the tools, platform, and community to help you thrive.
            </p>
            <p className="text-foreground">
              Our AI-powered ecosystem is designed to simplify the complexities of travel planning while preserving the magic of discovery. From voice-activated concierge services to personalized AI agents that learn your travel style, we're leveraging technology to make every journey smarter, smoother, and more enjoyable.
            </p>
            <p className="text-foreground">
              Ultimately, our mission is to transform how the world travels. We're creating an ecosystem where technology enhances human experience, where creators are valued and rewarded, and where every journey—no matter how big or small—becomes a story worth sharing.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Partners & Technology */}
        <AccordionItem value="partners" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-base font-medium hover:no-underline text-[#0c4d47]">
            Our Partners & Technology
          </AccordionTrigger>
          <AccordionContent className="pt-6">
            <div className="flex justify-center mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-5 sm:h-7 w-auto"
              />
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
                  />
                </div>
              ))}
            </div>
            <p className="text-base text-muted-foreground text-center">
              Goldsainte leverages industry leaders like Amadeus, Ticketmaster, OpenAI, Google Gemini, Shopify, and Etsy to bring you curated and real-time travel experiences and seamless marketplace integrations.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Legal */}
        <AccordionItem value="legal" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-base font-medium hover:no-underline text-[#0c4d47]">
            Legal
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4 text-base leading-relaxed">
            <div className="flex justify-center mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-5 sm:h-7 w-auto"
              />
            </div>
            <p className="text-foreground">
              Goldsainte Inc. (the company behind Goldsainte™) is registered and based in Delaware, USA ("Goldsainte," "we," "us," or "our"), from where it provides its AI-powered luxury travel and booking platform (the "Service") on its website (the "Website"), and is supported internationally by its affiliated group companies (the "Support Companies"). The Support Companies provide internal and operational support only. They do not render the Service and do not own, operate, or manage the Website or any other website.
            </p>
            <p className="text-foreground">
              For any questions regarding Goldsainte, the Service, or the Website, or to send or serve any documents, notices, correspondence, or other communications—including press inquiries—please contact Goldsainte Inc. directly at its registered office in Delaware.
            </p>
            <p className="text-foreground">
              Goldsainte Inc. does not maintain a legal domicile at any other location or office, including the offices of its Support Companies. The Support Companies are not authorized to act as a process agent or service agent for Goldsainte Inc., and no bookings or reservations can be made through the Support Companies.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Accessibility Statement */}
        <AccordionItem value="accessibility" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
          <AccordionTrigger className="text-base font-medium hover:no-underline text-[#0c4d47]">
            Accessibility Statement
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-6 text-base leading-relaxed">
            <div className="flex justify-center mb-6">
              <img 
                src={primaryLogoGreen} 
                alt="Goldsainte" 
                className="h-5 sm:h-7 w-auto"
              />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-3 text-foreground">Accessibility Statement for Goldsainte</h3>
              <p className="text-foreground">
                At Goldsainte, our mission is to make it easier for everyone to experience the world. We are committed to delivering barrier-free, inclusive experiences for all our users, and this involves making our digital services accessible to everyone, including persons with disabilities.
              </p>
            </div>
            
            <p className="text-foreground">
              We are continuously working to improve the accessibility of our digital services. This statement has been prepared to inform users about how we make our services more accessible, including aligning with the currently applicable EU standards on accessibility requirements for ICT products and services ("Accessibility Standards"). This accessibility statement applies to the portions of our services covered by the European Accessibility Act.
            </p>

            <div>
              <h3 className="font-semibold text-base mb-3 text-foreground">Description of the services and measures to support accessibility</h3>
              <p className="text-foreground mb-4">
                Goldsainte provides users with the capabilities to discover, search, book, and manage travel-related products or services ("Travel Experiences") across accommodations, car rental, flights, taxis, and attractions. Our services are intended to be accessible across desktop and mobile websites, as well as applications ("Platforms"), allowing users to book Travel Experiences, and which support a broad range of user needs.
              </p>
              
              <p className="text-foreground mb-3">Specifically, we aim to deliver:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground mb-4">
                <li><strong>Perceivable content:</strong> All visual and auditory information is presented in ways that are adaptable to users' needs.</li>
                <li><strong>Operable interface:</strong> The service is fully navigable by keyboard and works seamlessly with assistive technologies.</li>
                <li><strong>Understandable design:</strong> Our interface uses clear and simple language; it avoids unnecessary complexity.</li>
                <li><strong>Robust content:</strong> We ensure compatibility with current and future user agents, including assistive technologies.</li>
              </ul>

              <p className="text-foreground mb-3">In order to deliver these points, we have taken the following measures to provide more accessible services:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground mb-4">
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
              <ul className="list-disc pl-6 space-y-1 text-foreground">
                <li><strong>Role-specific, personalized training:</strong> Available for all employees on accessibility best practices.</li>
                <li><strong>Internal guidelines and documentation:</strong> Provides up-to-date knowledge for product teams and supplements the training.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2 text-foreground">Inclusive Design, Research, and Writing Practices</h4>
              <p className="text-foreground mb-2">
                We strive to ensure accessibility is considered as early as possible in the product life cycle, with support of the following:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-foreground">
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
              <ul className="list-disc pl-6 space-y-1 text-foreground">
                <li><strong>Automated testing:</strong> Utilizing third-party tooling to embed accessibility tests into pipeline testing and release processes. Additionally, we perform monthly automated scans of our web platforms to detect accessibility issues proactively.</li>
                <li><strong>Manual testing:</strong> Ad hoc manual testing performed as part of development and QA processes in pre- and post-production.</li>
                <li><strong>Assistive Technology Lab:</strong> Product teams have access to a range of devices set up with assistive technologies to easily test their products.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2 text-foreground">Auditing and Evaluation</h4>
              <p className="text-foreground mb-2">We conduct regular auditing with external experts to understand our performance:</p>
              <ul className="list-disc pl-6 space-y-1 text-foreground">
                <li><strong>Third-party audits:</strong> Periodic assessments by external accessibility experts, across all our Platforms.</li>
                <li><strong>Bug and defect management process:</strong> Robust company-wide bug tracking system, with set service level objectives for all accessibility-related bugs and defects identified from external audits.</li>
                <li><strong>Record keeping:</strong> Internal reporting on accessibility conformance maintained.</li>
                <li><strong>Self-audits:</strong> Self-audit mechanisms are in place to address coverage not captured in external audits.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2 text-foreground">Centralized Accessibility Support</h4>
              <ul className="list-disc pl-6 space-y-1 text-foreground">
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
                If you have any questions about your Travel Experience (wheelchair access, walk-in baths, etc.), contact the service provider of the Travel Experience (including but not limited to the owner of a hotel or other property, a museum or park, or a car rental company or airline).
              </p>
            </div>
      </AccordionContent>
    </AccordionItem>

    {/* Customer Terms of Service */}
    <AccordionItem value="terms" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
      <AccordionTrigger className="text-base font-medium hover:no-underline text-[#0c4d47]">
        Customer Terms of Service
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-6 text-base leading-relaxed">
        <div className="flex justify-center mb-6">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-5 sm:h-7 w-auto"
          />
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-foreground font-semibold mb-2">Complete Terms Available</p>
          <p className="text-base text-muted-foreground mb-3">
            View the full, detailed Terms of Service document including all sections, subsections, and the Goldsainte Dictionary.
          </p>
          <Link 
            to="/terms" 
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            View Full Terms of Service Document →
          </Link>
        </div>
        
        <p className="text-base text-muted-foreground">Updated October 17, 2025</p>
        
        <div className="space-y-4">
          <h3 className="text-base font-semibold">A: General Terms</h3>
          
          <div>
            <h4 className="font-semibold mb-2">A1-A3: Introduction</h4>
            <p><strong>A1:</strong> Certain terms in these Terms have specific meanings. Please refer to the Goldsainte Dictionary at the end of these Terms for clarity.</p>
            <p className="mt-2"><strong>A2:</strong> By using Goldsainte's platform or completing a booking, you agree to these Terms and their conditions, including mandatory arbitration for most disputes (see A20 for opt-out procedures) and waiver of class-action rights.</p>
            <p className="mt-2"><strong>A3:</strong> Goldsainte Inc., registered in Delaware, USA, provides and manages the Platform, including AI-powered services, CoCurate™ packages, Travel Agent Marketplace, and creator tools. We do not provide the travel experiences themselves—service providers are solely responsible for their services.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">A4-A10: Using the Platform</h4>
            <p><strong>A4-A10:</strong> The Platform provides AI-driven tools and marketplace for travel experiences. You must be 18+ to use it. You agree to pay all costs, follow provider policies, and comply with our terms and applicable laws. For accessibility requests on the Platform, contact Goldsainte Customer Support.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">A12-A14: Rewards, Insurance & Credits</h4>
            <p><strong>A12-A14:</strong> We offer Rewards, Credits, and Wallet for bookings and creator earnings. Insurance is governed by the provider's policy. Rewards are non-transferable and can be used for eligible purchases on the Platform.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">A15-A20: Legal Responsibilities</h4>
            <p><strong>A15-A20:</strong> We own all intellectual property rights in the Platform. Automated access or scraping is prohibited. Contact Customer Support for issues. We may suspend accounts for violations. Liability is limited to amounts paid. Disputes are resolved through binding arbitration (opt-out available within 30 days via Dispute Resolution page).</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold">B-E: Service-Specific Terms</h3>
          
          <div>
            <h4 className="font-semibold mb-2">B: Accommodations</h4>
            <p>Booking is directly with the Service Provider; Goldsainte is not a contractual party. Service Providers are responsible for accuracy of information (facilities, policies, availability). Goldsainte provides the platform to search, compare, and book. Features include Price-Match (subject to criteria), Partner Offers (non-modifiable except for free cancellations), and Damage Policy (for property damage claims).</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">C: Attractions</h4>
            <p>Booking is with the Service Provider or Third-Party Aggregator; Goldsainte is not a contractual party. Goldsainte provides the platform for search, booking, and confirmation. Payment is organized through Goldsainte.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">D: Car Rentals</h4>
            <p>Booking may be with Goldsainte Transport Limited or the Service Provider. The Rental Agreement signed at pickup governs the rental and supersedes these Terms if there are discrepancies. Only the Main Driver can manage the booking unless authorized otherwise. Full refund if canceled more than 48 hours before rental; partial refund if canceled less than 48 hours before rental (deduct 3 days cost); no refund after rental start or for no-show. Driver age limits and additional fees (young/elderly driver, one-way, cross-border) may apply.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">E: Flights</h4>
            <p>Booking is with the airline (via Third-Party Aggregator); Goldsainte is not a contractual party. You enter into an Intermediation Contract with the Aggregator and a Contract of Carriage with the airline. Your Contract of Carriage governs cancellations, changes, and refunds. You are responsible for all travel documentation (passport, visas) and for compliance with check-in and boarding requirements. Charges may include taxes, service fees, baggage, and seat selection. Prohibited practices (e.g., buying flights you don't intend to use) are not allowed. Code-share flights may be operated by a different airline. EU regulations for passengers with reduced mobility may apply.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h4 className="font-semibold mb-2">Governing Law</h4>
          <p className="text-muted-foreground">Disputes not subject to arbitration will be resolved in state or federal courts in Delaware (or your county for small claims), and these Terms are governed by Delaware law.</p>
        </div>
      </AccordionContent>
    </AccordionItem>

    {/* Dispute Resolution */}
    <AccordionItem value="dispute-resolution" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
      <AccordionTrigger className="text-base font-medium hover:no-underline text-[#0c4d47]">
        Dispute Resolution
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-6 text-base leading-relaxed">
        <div className="flex justify-center mb-6">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-5 sm:h-7 w-auto"
          />
        </div>
        <p>
          Goldsainte Ai / Inc. is committed to resolving any disputes fairly and efficiently through a structured process.
        </p>
        
        <div>
          <h4 className="font-semibold mb-2">A. Overview</h4>
          <p>
            In the event of a disagreement, dispute, or claim arising from your use of our Platform or services, 
            we provide multiple resolution pathways including informal resolution, mediation, and arbitration.
          </p>
          <p className="mt-2">
            By using Goldsainte Ai / Inc., you agree to resolve disputes according to the terms outlined below.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">B. Informal Resolution</h4>
          <p>Before initiating formal legal action, you agree to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Contact Goldsainte Ai / Inc. Customer Support promptly via your account, app, or Help Center.</li>
            <li>Provide relevant details including booking reference, contact information, issue summary, and supporting documentation.</li>
            <li>Allow us 30 days to review and attempt to resolve the issue informally.</li>
          </ul>
          <p className="mt-2">Most disputes are resolved at this stage without further escalation.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">C. Mediation</h4>
          <p>If a dispute cannot be resolved informally, mediation is the next step:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Either party may initiate mediation by providing written notice.</li>
            <li>A mutually agreed-upon, neutral third-party mediator will facilitate the process.</li>
            <li>Mediation sessions take place virtually or in-person in Dover, Delaware, USA.</li>
            <li>Both parties must participate in good faith.</li>
            <li>Costs are shared equally unless otherwise agreed.</li>
            <li>If unresolved within 60 days, either party may proceed to arbitration.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">D. Arbitration</h4>
          <p>All disputes that cannot be resolved through informal resolution or mediation will be resolved through binding arbitration:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Arbitration Rules:</strong> Conducted under American Arbitration Association (AAA) rules.</li>
            <li><strong>Location:</strong> Dover, Delaware, USA, unless both parties agree otherwise.</li>
            <li><strong>Arbitrator:</strong> A single neutral arbitrator with relevant travel industry experience.</li>
            <li><strong>Decision:</strong> Final, binding, and enforceable in any court of competent jurisdiction.</li>
            <li><strong>Costs:</strong> Each party bears its own costs, including attorney's fees, unless determined otherwise.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">E. Exceptions</h4>
          <p>Arbitration does not prevent either party from:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Seeking urgent injunctive or equitable relief in a court of competent jurisdiction.</li>
            <li>Filing claims in small claims court for amounts within the applicable jurisdictional limit.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">F. Class Action Waiver</h4>
          <p>
            You and Goldsainte Ai / Inc. agree that all disputes must be resolved individually, and not as a class or consolidated action. 
            Any arbitration or legal proceeding will apply only to you and us, and not to any other user or third party.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">G. Governing Law and Jurisdiction</h4>
          <p>
            This Dispute Resolution section is governed by the laws of the State of Delaware, USA, without regard to its conflict of law rules. 
            Any court with jurisdiction in Kent County, Delaware may enforce arbitration awards or hear matters excluded from arbitration.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">H. Severability</h4>
          <p>
            If any provision of this Dispute Resolution section is found invalid or unenforceable, the remaining provisions remain fully in effect.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">I. Contact for Disputes</h4>
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
      <AccordionTrigger className="text-base font-medium hover:no-underline text-[#0c4d47]">
        What We Do
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-6 text-base leading-relaxed">
        <div className="flex justify-center mb-6">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-5 sm:h-7 w-auto"
          />
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-foreground font-semibold mb-2">Complete Service Details Available</p>
          <p className="text-base text-muted-foreground mb-3">
            View the full, detailed information about all Goldsainte services including accommodations, attractions, flights, car rentals, and transportation.
          </p>
          <Link 
            to="/what-we-do" 
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            View Full Service Details →
          </Link>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Our Services Overview</h3>
          
          <div>
            <h4 className="font-semibold mb-2">How Our Platform Works</h4>
            <p>Goldsainte provides an AI-powered platform that makes it easy to compare and book travel experiences from hotels, attractions, car rentals, flights, and transportation providers worldwide. When you make a booking, you enter into a direct contract with the Service Provider.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">1. Accommodations</h4>
            <p>Search, compare, and book hotels and properties worldwide. Our platform displays real-time availability, pricing, and reviews from verified guests. Service Providers set their own rates and policies.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Attractions</h4>
            <p>Discover and book tours, activities, and attractions at your destination. We work with Service Providers and Third-Party Aggregators to offer a wide selection of experiences with transparent pricing.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Car Rentals</h4>
            <p>Compare rental cars from multiple companies with clear pricing and flexible booking options. Our platform helps you find the right vehicle for your needs with detailed specifications and customer reviews.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">4. Flights</h4>
            <p>Search and book flights through our Third-Party Aggregator partners. Our recommendation system helps you find the best options based on price, travel time, and your preferences.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">5. Private and Public Transportation</h4>
            <p>Book ground transportation including private transfers, taxis, and public transit options. Pre-book with confidence knowing all fees are included upfront.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">How We Make Money</h4>
            <p>Goldsainte earns commission from Service Providers after bookings are completed. We don't charge booking fees to customers. Properties with "Preferred Partner" or "Ad" badges pay higher commissions for enhanced visibility.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">AI-Powered Recommendations</h4>
            <p>Our recommendation systems use your search criteria, past interactions, and property performance metrics to suggest travel options you'll love. You can adjust sorting preferences and disable personalization in your account settings.</p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>

    {/* Modern Slavery Statement */}
    <AccordionItem value="modern-slavery" id="modern-slavery" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
      <AccordionTrigger className="text-base font-medium hover:no-underline text-[#0c4d47]">
        Modern Slavery Statement
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-6 text-base leading-relaxed">
        <div className="flex justify-center mb-6">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-5 sm:h-7 w-auto"
          />
        </div>
        <p className="text-base text-muted-foreground">
          Fiscal Year Ending December 31, 2025
        </p>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">1. Introduction</h3>
          <p className="text-foreground">
            Goldsainte recognizes that modern slavery in all its forms—including slavery, human trafficking, forced labor, debt bondage, descent-based slavery, servitude, child slavery, and forced or early marriage—is a serious global issue. We are committed to respecting the human rights of all our stakeholders and to taking proactive measures to prevent our business and supply chains from contributing to such practices.
          </p>
          <p className="text-foreground mt-3">
            Our commitment is guided by internationally recognized standards and principles, including the United Nations Guiding Principles on Business and Human Rights. We strive to avoid infringing on the rights of others and actively work to address adverse human rights impacts with which we may be involved, including modern slavery risks.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">2. About Goldsainte</h3>
          <p className="text-foreground">
            Goldsainte is a travel and experiences platform that connects users with accommodations, attractions, flights, car rentals, and other travel services worldwide. While our operations are primarily digital, we engage with a wide range of suppliers, service providers, and contractors. We recognize that certain areas of our supply chain may be at higher risk of modern slavery and remain committed to mitigating these risks wherever they exist.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">3. Our Policies and Commitments</h3>
          <p className="text-foreground mb-3">
            Goldsainte has implemented policies and procedures to address modern slavery risks, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground">
            <li>
              <strong>Code of Conduct:</strong> All employees, contractors, and business partners are required to uphold ethical standards and respect human rights.
            </li>
            <li>
              <strong>Supplier Standards:</strong> Our suppliers must comply with local labor laws and international human rights standards. Suppliers are expected to take steps to ensure that modern slavery does not exist within their own operations or supply chains.
            </li>
            <li>
              <strong>Whistleblower Policy:</strong> Employees, partners, and other stakeholders can report concerns anonymously and without fear of retaliation.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">4. Risk Assessment and Due Diligence</h3>
          <p className="text-foreground mb-3">
            Goldsainte regularly evaluates potential modern slavery risks in our operations and supply chain. We prioritize:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground">
            <li>Suppliers located in regions with higher risk of labor exploitation.</li>
            <li>Industries where forced labor and human trafficking are more prevalent.</li>
            <li>Contractors providing labor-intensive services or temporary staffing.</li>
          </ul>
          <p className="text-foreground mt-3">
            Where risks are identified, we implement mitigation measures, including contractual obligations, audits, and monitoring practices.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">5. Training and Awareness</h3>
          <p className="text-foreground">
            We provide training and awareness programs for our employees, procurement teams, and key suppliers. These programs focus on recognizing modern slavery risks, understanding reporting mechanisms, and ensuring compliance with Goldsainte's policies.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">6. Reporting and Accountability</h3>
          <p className="text-foreground">
            Goldsainte maintains a transparent reporting framework. Any suspected incidents of modern slavery are investigated promptly. We are committed to continuous improvement and regularly review our policies and procedures to strengthen our efforts to prevent modern slavery.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">7. Future Commitments</h3>
          <p className="text-foreground mb-3">
            Goldsainte will continue to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground">
            <li>Enhance supplier engagement to ensure compliance with human rights standards.</li>
            <li>Monitor, assess, and mitigate risks across our supply chain.</li>
            <li>Collaborate with industry partners and stakeholders to promote responsible and ethical business practices.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-3 text-foreground">8. Approval</h3>
          <p className="text-foreground mb-3">
            This statement has been approved by the Board of Directors of Goldsainte and is signed on behalf of the company by:
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-semibold">Andre C. Powell Jr.</p>
            <p className="text-muted-foreground">CEO & Founder, Goldsainte Inc.</p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="human-rights" id="human-rights" className="border-0 rounded-lg px-6 bg-card shadow-sm hover:bg-[#bfad72] data-[state=open]:hover:!bg-card transition-colors">
      <AccordionTrigger className="text-base font-medium hover:no-underline text-[#0c4d47]">
        Human Rights Statement
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-6 text-base leading-relaxed">
        <div className="flex justify-center mb-6">
          <img 
            src={primaryLogoGreen} 
            alt="Goldsainte" 
            className="h-5 sm:h-7 w-auto"
          />
        </div>
        <div>
          <h3 className="text-base font-semibold mb-3">1. Introduction</h3>
          <p className="text-foreground">
            Goldsainte is committed to respecting and promoting human rights wherever we operate. We believe that travel can bring out the best in humanity, and our mission is to ensure that our business activities and partnerships support this principle.
          </p>
          <p className="text-foreground mt-4">
            This statement articulates our approach to respecting and promoting human rights, in alignment with internationally recognized standards such as the United Nations Guiding Principles on Business and Human Rights and the International Bill of Human Rights.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">2. Our Commitment</h3>
          <p className="text-foreground mb-3">Goldsainte is committed to:</p>
          <ul className="list-disc pl-6 space-y-2 text-foreground">
            <li>Respecting the rights and dignity of all individuals, including employees, contractors, suppliers, and travelers.</li>
            <li>Preventing, mitigating, and addressing adverse human rights impacts connected to our operations, products, and services.</li>
            <li>Promoting ethical business practices and positive social outcomes across all regions in which we operate.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">3. Scope</h3>
          <p className="text-foreground">
            This statement applies to all Goldsainte employees, contractors, suppliers, partners, and service providers. We also expect our business partners and supply chain participants to uphold the same human rights principles and standards.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">4. Human Rights Principles</h3>
          <p className="text-foreground mb-3">Goldsainte recognizes the following key principles as fundamental to our human rights approach:</p>
          <ul className="list-disc pl-6 space-y-2 text-foreground">
            <li><strong>Non-discrimination:</strong> We do not tolerate discrimination based on race, ethnicity, gender, sexual orientation, religion, disability, or any other characteristic.</li>
            <li><strong>Freedom from forced labor:</strong> We prohibit forced, bonded, or compulsory labor in our operations and supply chain.</li>
            <li><strong>Child protection:</strong> We do not tolerate child labor in any form.</li>
            <li><strong>Health, safety, and well-being:</strong> We are committed to safe and healthy workplaces and promote well-being for all employees and travelers.</li>
            <li><strong>Freedom of association and collective bargaining:</strong> We respect the rights of workers to organize and engage in collective bargaining where legally permitted.</li>
            <li><strong>Privacy and data protection:</strong> We protect the personal data of our employees, travelers, and partners in accordance with applicable privacy laws.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">5. Due Diligence and Risk Management</h3>
          <p className="text-foreground mb-3">Goldsainte actively assesses human rights risks in our operations and supply chains. Key measures include:</p>
          <ul className="list-disc pl-6 space-y-2 text-foreground">
            <li>Conducting supplier due diligence and audits.</li>
            <li>Integrating human rights considerations into procurement and partnership decisions.</li>
            <li>Monitoring, reporting, and addressing human rights concerns through established policies and procedures.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">6. Training and Awareness</h3>
          <p className="text-foreground">
            We provide training and resources for employees, contractors, and partners to ensure awareness of human rights risks and responsibilities. This includes guidance on how to identify and respond to potential human rights violations.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">7. Reporting and Accountability</h3>
          <p className="text-foreground">
            Goldsainte encourages employees, partners, and stakeholders to raise concerns or report potential human rights issues through our whistleblower channels or direct contact with our compliance team. All reports are investigated promptly and confidentially.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">8. Continuous Improvement</h3>
          <p className="text-foreground">
            We are committed to continually improving our human rights practices. We regularly review policies, procedures, and business operations to strengthen our human rights performance and align with evolving international standards.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">9. Approval</h3>
          <p className="text-foreground mb-4">
            This statement has been approved by the Board of Directors of Goldsainte and is signed on behalf of the company by:
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-semibold text-foreground">Andre C. Powell</p>
            <p className="text-muted-foreground">CEO & Founder, Goldsainte</p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>

    </Accordion>
    </div>
  );
};

export default About;