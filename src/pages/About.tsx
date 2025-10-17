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

  const features = [
    {
      icon: Mic,
      title: "Voice AI Concierge",
      description: "Just say 'Hey Goldsainte' anywhere on our site to start a natural conversation about flights, hotels, dining, and more—hands-free."
    },
    {
      icon: Sparkles,
      title: "Personal AI Agent",
      description: "Your AI learns your style, budget, and preferences to deliver smarter, personalized recommendations every time you travel."
    },
    {
      icon: Share2,
      title: "Create. Share. Make Money.",
      description: "A social platform where content creators can showcase their journeys, build interactive trip plans, and generate income."
    },
    {
      icon: Briefcase,
      title: "Expert Agent Marketplace",
      description: "Post complex trips, get AI-matched with certified agents, and pay securely in milestones while tracking progress in real time."
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
  ];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      {/* Page Header */}
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">About Goldsainte</h1>

      {/* Introduction Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-base leading-relaxed text-foreground">
            Goldsainte is the ultimate travel platform for creators, explorers, and travel enthusiasts who want more than just a trip. We combine curated, co-created travel experiences with real-time, bookable packages, empowering our users to discover, share, and monetize their adventures.
          </p>
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
                className="rounded-xl shadow-lg w-full max-w-[280px] md:max-w-none object-cover"
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

      {/* What We Offer Section - Expanded */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">What We Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
              >
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-foreground">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Our Mission Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed text-foreground">
            Our mission is to transform the way people experience travel by making it accessible, social, and rewarding. Whether you're a content creator, influencer, or traveler seeking unique adventures, Goldsainte provides the tools and connections to create unforgettable journeys.
          </p>
        </CardContent>
      </Card>

      {/* Partners & Technology Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Our Partners & Technology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {partners.map((partner) => (
              <div 
                key={partner.name}
                className="flex items-center justify-center p-6 rounded-lg border border-border bg-card hover:shadow-md transition-all duration-300"
              >
                <span className={`text-xl font-bold bg-gradient-to-r ${partner.color} bg-clip-text text-transparent`}>
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
