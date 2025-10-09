import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Sparkles, Heart, FileCheck, Briefcase, ArrowRight, Star, Mic, Share2 } from "lucide-react";

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

          <ScrollArea className="h-[60vh] sm:h-[65vh] pr-4">
            <div className="space-y-3 sm:space-y-4">
            {/* Feature 1 - Voice AI */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">
                  Voice AI Concierge with "Hey Goldsainte" wake word.
                </h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  Just say "Hey Goldsainte" from anywhere on the site to instantly activate our advanced voice AI. 
                  Have natural conversations about flights, hotels, dining, and more—hands-free.
                </p>
              </div>
            </div>

            {/* Feature 2 - AI Search & Agent */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">Personal AI agent that learns your preferences.</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  Build your own AI travel agent by teaching it your travel style, budget, and preferences. 
                  It learns from every interaction to deliver increasingly personalized recommendations for flights, hotels, restaurants, and experiences.
                </p>
              </div>
            </div>

            {/* Feature 3 - Goldsainte Places */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">Create. Share. Make Money.</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  A social networking platform for content creators to share their luxury travel experiences and create interactive trip plans, 
                  allowing them to earn income from their content.
                </p>
              </div>
            </div>

            {/* Feature 4 - Expert Agents */}
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

            {/* Feature 5 - Group Bookings */}
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

            {/* Feature 6 - Itinerary Management */}
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

            {/* Feature 7 - Communication Hub */}
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
            </div>
          </ScrollArea>

          <Button
            onClick={onClose} 
            className="w-full h-10 sm:h-11 text-xs sm:text-sm group"
            size="lg"
          >
            Start Planning Your Luxury Journey
            <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-[7px] sm:text-[8px] text-center text-muted-foreground leading-[1.2]">
            By using Goldsainte.Ai, you agree to our Terms and Privacy Policy. 
            Don't enter personal or sensitive information.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
