import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plane, Hotel } from 'lucide-react';

interface BookingChoicePromptProps {
  tripType: 'hotels' | 'flights' | 'hotel+flight';
  onChoice: (choice: 'self_service' | 'agent') => void;
  defaultChoice?: 'self_service' | 'agent'; // NEW - hint for recommended option
  prefillData?: {
    location?: string;
    destination?: string;
    origin?: string;
    checkIn?: string;
    checkOut?: string;
    departureDate?: string;
    returnDate?: string;
  };
}

export const BookingChoicePrompt = ({ tripType, onChoice, prefillData }: BookingChoicePromptProps) => {
  const destination = prefillData?.location || prefillData?.destination || '';
  const origin = prefillData?.origin || '';
  
  const getMessage = () => {
    if (tripType === 'hotels' && destination) {
      return `I can help you get hotels booked in ${destination}. Would you like a Goldsainte Certified Travel Agent to curate the trip for you, or would you prefer to book it yourself via Expedia?`;
    } else if (tripType === 'flights' && destination) {
      const route = origin ? `from ${origin} to ${destination}` : `to ${destination}`;
      return `I can help you get flights booked ${route}. Would you like a Goldsainte Certified Travel Agent to handle all the details, or would you prefer to book it yourself via Expedia?`;
    }
    return "I can help you get this booked. Would you like a Goldsainte Certified Travel Agent to curate the trip for you, or would you prefer to book it yourself via Expedia?";
  };

  return (
    <Card className="p-3 sm:p-4 bg-card border-border" role="region" aria-labelledby="booking-choice-title">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-start gap-3">
          {tripType === 'flights' && <Plane className="w-5 h-5 text-primary mt-1 flex-shrink-0" aria-hidden="true" />}
          {tripType === 'hotels' && <Hotel className="w-5 h-5 text-primary mt-1 flex-shrink-0" aria-hidden="true" />}
          <div className="flex-1 min-w-0">
            <p id="booking-choice-title" className="text-[14px] sm:text-[15px] text-foreground leading-relaxed">
              {getMessage()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 sm:gap-3">
          {/* PRIMARY BUTTON - Agent path (appears FIRST) */}
          <Button
            onClick={() => {
              console.log('🎯 [TELEMETRY] booking_choice=agent');
              onChoice('agent');
            }}
            className="w-full justify-start min-h-[48px] text-[14px] sm:text-[15px]"
            variant="default"
            aria-label="Get matched with a Goldsainte certified travel agent for personalized service"
          >
            Match me with a Goldsainte agent
          </Button>
          
          {/* SECONDARY BUTTON - Self-service */}
          <Button
            onClick={() => {
              console.log('🎯 [TELEMETRY] booking_choice=self_service');
              onChoice('self_service');
            }}
            className="w-full justify-start min-h-[48px] text-[14px] sm:text-[15px]"
            variant="outline"
            aria-label="Book yourself using the Expedia search widget"
          >
            Book it myself (via Expedia)
          </Button>
        </div>
      </div>
    </Card>
  );
};
