import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, Heart, FileCheck, ArrowRight } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeModal = ({ open, onClose }: WelcomeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-chiffon text-primary">
              What Goldsainte.Ai can do for you
            </h2>
          </div>

          <div className="space-y-6">
            {/* Feature 1 */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Ask anything. Plan everything.</h3>
                <p className="text-muted-foreground text-sm">
                  Whether it's about where to go, when to go or how to get there, 
                  Goldsainte.Ai is your go-to helper for luxury travel planning.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Your whole trip in one smart chat.</h3>
                <p className="text-muted-foreground text-sm">
                  Goldsainte.Ai can search flights, hotels, restaurants, events, cars, 
                  vacation packages or all of the above, in a single conversation.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Trip ideas that get you.</h3>
                <p className="text-muted-foreground text-sm">
                  Goldsainte.Ai learns what you like and then helps find the luxury 
                  travel options that work best for you.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">All synced. All in one spot.</h3>
                <p className="text-muted-foreground text-sm">
                  Plan your trip and Goldsainte.Ai saves your preferences, shares 
                  plans with friends and keeps all the details in one place.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onClose} 
            className="w-full h-12 text-base group"
            size="lg"
          >
            Start Planning Your Luxury Journey
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By using Goldsainte.Ai, you agree to our Terms and Privacy Policy. 
            Don't enter personal or sensitive information.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
