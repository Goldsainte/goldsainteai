import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import founderImage from "@/assets/founder.jpg";
import { 
  Mic, Sparkles, Share2, Briefcase, Package, BarChart3, 
  DollarSign, Users, FileCheck, MessageCircle 
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
          description: "Just say 'Hey Goldsainte' anywhere on our site to start a natural conversation about flights, hotels, dining, and more—hands-free."
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
          title: "Create. Share. Make Money.",
          description: "A social platform where content creators can showcase their journeys, build interactive trip plans, and generate income."
        },
        {
          icon: Package,
          title: "CoCurated™ Packages",
          description: "Exclusive travel experiences designed by top creators and travel experts, blending inspiration with transparent booking."
        },
        {
          icon: BarChart3,
          title: "Creator Dashboard",
          description: "Comprehensive tools, analytics, package management, partnerships, and Shop products—all built to empower creators."
        },
        {
          icon: DollarSign,
          title: "Creator Payouts",
          description: "Multiple revenue streams with tiered commissions (5-15%) based on performance and engagement—rewarding quality content."
        }
      ]
    },
    {
      category: "Seamless Experience",
      features: [
        {
          icon: Briefcase,
          title: "Expert Agent Marketplace",
          description: "Post complex trips, get AI-matched with certified agents, and pay securely in milestones while tracking progress in real time."
        },
        {
          icon: Users,
          title: "Group Bookings & Split Payments",
          description: "Make planning with friends seamless with secure payment links, split payment tracking, and transparent cost sharing."
        },
        {
          icon: FileCheck,
          title: "Itinerary Management",
          description: "Keep everything in one place—day-by-day plans, document uploads, calendar sync, and organized travel information."
        },
        {
          icon: MessageCircle,
          title: "Real-Time Communication Hub",
          description: "Instant chat with agents, push notifications for booking updates, and seamless communication throughout your journey."
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      {/* Page Header */}
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">About Goldsainte</h1>

      {/* Introduction Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-foreground">
              Goldsainte AI is a voice-activated, AI-powered travel marketplace that merges automation with verified human expertise to deliver fully personalized, end-to-end trip planning and booking. With the wake word "Hey Goldsainte," users can engage a conversational concierge to search, plan, and book flights, hotels, dining, events, and transportation—completely hands-free and in real time.
            </p>
            <p className="text-base leading-relaxed text-foreground">
              At the core of the platform is a travel agent marketplace where users can post complex itineraries, receive competitive bids from certified agents, and pay securely through milestone-based transactions. The system supports group bookings, split payments, full itinerary management, and real-time messaging, making it easy to coordinate even the most intricate trips.
            </p>
            <p className="text-base leading-relaxed text-foreground">
              Goldsainte also powers a unique creator economy: content creators collaborate with agents to co-build and promote curated travel experiences, while transportation vendors can onboard, promote their services, and be included in creator or agent-led packages. This three-sided ecosystem—AI + Agents + Creators—makes Goldsainte the first platform to unify inspiration, planning, and booking within one intelligent, social commerce environment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Letter from the Founder Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Letter from the Founder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-[300px_1fr] gap-6 lg:gap-8">
            {/* Founder Image */}
            <div className="flex justify-center md:justify-start">
          <img 
            src={founderImage}
            alt="Goldsainte Founder"
            className="rounded-xl shadow-lg w-full max-w-[280px] aspect-[3/4] object-cover"
          />
            </div>
            
            {/* Letter Content */}
            <div className="space-y-4 text-base leading-relaxed">
              <p className="text-foreground">
                When Goldsainte first launched, people often asked how we were different from other ridesharing services and the traditional taxi industry. The answer was clear: we introduced the world's first and only ridesharing franchise. Built on the pillars of safety, consistency, and an elevated experience, we proved that franchising could deliver premium, trustworthy mobility.
              </p>
              
              <p className="text-foreground">
                That foundation of innovation, quality, and trust remains part of who we are today—but Goldsainte has grown far beyond ridesharing. We are now building something even bigger: a global AI-powered travel and creator ecosystem designed for the modern explorer.
              </p>
              
              <p className="text-foreground font-semibold">
                The new Goldsainte AI is redefining how people plan, experience, and share travel:
              </p>
              
              <ul className="space-y-3 ml-4">
                <li>
                  <strong className="text-foreground">Voice AI Concierge:</strong>{" "}
                  <span className="text-foreground">Just say "Hey Goldsainte" anywhere on our site to start a natural conversation about flights, hotels, dining, and more—hands-free.</span>
                </li>
                <li>
                  <strong className="text-foreground">Personal AI Agent:</strong>{" "}
                  <span className="text-foreground">Your AI learns your style, budget, and preferences to deliver smarter, personalized recommendations every time you travel.</span>
                </li>
                <li>
                  <strong className="text-foreground">Create. Share. Make Money.:</strong>{" "}
                  <span className="text-foreground">A social platform where content creators can showcase their journeys, build interactive trip plans, and generate income.</span>
                </li>
                <li>
                  <strong className="text-foreground">Expert Agent Marketplace:</strong>{" "}
                  <span className="text-foreground">Post complex trips, get AI-matched with certified agents, and pay securely in milestones while tracking progress in real time.</span>
                </li>
                <li>
                  <strong className="text-foreground">CoCurated™ Packages:</strong>{" "}
                  <span className="text-foreground">Exclusive travel experiences designed by top creators and travel experts, blending inspiration with transparent booking.</span>
                </li>
                <li>
                  <strong className="text-foreground">Creator Dashboard & Payouts:</strong>{" "}
                  <span className="text-foreground">Tools, analytics, partnerships, and multiple revenue streams—all built to empower the creator economy.</span>
                </li>
                <li>
                  <strong className="text-foreground">Group Bookings & Split Payments:</strong>{" "}
                  <span className="text-foreground">Make planning with friends seamless with secure, trackable shared payments.</span>
                </li>
                <li>
                  <strong className="text-foreground">Itinerary Management & Real-Time Communication:</strong>{" "}
                  <span className="text-foreground">Keep everything in one place—day-by-day plans, travel docs, synced calendars, and instant messaging.</span>
                </li>
              </ul>
              
              <p className="text-foreground">
                At Goldsainte, we believe travel is more than getting from point A to point B. It's about creating experiences worth sharing, building community, and giving both travelers and creators the tools to thrive.
              </p>
              
              <p className="text-foreground">
                From our beginnings as a pioneering rideshare franchise to today's AI-powered luxury travel platform, Goldsainte has always stood for trust, innovation, and empowerment. The future of travel is not just about where you go—it's about how seamlessly and meaningfully you get there.
              </p>
              
              <p className="text-foreground italic">
                Thank you for being part of this journey. The best adventures are still ahead.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What We Offer Section - Luxury Redesign */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">What We Offer</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">A Complete Ecosystem for Modern Travel</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {featureCategories.map((category, idx) => (
            <div key={category.category}>
              <h3 className="text-lg font-semibold mb-6 text-foreground">{category.category}</h3>
              <div className="space-y-6">
                {category.features.map((feature) => (
                  <div 
                    key={feature.title}
                    className="group flex gap-4 items-start p-4 rounded-lg hover:bg-accent/50 transition-all duration-300"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2 text-foreground">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {idx < featureCategories.length - 1 && (
                <div className="mt-8 border-t border-border/50" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Our Mission Section */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-base leading-loose text-foreground">
            <p>
              At Goldsainte, we believe that travel is more than just booking a flight or reserving a hotel—it's about creating unforgettable experiences, building meaningful connections, and empowering people to share their journeys in ways that inspire others. Our mission is to redefine the travel industry by combining cutting-edge AI technology with the creativity and passion of travelers, creators, and experts worldwide.
            </p>
            <p>
              We are dedicated to making travel more accessible, personalized, and rewarding. Whether you're a solo explorer seeking hidden gems, a content creator building your brand, or a travel expert sharing your knowledge, Goldsainte provides the tools, platform, and community to help you thrive. We envision a world where every traveler can discover, plan, and experience trips that are uniquely tailored to their preferences—and where creators and experts are fairly compensated for the value they bring.
            </p>
            <p>
              Our AI-powered ecosystem is designed to simplify the complexities of travel planning while preserving the magic of discovery. From voice-activated concierge services to personalized AI agents that learn your travel style, we're leveraging technology to make every journey smarter, smoother, and more enjoyable. At the same time, our social and creator-focused features ensure that travel remains a deeply human, shareable, and community-driven experience.
            </p>
            <p>
              Goldsainte is more than a travel platform—it's a movement. We're building a global community of travelers, creators, and innovators who are passionate about exploration, storytelling, and connection. By bridging the gap between inspiration and action, we empower our users to not only dream about their next adventure but to make it a reality—and to inspire others along the way.
            </p>
            <p>
              Ultimately, our mission is to transform how the world travels. We aim to create an ecosystem where technology enhances human experience, where creators are valued and rewarded, and where every journey—no matter how big or small—becomes a story worth sharing. At Goldsainte, the future of travel is collaborative, intelligent, and boundless.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Partners & Technology Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Our Partners & Technology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {partners.map((partner) => (
              <div 
                key={partner.name}
                className="group flex items-center justify-center p-8 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg transition-all duration-500"
              >
                <span className={`text-2xl font-bold bg-gradient-to-r ${partner.color} bg-clip-text text-transparent grayscale group-hover:grayscale-0 transition-all duration-500`}>
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            Goldsainte leverages industry leaders like Amadeus, Ticketmaster, OpenAI, and Google Gemini to bring you curated and real-time travel experiences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
