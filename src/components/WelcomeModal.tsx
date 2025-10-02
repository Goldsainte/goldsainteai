import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, Heart, FileCheck, Briefcase, ArrowRight } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeModal = ({ open, onClose }: WelcomeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-secondary text-primary">
              What Goldsainte.Ai can do for you
            </h2>
          </div>

          <div className="space-y-4">
            {/* Feature 1 */}
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-base">Ask anything. Plan everything.</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Whether it's about where to go, when to go or how to get there, 
                  Goldsainte.Ai is your go-to helper for luxury travel planning.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-base">Your whole trip in one smart chat.</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Goldsainte.Ai can search flights, hotels, restaurants, events, cars, 
                  vacation packages or all of the above, in a single conversation.
                </p>
              </div>
            </div>

            {/* Feature 3 - Travel Agent Marketplace */}
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-base">Expert agents for complex journeys.</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Planning a multi-city adventure or intricate itinerary? Post your trip 
                  to our marketplace and let certified travel experts craft your perfect journey.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-base">Personalized recommendations.</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Goldsainte.Ai learns your preferences and finds luxury 
                  travel options perfectly tailored to your style.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-base">Everything organized in one place.</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Save your travel plans, share itineraries with companions, and keep 
                  all booking details seamlessly organized in one secure location.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onClose} 
            className="w-full h-11 text-sm group"
            size="lg"
          >
            Start Planning Your Luxury Journey
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-[10px] text-center text-muted-foreground leading-tight">
            By using Goldsainte.Ai, you agree to our Terms and Privacy Policy. 
            Don't enter personal or sensitive information.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
