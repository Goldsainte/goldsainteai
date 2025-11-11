import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AgentIntakeFormProps {
  tripType: 'hotels' | 'flights' | 'hotel+flight';
  prefillData?: any;
  onComplete: (leadId: string) => void;
}

export const AgentIntakeForm = ({ tripType, prefillData, onComplete }: AgentIntakeFormProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Contact info
    fullName: '',
    email: '',
    phone: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    preferredContact: 'email',
    
    // Pre-filled from chat
    ...prefillData,
    
    // Additional fields
    notes: ''
  });

  const totalSteps = tripType === 'hotels' ? 3 : tripType === 'flights' ? 3 : 4;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('🎯 [TELEMETRY] agent_intake_completed');
    
    try {
      const payload = {
        source: 'goldsainte_ai_chat',
        choice: 'agent',
        tripType,
        hotelRequest: tripType === 'hotels' || tripType === 'hotel+flight' ? {
          destination: formData.destination || prefillData?.location,
          checkIn: formData.checkIn || prefillData?.checkIn,
          checkOut: formData.checkOut || prefillData?.checkOut,
          rooms: formData.rooms || 1,
          guests: { 
            adults: formData.adults || prefillData?.guests || 2,
            children: []
          },
          budgetPerNight: formData.budgetPerNight || null,
          currency: formData.currency || 'USD',
          preferences: {},
          notes: formData.notes
        } : undefined,
        flightRequest: tripType === 'flights' || tripType === 'hotel+flight' ? {
          oneWay: formData.oneWay || false,
          origin: formData.origin || prefillData?.origin,
          destination: formData.destination || prefillData?.destination,
          departDate: formData.departDate || prefillData?.departureDate,
          returnDate: formData.returnDate || prefillData?.returnDate,
          cabin: formData.cabin || 'Economy',
          passengers: {
            adults: formData.adults || prefillData?.adults || 1,
            children: [],
            infantsLap: 0,
            infantsSeat: 0
          },
          notes: formData.notes
        } : undefined,
        lead: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          timezone: formData.timezone,
          preferredContact: formData.preferredContact
        }
      };

      // TODO: Replace with actual marketplace endpoint
      const { data, error } = await supabase.functions.invoke('create-agent-inquiry', {
        body: payload
      });

      if (error) throw error;

      const leadId = data?.leadId || 'TEMP-' + Date.now();
      console.log('🎯 [TELEMETRY] marketplace_lead_created', { leadId });
      onComplete(leadId);
    } catch (error) {
      console.error('Failed to create agent inquiry:', error);
      // Still complete for now
      onComplete('ERROR-' + Date.now());
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      // Contact Information
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Jordan Smith"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jordan@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-555-123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredContact">Preferred Contact Method</Label>
            <select
              id="preferredContact"
              value={formData.preferredContact}
              onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>
      );
    }

    if (step === 2) {
      // Trip-specific fields
      if (tripType === 'hotels') {
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budgetPerNight">Budget per Night (Optional)</Label>
              <Input
                id="budgetPerNight"
                type="number"
                value={formData.budgetPerNight || ''}
                onChange={(e) => setFormData({ ...formData, budgetPerNight: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rooms">Number of Rooms</Label>
              <Input
                id="rooms"
                type="number"
                value={formData.rooms || 1}
                onChange={(e) => setFormData({ ...formData, rooms: Number(e.target.value) })}
                min="1"
              />
            </div>
          </div>
        );
      } else if (tripType === 'flights') {
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cabin">Cabin Class</Label>
              <select
                id="cabin"
                value={formData.cabin || 'Economy'}
                onChange={(e) => setFormData({ ...formData, cabin: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="Economy">Economy</option>
                <option value="Premium Economy">Premium Economy</option>
                <option value="Business">Business</option>
                <option value="First">First Class</option>
              </select>
            </div>
          </div>
        );
      }
    }

    if (step === 3 || (step === totalSteps && step > 2)) {
      // Additional notes
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requests, preferences, or important details..."
              rows={4}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.fullName && formData.email && formData.phone;
    }
    return true;
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Agent Assistance Details</h3>
          <span className="text-xs text-muted-foreground">Step {step} of {totalSteps}</span>
        </div>

        {renderStep()}

        <div className="flex gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          
          {step < totalSteps ? (
            <Button
              onClick={() => {
                console.log('🎯 [TELEMETRY] agent_intake_field_completed', { step });
                setStep(step + 1);
              }}
              disabled={!canProceed()}
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
