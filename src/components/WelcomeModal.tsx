import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Sparkles, Heart, FileCheck, Briefcase, ArrowRight, Star, Mic, Share2, Users, BarChart3, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  isFirstVisit?: boolean;
}

export const WelcomeModal = ({ open, onClose, isFirstVisit = false }: WelcomeModalProps) => {
  const { t } = useTranslation();
  
  const handleClose = () => {
    localStorage.setItem("goldsainte-welcome-seen", "true");
    onClose();
    // Only trigger the tour on first visit
    if (isFirstVisit) {
      window.dispatchEvent(new Event("welcomeDismissed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-[95svw] sm:max-w-lg min-w-0 p-0 gap-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader>
          <DialogTitle className="sr-only">Welcome to Goldsainte.Ai</DialogTitle>
          <DialogDescription className="sr-only">Overview of capabilities</DialogDescription>
        </DialogHeader>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="text-center space-y-1 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl font-secondary text-primary">
              {t('welcomeModal.title')}
            </h2>
          </div>

          <ScrollArea className="h-[60vh] sm:h-[65vh] pr-4 gold-scrollbar">
            <div className="space-y-3 sm:space-y-4">
            {/* Feature 1 - Voice AI */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">
                  {t('welcomeModal.voiceAI.title')}
                </h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  {t('welcomeModal.voiceAI.description')}
                </p>
              </div>
            </div>

            {/* Feature 2 - AI Search & Agent */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">{t('welcomeModal.personalAI.title')}</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  {t('welcomeModal.personalAI.description')}
                </p>
              </div>
            </div>

            {/* Feature 3 - Goldsainte Create */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">{t('welcomeModal.createShare.title')}</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  {t('welcomeModal.createShare.description')}
                </p>
              </div>
            </div>

            {/* Feature 4 - Expert Agents */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">{t('welcomeModal.expertAgents.title')}</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  {t('welcomeModal.expertAgents.description')}
                </p>
              </div>
            </div>

            {/* Feature 5 - Creator Dashboard */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">{t('welcomeModal.creatorDashboard.title')}</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  {t('welcomeModal.creatorDashboard.description')}
                </p>
              </div>
            </div>

            {/* Feature 7 - Creator Payouts */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">{t('welcomeModal.creatorPayouts.title')}</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  {t('welcomeModal.creatorPayouts.description')}
                </p>
              </div>
            </div>

            {/* Feature 8 - Group Bookings */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">{t('welcomeModal.groupBookings.title')}</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  {t('welcomeModal.groupBookings.description')}
                </p>
              </div>
            </div>

            {/* Feature 9 - Itinerary Management */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">{t('welcomeModal.itinerary.title')}</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  {t('welcomeModal.itinerary.description')}
                </p>
              </div>
            </div>

            {/* Feature 10 - Communication Hub */}
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm sm:text-base">{t('welcomeModal.communication.title')}</h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  {t('welcomeModal.communication.description')}
                </p>
              </div>
            </div>
            </div>
          </ScrollArea>

          <Button
            onClick={handleClose} 
            className="w-full h-10 sm:h-11 text-xs sm:text-sm group"
            size="lg"
          >
            {t('welcomeModal.cta')}
            <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-[7px] sm:text-[8px] text-center text-muted-foreground leading-[1.2]">
            {t('welcomeModal.agreement')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
