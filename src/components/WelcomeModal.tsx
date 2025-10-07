import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, Heart, FileCheck, Briefcase, ArrowRight, Star } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeModal = ({ open, onClose }: WelcomeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 gap-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader>
          <DialogTitle className="sr-only">Welcome to Goldsainte.Ai</DialogTitle>
          <DialogDescription className="sr-only">Overview of capabilities</DialogDescription>
        </DialogHeader>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="text-center space-y-1 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl font-secondary text-primary">
              What Goldsainte.Ai can do for you
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Feature 1 */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">AI-powered search & planning.</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  Search flights, hotels, restaurants, events, and packages in one conversation. 
                  Get personalized recommendations tailored to your style.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">Expert agents with milestone payments.</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  Post complex trips to our marketplace and get AI-matched with certified agents. 
                  Pay in milestones, track progress, and chat in real-time with full transparency.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">Group bookings & split payments.</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  Organize group trips with ease. Split costs among travelers with secure payment links, 
                  track who's paid, and get instant notifications when payments complete.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">Complete itinerary management.</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  Build day-by-day itineraries, upload travel docs, sync calendars, 
                  and share your plans with travel companions effortlessly.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">Real-time communication hub.</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  Chat instantly with agents, get notifications, use quick replies, 
                  and keep all your travel conversations in one secure place.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">Personalized recommendations.</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  Goldsainte.Ai learns your preferences and finds luxury travel options 
                  perfectly tailored to your style.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onClose} 
            className="w-full h-10 sm:h-11 text-xs sm:text-sm group"
            size="lg"
          >
            Start Planning Your Luxury Journey
            <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-[9px] sm:text-[10px] text-center text-muted-foreground leading-tight">
            By using Goldsainte.Ai, you agree to our Terms and Privacy Policy. 
            Don't enter personal or sensitive information.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
