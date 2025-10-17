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

      </Accordion>
    </div>
  );
};

export default About;