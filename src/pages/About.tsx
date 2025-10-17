import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import founderImage from "@/assets/founder.jpg";
import { 
  Mic, Sparkles, Share2, Briefcase, Package, BarChart3, 
  DollarSign, Users, FileCheck, MessageCircle, 
} from "lucide-react";

const About = () => {
  const partners = [
    { name: "Amadeus", color: "from-blue-600 to-blue-400" },
    { name: "Ticketmaster", color: "from-blue-500 to-cyan-400" },
    { name: "OpenAI", color: "from-emerald-600 to-teal-400" },
    { name: "Google Gemini", color: "from-purple-600 to-pink-400" }
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
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">About Goldsainte</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          AI-Powered Travel Intelligence Meets Human Expertise
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expandable Sections */}
      <Accordion type="single" collapsible className="space-y-4">
        
        {/* What Is Goldsainte */}
        <AccordionItem value="what-is" className="border-0 rounded-lg px-6 bg-card shadow-sm">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            What is Goldsainte?
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4 text-base leading-relaxed">
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
        <AccordionItem value="features" className="border-0 rounded-lg px-6 bg-card shadow-sm">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            What We Offer
          </AccordionTrigger>
          <AccordionContent className="pt-6 space-y-8">
            {featureCategories.map((category, idx) => (
              <div key={category.category}>
                <h3 className="text-lg font-semibold mb-4 text-foreground">{category.category}</h3>
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
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
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
        <AccordionItem value="mission" className="border-0 rounded-lg px-6 bg-card shadow-sm">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            Our Mission
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4 text-base leading-relaxed">
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
        <AccordionItem value="partners" className="border-0 rounded-lg px-6 bg-card shadow-sm">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            Our Partners & Technology
          </AccordionTrigger>
          <AccordionContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
              {partners.map((partner) => (
                <div 
                  key={partner.name}
                  className="flex items-center justify-center p-6 rounded-lg border border-border/50 bg-card/50 hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <span className={`text-lg font-bold bg-gradient-to-r ${partner.color} bg-clip-text text-transparent`}>
                    {partner.name}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Goldsainte leverages industry leaders like Amadeus, Ticketmaster, OpenAI, and Google Gemini to bring you curated and real-time travel experiences.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Legal */}
        <AccordionItem value="legal" className="border-0 rounded-lg px-6 bg-card shadow-sm">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            Legal
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4 text-base leading-relaxed">
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
        <AccordionItem value="accessibility" className="border-0 rounded-lg px-6 bg-card shadow-sm">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            Accessibility Statement
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-6 text-base leading-relaxed">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Accessibility Statement for Goldsainte</h3>
              <p className="text-foreground">
                At Goldsainte, our mission is to make it easier for everyone to experience the world. We are committed to delivering barrier-free, inclusive experiences for all our users, and this involves making our digital services accessible to everyone, including persons with disabilities.
              </p>
            </div>
            
            <p className="text-foreground">
              We are continuously working to improve the accessibility of our digital services. This statement has been prepared to inform users about how we make our services more accessible, including aligning with the currently applicable EU standards on accessibility requirements for ICT products and services ("Accessibility Standards"). This accessibility statement applies to the portions of our services covered by the European Accessibility Act.
            </p>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">Description of the services and measures to support accessibility</h3>
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

      </Accordion>
    </div>
  );
};

export default About;