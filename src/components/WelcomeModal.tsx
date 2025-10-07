import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, Heart, FileCheck, Briefcase, ArrowRight, Star, Mic } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeModal = ({ open, onClose }: WelcomeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-xl md:max-w-2xl p-0 gap-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Welcome to Goldsainte.Ai</DialogTitle>
          <DialogDescription className="sr-only">Overview of capabilities</DialogDescription>
        </DialogHeader>
        <div className="p-5 sm:p-8 space-y-5 sm:space-y-7">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-secondary text-primary font-bold">
              What Goldsainte.Ai can do for you
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Luxury travel planning, reimagined with AI
            </p>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {/* Feature 1 - Voice AI */}
            <div className="flex gap-3 sm:gap-4 items-start p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-base sm:text-lg leading-tight">
                  Voice AI Concierge with "Hey Goldsainte" wake word
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Just say "Hey Goldsainte" from anywhere on the site to instantly activate our advanced voice AI. 
                  Have natural conversations about flights, hotels, dining, and more—hands-free.
                </p>
              </div>
            </div>

            {/* Feature 2 - AI Search */}
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-base sm:text-lg leading-tight">AI-powered search & planning</h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Search flights, hotels, restaurants, events, and packages in one conversation. 
                  Get personalized recommendations tailored to your style.
                </p>
              </div>
            </div>

            {/* Feature 3 - Expert Agents */}
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-base sm:text-lg leading-tight">Expert agents with milestone payments</h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Post complex trips to our marketplace and get AI-matched with certified agents. 
                  Pay in milestones, track progress, and chat in real-time with full transparency.
                </p>
              </div>
            </div>

            {/* Feature 4 - Group Bookings */}
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-base sm:text-lg leading-tight">Group bookings & split payments</h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Organize group trips with ease. Split costs among travelers with secure payment links, 
                  track who's paid, and get instant notifications when payments complete.
                </p>
              </div>
            </div>

            {/* Feature 5 - Itinerary Management */}
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-base sm:text-lg leading-tight">Complete itinerary management</h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Build day-by-day itineraries, upload travel docs, sync calendars, 
                  and share your plans with travel companions effortlessly.
                </p>
              </div>
            </div>

            {/* Feature 6 - Communication Hub */}
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-base sm:text-lg leading-tight">Real-time communication hub</h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Chat instantly with agents, get notifications, use quick replies, 
                  and keep all your travel conversations in one secure place.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onClose} 
            className="w-full h-12 sm:h-14 text-sm sm:text-base group shadow-lg"
            size="lg"
          >
            Start Planning Your Luxury Journey
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-xs sm:text-sm text-center text-muted-foreground leading-relaxed px-2">
            By using Goldsainte.Ai, you agree to our Terms and Privacy Policy. 
            Don't enter personal or sensitive information.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
