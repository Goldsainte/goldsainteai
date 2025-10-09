import { Card } from "./ui/card";
import { Award, Shield, Users, TrendingUp, Globe, Star } from "lucide-react";

export const AuthoritySignals = () => {
  const partnerships = [
    { name: "IATA Certified", icon: <Globe className="w-8 h-8" /> },
    { name: "ASTA Member", icon: <Shield className="w-8 h-8" /> },
    { name: "Virtuoso Partner", icon: <Award className="w-8 h-8" /> },
    { name: "Forbes Recognized", icon: <Star className="w-8 h-8" /> }
  ];

  const achievements = [
    {
      title: "Industry Leader",
      description: "Recognized as a top luxury travel platform by Travel + Leisure Magazine",
      year: "2024"
    },
    {
      title: "Best AI Innovation",
      description: "Winner of the Travel Technology Excellence Award",
      year: "2024"
    },
    {
      title: "Customer Choice",
      description: "4.9/5 average rating across 12,000+ verified reviews",
      year: "2024"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Industry Recognition & Partnerships
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trusted by leading organizations and recognized for excellence
          </p>
        </div>

        {/* Partnerships */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {partnerships.map((partner, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-all">
              <div className="flex justify-center mb-4 text-primary">
                {partner.icon}
              </div>
              <p className="font-semibold text-sm">{partner.name}</p>
            </Card>
          ))}
        </div>

        {/* Achievements */}
        <div className="grid md:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 bg-primary/10 rounded-full p-3">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">{achievement.title}</h3>
                    <span className="text-sm text-muted-foreground">{achievement.year}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Press mentions */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-6">As featured in:</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="text-xl font-bold text-muted-foreground">Travel + Leisure</div>
            <div className="text-xl font-bold text-muted-foreground">Forbes Travel</div>
            <div className="text-xl font-bold text-muted-foreground">Condé Nast</div>
            <div className="text-xl font-bold text-muted-foreground">Luxury Travel Advisor</div>
            <div className="text-xl font-bold text-muted-foreground">Skift</div>
          </div>
        </div>
      </div>
    </section>
  );
};
