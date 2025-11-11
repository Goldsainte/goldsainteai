import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, User, DollarSign, Star, Phone } from 'lucide-react';

interface AgentIntakeFormProps {
  tripType: 'hotels' | 'flights' | 'hotel+flight';
  initialData?: any;
  onComplete: (payload: any) => void;
}

export const AgentIntakeForm = ({ tripType, initialData, onComplete }: AgentIntakeFormProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    destination: initialData?.destination || '',
    checkIn: initialData?.checkIn || '',
    checkOut: initialData?.checkOut || '',
    flexibility: '',
    origin: initialData?.origin || '',
    flightDestination: initialData?.destination || '',
    departDate: initialData?.departDate || '',
    returnDate: initialData?.returnDate || '',
    tripMode: 'roundTrip',
    rooms: '1',
    adults: initialData?.adults || '2',
    children: '0',
    childrenAges: [] as number[],
    budgetAmount: '',
    budgetType: 'perNight',
    currency: 'USD',
    neighborhoods: '',
    starMin: '',
    starMax: '',
    propertyTypes: [] as string[],
    amenities: [] as string[],
    bedType: '',
    refundable: false,
    breakfast: false,
    accessibility: [] as string[],
    petFriendly: false,
    loyaltyPrograms: '',
    cabinClass: 'ECONOMY',
    nonstopOnly: false,
    airlinePrefs: '',
    seatPref: '',
    baggageNeeds: '',
    loyaltyFF: '',
    tsaPre: false,
    specialNotes: '',
    fullName: '',
    email: '',
    phone: '',
    timezone: '',
    preferredContact: 'email'
  });

  const totalSteps = tripType === 'hotels' ? 5 : 5;
  
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, value: string) => {
    const current = formData[field as keyof typeof formData] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateField(field, updated);
  };

  const handleNext = () => {
    console.log('🎯 [TELEMETRY] agent_intake_field_completed', { step });
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    console.log('🎯 [TELEMETRY] agent_intake_completed', { tripType });
    
    const payload: any = {
      source: 'goldsainte_ai_chat',
      choice: 'agent',
      tripType,
      lead: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        timezone: formData.timezone,
        preferredContact: formData.preferredContact
      }
    };

    if (tripType === 'hotels' || tripType === 'hotel+flight') {
      payload.hotelRequest = {
        destination: formData.destination,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        flexibility: formData.flexibility,
        rooms: parseInt(formData.rooms),
        guests: { adults: parseInt(formData.adults), children: formData.childrenAges },
        budgetPerNight: formData.budgetType === 'perNight' ? parseFloat(formData.budgetAmount) : undefined,
        budgetTotal: formData.budgetType === 'total' ? parseFloat(formData.budgetAmount) : undefined,
        currency: formData.currency,
        preferences: {
          neighborhoods: formData.neighborhoods.split(',').map(n => n.trim()).filter(Boolean),
          starMin: formData.starMin ? parseInt(formData.starMin) : undefined,
          starMax: formData.starMax ? parseInt(formData.starMax) : undefined,
          propertyTypes: formData.propertyTypes,
          amenities: formData.amenities,
          bedType: formData.bedType,
          refundable: formData.refundable,
          breakfast: formData.breakfast,
          accessibility: formData.accessibility,
          petFriendly: formData.petFriendly,
          loyalty: formData.loyaltyPrograms.split(',').map(l => l.trim()).filter(Boolean)
        },
        notes: formData.specialNotes
      };
    }

    if (tripType === 'flights' || tripType === 'hotel+flight') {
      payload.flightRequest = {
        oneWay: formData.tripMode === 'oneWay',
        origin: formData.origin,
        destination: formData.flightDestination,
        departDate: formData.departDate,
        returnDate: formData.tripMode === 'roundTrip' ? formData.returnDate : undefined,
        flexibility: formData.flexibility,
        cabin: formData.cabinClass,
        nonstopOnly: formData.nonstopOnly,
        airlinePrefs: formData.airlinePrefs.split(',').map(a => a.trim()).filter(Boolean),
        passengers: { adults: parseInt(formData.adults), children: formData.childrenAges, infantsLap: 0, infantsSeat: 0 },
        seatPref: formData.seatPref,
        baggageNeeds: formData.baggageNeeds,
        budgetTotal: parseFloat(formData.budgetAmount) || undefined,
        currency: formData.currency,
        loyaltyPrograms: formData.loyaltyFF.split(',').map(l => l.trim()).filter(Boolean),
        tsaPre: formData.tsaPre,
        notes: formData.specialNotes
      };
    }

    onComplete(payload);
  };

  const renderStep = () => {
    const steps = tripType === 'hotels' 
      ? [
          { title: 'Trip Basics', icon: Calendar, render: () => (
            <div className="space-y-4">
              <div><Label>Destination *</Label><Input value={formData.destination} onChange={(e) => updateField('destination', e.target.value)} placeholder="e.g., Miami Beach" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Check-in *</Label><Input type="date" value={formData.checkIn} onChange={(e) => updateField('checkIn', e.target.value)} /></div>
                <div><Label>Check-out *</Label><Input type="date" value={formData.checkOut} onChange={(e) => updateField('checkOut', e.target.value)} /></div>
              </div>
              <div><Label>Date Flexibility</Label><Select value={formData.flexibility} onValueChange={(v) => updateField('flexibility', v)}><SelectTrigger><SelectValue placeholder="Select flexibility" /></SelectTrigger><SelectContent><SelectItem value="exact">Exact dates</SelectItem><SelectItem value="1day">±1 day</SelectItem><SelectItem value="2days">±2 days</SelectItem><SelectItem value="3days">±3 days</SelectItem></SelectContent></Select></div>
            </div>
          )},
          { title: 'Party Details', icon: User, render: () => (
            <div className="space-y-4">
              <div><Label>Rooms *</Label><Select value={formData.rooms} onValueChange={(v) => updateField('rooms', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Adults *</Label><Select value={formData.adults} onValueChange={(v) => updateField('adults', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5,6].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Children</Label><Select value={formData.children} onValueChange={(v) => { updateField('children', v); updateField('childrenAges', Array(parseInt(v)).fill(0)); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[0,1,2,3,4].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent></Select></div>
              </div>
              {parseInt(formData.children) > 0 && <div><Label>Children Ages</Label><div className="grid grid-cols-4 gap-2 mt-2">{Array(parseInt(formData.children)).fill(0).map((_, i) => <Input key={i} type="number" min="0" max="17" placeholder={`Age ${i+1}`} value={formData.childrenAges[i] || ''} onChange={(e) => { const ages = [...formData.childrenAges]; ages[i] = parseInt(e.target.value) || 0; updateField('childrenAges', ages); }} />)}</div></div>}
            </div>
          )},
          { title: 'Budget', icon: DollarSign, render: () => (
            <div className="space-y-4">
              <div><Label>Budget Type</Label><Select value={formData.budgetType} onValueChange={(v) => updateField('budgetType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="perNight">Per Night</SelectItem><SelectItem value="total">Total Trip</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input type="number" placeholder="500" value={formData.budgetAmount} onChange={(e) => updateField('budgetAmount', e.target.value)} /></div>
                <div><Label>Currency</Label><Select value={formData.currency} onValueChange={(v) => updateField('currency', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select></div>
              </div>
            </div>
          )},
          { title: 'Preferences', icon: Star, render: () => (
            <div className="space-y-4">
              <div><Label>Neighborhoods</Label><Input placeholder="South Beach, Downtown" value={formData.neighborhoods} onChange={(e) => updateField('neighborhoods', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Min Stars</Label><Select value={formData.starMin} onValueChange={(v) => updateField('starMin', v)}><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger><SelectContent>{[3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n} Star</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Max Stars</Label><Select value={formData.starMax} onValueChange={(v) => updateField('starMax', v)}><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger><SelectContent>{[3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n} Star</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div><Label>Property Type</Label><div className="grid grid-cols-2 gap-2 mt-2">{['Hotel','Resort','Apartment','Villa'].map(t => <div key={t} className="flex items-center space-x-2"><Checkbox id={`prop-${t}`} checked={formData.propertyTypes.includes(t)} onCheckedChange={() => toggleArrayItem('propertyTypes', t)} /><label htmlFor={`prop-${t}`} className="text-sm">{t}</label></div>)}</div></div>
              <div><Label>Amenities</Label><div className="grid grid-cols-2 gap-2 mt-2">{['Pool','Gym','Spa','Parking','EV Charging','Beach'].map(a => <div key={a} className="flex items-center space-x-2"><Checkbox id={`am-${a}`} checked={formData.amenities.includes(a)} onCheckedChange={() => toggleArrayItem('amenities', a)} /><label htmlFor={`am-${a}`} className="text-sm">{a}</label></div>)}</div></div>
              <div className="flex items-center space-x-2"><Checkbox id="ref" checked={formData.refundable} onCheckedChange={(c) => updateField('refundable', c)} /><label htmlFor="ref" className="text-sm">Refundable</label></div>
              <div className="flex items-center space-x-2"><Checkbox id="bfast" checked={formData.breakfast} onCheckedChange={(c) => updateField('breakfast', c)} /><label htmlFor="bfast" className="text-sm">Breakfast</label></div>
              <div className="flex items-center space-x-2"><Checkbox id="pet" checked={formData.petFriendly} onCheckedChange={(c) => updateField('petFriendly', c)} /><label htmlFor="pet" className="text-sm">Pet Friendly</label></div>
              <div><Label>Loyalty Programs</Label><Input placeholder="Marriott, Hilton" value={formData.loyaltyPrograms} onChange={(e) => updateField('loyaltyPrograms', e.target.value)} /></div>
            </div>
          )},
          { title: 'Contact', icon: Phone, render: () => (
            <div className="space-y-4">
              <div><Label>Full Name *</Label><Input placeholder="John Doe" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)} /></div>
              <div><Label>Email *</Label><Input type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => updateField('email', e.target.value)} /></div>
              <div><Label>Phone *</Label><Input type="tel" placeholder="+1 555-123-4567" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} /></div>
              <div><Label>Timezone</Label><Select value={formData.timezone} onValueChange={(v) => updateField('timezone', v)}><SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger><SelectContent><SelectItem value="America/New_York">Eastern</SelectItem><SelectItem value="America/Chicago">Central</SelectItem><SelectItem value="America/Denver">Mountain</SelectItem><SelectItem value="America/Los_Angeles">Pacific</SelectItem><SelectItem value="Europe/London">London</SelectItem><SelectItem value="Europe/Paris">Paris</SelectItem></SelectContent></Select></div>
              <div><Label>Preferred Contact *</Label><Select value={formData.preferredContact} onValueChange={(v) => updateField('preferredContact', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email">Email</SelectItem><SelectItem value="phone">Phone</SelectItem><SelectItem value="sms">SMS</SelectItem></SelectContent></Select></div>
              <div><Label>Special Notes</Label><Input placeholder="Special occasions, requests..." value={formData.specialNotes} onChange={(e) => updateField('specialNotes', e.target.value)} /></div>
            </div>
          )}
        ]
      : [
          { title: 'Flight Details', icon: Calendar, render: () => (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button type="button" variant={formData.tripMode === 'roundTrip' ? 'default' : 'outline'} onClick={() => updateField('tripMode', 'roundTrip')} className="flex-1">Round Trip</Button>
                <Button type="button" variant={formData.tripMode === 'oneWay' ? 'default' : 'outline'} onClick={() => updateField('tripMode', 'oneWay')} className="flex-1">One Way</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>From *</Label><Input placeholder="JFK, New York" value={formData.origin} onChange={(e) => updateField('origin', e.target.value)} /></div>
                <div><Label>To *</Label><Input placeholder="LHR, London" value={formData.flightDestination} onChange={(e) => updateField('flightDestination', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Departure *</Label><Input type="date" value={formData.departDate} onChange={(e) => updateField('departDate', e.target.value)} /></div>
                {formData.tripMode === 'roundTrip' && <div><Label>Return *</Label><Input type="date" value={formData.returnDate} onChange={(e) => updateField('returnDate', e.target.value)} /></div>}
              </div>
              <div><Label>Flexibility</Label><Select value={formData.flexibility} onValueChange={(v) => updateField('flexibility', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="exact">Exact</SelectItem><SelectItem value="1day">±1 day</SelectItem><SelectItem value="2days">±2 days</SelectItem><SelectItem value="3days">±3 days</SelectItem></SelectContent></Select></div>
            </div>
          )},
          { title: 'Passengers', icon: User, render: () => (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Adults *</Label><Select value={formData.adults} onValueChange={(v) => updateField('adults', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5,6].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Children</Label><Select value={formData.children} onValueChange={(v) => { updateField('children', v); updateField('childrenAges', Array(parseInt(v)).fill(0)); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[0,1,2,3,4].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent></Select></div>
              </div>
              {parseInt(formData.children) > 0 && <div><Label>Children Ages</Label><div className="grid grid-cols-4 gap-2 mt-2">{Array(parseInt(formData.children)).fill(0).map((_, i) => <Input key={i} type="number" min="0" max="17" placeholder={`Age ${i+1}`} value={formData.childrenAges[i] || ''} onChange={(e) => { const ages = [...formData.childrenAges]; ages[i] = parseInt(e.target.value) || 0; updateField('childrenAges', ages); }} />)}</div></div>}
            </div>
          )},
          { title: 'Budget', icon: DollarSign, render: () => (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Total Budget</Label><Input type="number" placeholder="2000" value={formData.budgetAmount} onChange={(e) => updateField('budgetAmount', e.target.value)} /></div>
                <div><Label>Currency</Label><Select value={formData.currency} onValueChange={(v) => updateField('currency', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select></div>
              </div>
            </div>
          )},
          { title: 'Preferences', icon: Star, render: () => (
            <div className="space-y-4">
              <div><Label>Cabin Class *</Label><Select value={formData.cabinClass} onValueChange={(v) => updateField('cabinClass', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ECONOMY">Economy</SelectItem><SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem><SelectItem value="BUSINESS">Business</SelectItem><SelectItem value="FIRST">First</SelectItem></SelectContent></Select></div>
              <div className="flex items-center space-x-2"><Checkbox id="nonstop" checked={formData.nonstopOnly} onCheckedChange={(c) => updateField('nonstopOnly', c)} /><label htmlFor="nonstop" className="text-sm">Nonstop Only</label></div>
              <div><Label>Preferred Airlines</Label><Input placeholder="Delta, United" value={formData.airlinePrefs} onChange={(e) => updateField('airlinePrefs', e.target.value)} /></div>
              <div><Label>Seat Preference</Label><Select value={formData.seatPref} onValueChange={(v) => updateField('seatPref', v)}><SelectTrigger><SelectValue placeholder="No preference" /></SelectTrigger><SelectContent><SelectItem value="window">Window</SelectItem><SelectItem value="aisle">Aisle</SelectItem><SelectItem value="middle">Middle</SelectItem></SelectContent></Select></div>
              <div><Label>Baggage Needs</Label><Input placeholder="2 checked, 1 carry-on" value={formData.baggageNeeds} onChange={(e) => updateField('baggageNeeds', e.target.value)} /></div>
              <div><Label>FF Programs</Label><Input placeholder="Delta SkyMiles" value={formData.loyaltyFF} onChange={(e) => updateField('loyaltyFF', e.target.value)} /></div>
              <div className="flex items-center space-x-2"><Checkbox id="tsa" checked={formData.tsaPre} onCheckedChange={(c) => updateField('tsaPre', c)} /><label htmlFor="tsa" className="text-sm">TSA PreCheck/Global Entry</label></div>
            </div>
          )},
          { title: 'Contact', icon: Phone, render: () => (
            <div className="space-y-4">
              <div><Label>Full Name *</Label><Input placeholder="John Doe" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)} /></div>
              <div><Label>Email *</Label><Input type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => updateField('email', e.target.value)} /></div>
              <div><Label>Phone *</Label><Input type="tel" placeholder="+1 555-123-4567" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} /></div>
              <div><Label>Timezone</Label><Select value={formData.timezone} onValueChange={(v) => updateField('timezone', v)}><SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger><SelectContent><SelectItem value="America/New_York">Eastern</SelectItem><SelectItem value="America/Chicago">Central</SelectItem><SelectItem value="America/Denver">Mountain</SelectItem><SelectItem value="America/Los_Angeles">Pacific</SelectItem><SelectItem value="Europe/London">London</SelectItem><SelectItem value="Europe/Paris">Paris</SelectItem></SelectContent></Select></div>
              <div><Label>Preferred Contact *</Label><Select value={formData.preferredContact} onValueChange={(v) => updateField('preferredContact', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email">Email</SelectItem><SelectItem value="phone">Phone</SelectItem><SelectItem value="sms">SMS</SelectItem></SelectContent></Select></div>
              <div><Label>Special Notes</Label><Input placeholder="Special requests..." value={formData.specialNotes} onChange={(e) => updateField('specialNotes', e.target.value)} /></div>
            </div>
          )}
        ];

    const currentStep = steps[step - 1];
    const Icon = currentStep.icon;

    return (
      <Card className="w-full max-w-2xl mx-auto" role="form" aria-labelledby="intake-form-title">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
            <CardTitle id="intake-form-title" className="text-[18px] sm:text-[20px]">{currentStep.title}</CardTitle>
          </div>
          <CardDescription>
            Step {step} of {totalSteps}
          </CardDescription>
          <Progress value={(step / totalSteps) * 100} className="mt-4" aria-label={`Progress: step ${step} of ${totalSteps}`} />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {currentStep.render()}
            <div className="flex justify-between gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack} 
                disabled={step === 1}
                className="min-h-[44px] min-w-[100px]"
                aria-label="Go to previous step"
              >
                Back
              </Button>
              {step === totalSteps ? (
                <Button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={!formData.fullName || !formData.email || !formData.phone}
                  className="min-h-[44px] min-w-[140px]"
                  aria-label="Submit booking request to Goldsainte agent"
                >
                  Submit Request
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="min-h-[44px] min-w-[100px]"
                  aria-label="Go to next step"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return renderStep();
};
