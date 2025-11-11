import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plane, Hotel } from 'lucide-react';

interface BookingChoicePromptProps {
  tripType: 'hotels' | 'flights' | 'hotel+flight';
  onChoice: (choice: 'self_service' | 'agent') => void;
}

export const BookingChoicePrompt = ({ tripType, onChoice }: BookingChoicePromptProps) => {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {tripType === 'flights' && <Plane className="w-5 h-5 text-primary mt-1" />}
          {tripType === 'hotels' && <Hotel className="w-5 h-5 text-primary mt-1" />}
          <div className="flex-1">
            <p className="text-sm text-foreground leading-relaxed">
              I found several options for you! Would you like to book this yourself, or would you prefer to be matched with a Goldsainte Certified Travel Agent who can handle all the details and add personalized touches to your trip?
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              console.log('🎯 [TELEMETRY] booking_choice=self_service');
              onChoice('self_service');
            }}
            className="w-full justify-start"
            variant="default"
          >
            Book it myself (via Expedia)
          </Button>
          
          <Button
            onClick={() => {
              console.log('🎯 [TELEMETRY] booking_choice=agent');
              onChoice('agent');
            }}
            className="w-full justify-start"
            variant="outline"
          >
            Match me with a Goldsainte agent
          </Button>
        </div>
      </div>
    </Card>
  );
};
