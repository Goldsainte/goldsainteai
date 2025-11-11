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
              How would you like to handle this booking? You can book in two ways: (1) Work with a Goldsainte Certified Travel Agent for personalized support, exclusive perks, and seamless trip coordination, or (2) Book it yourself through our affiliate partner Expedia for a quick, self-service option.
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
