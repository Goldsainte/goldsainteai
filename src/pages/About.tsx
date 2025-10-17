import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  const partners = [
    { name: "Amadeus", color: "from-blue-600 to-blue-400" },
    { name: "Ticketmaster", color: "from-blue-500 to-cyan-400" },
    { name: "OpenAI", color: "from-emerald-600 to-teal-400" },
    { name: "Google Gemini", color: "from-purple-600 to-pink-400" }
  ];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      {/* Page Header */}
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">About Goldsainte</h1>

      {/* Introduction Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <p className="text-base leading-relaxed text-foreground">
            Goldsainte is the ultimate travel platform for creators, explorers, and travel enthusiasts who want more than just a trip. We combine curated, co-created travel experiences with real-time, bookable packages, empowering our users to discover, share, and monetize their adventures.
          </p>
        </CardContent>
      </Card>

      {/* Our Mission Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed text-foreground">
            Our mission is to transform the way people experience travel by making it accessible, social, and rewarding. Whether you're a content creator, influencer, or traveler seeking unique adventures, Goldsainte provides the tools and connections to create unforgettable journeys.
          </p>
        </CardContent>
      </Card>

      {/* What We Offer Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">What We Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            <li>
              <strong className="text-foreground font-semibold">CoCurated Experiences:</strong>{" "}
              <span className="text-foreground">Exclusive travel packages designed with creators and travel experts.</span>
            </li>
            <li>
              <strong className="text-foreground font-semibold">Live Bookable Packages:</strong>{" "}
              <span className="text-foreground">Real-time deals and activities powered by global travel APIs.</span>
            </li>
            <li>
              <strong className="text-foreground font-semibold">Creator Monetization:</strong>{" "}
              <span className="text-foreground">Opportunities for content creators to share and earn from travel experiences.</span>
            </li>
            <li>
              <strong className="text-foreground font-semibold">Inspiration Meets Action:</strong>{" "}
              <span className="text-foreground">Seamless integration of curated inspiration and instant booking.</span>
            </li>
          </ul>
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
