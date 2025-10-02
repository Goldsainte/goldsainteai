import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, Heart, FileCheck, Briefcase, X } from "lucide-react";
import { useState } from "react";

export const WelcomeBox = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Card className="relative bg-gradient-to-br from-background via-background to-primary/5 p-6 mb-6">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-chiffon text-primary">
            What Goldsainte.Ai can do for you
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Feature 1 */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Ask anything. Plan everything.</h3>
              <p className="text-muted-foreground text-xs">
                Your go-to helper for luxury travel planning.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Your whole trip in one smart chat.</h3>
              <p className="text-muted-foreground text-xs">
                Search flights, hotels, restaurants, events, and more together.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Expert agents for complex journeys.</h3>
              <p className="text-muted-foreground text-xs">
                Post complex trips to our marketplace for certified agents.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Personalized recommendations.</h3>
              <p className="text-muted-foreground text-xs">
                AI learns your preferences for tailored suggestions.
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Everything organized in one place.</h3>
              <p className="text-muted-foreground text-xs">
                Save plans, share itineraries, and keep details synced.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
