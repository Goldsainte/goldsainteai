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
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-base">AI-powered search & planning.</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Search flights, hotels, restaurants, events, and packages in one conversation. 
                  Get personalized recommendations tailored to your style.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-base">Expert travel agents on demand.</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Post complex trips to our marketplace and get matched with certified agents. 
                  Real-time chat, milestones, and secure payments included.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-base">Instant booking with smart pricing.</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Book instantly with AI-powered price insights and market analysis. 
                  Flexible cancellation policies and transparent pricing every time.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-base">Complete itinerary management.</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Build day-by-day itineraries, upload travel docs, sync calendars, 
                  and share your plans with travel companions effortlessly.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-base">Real-time communication hub.</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Chat instantly with agents, get notifications, use quick replies, 
                  and keep all your travel conversations in one secure place.
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
