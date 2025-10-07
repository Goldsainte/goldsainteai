import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Traveler {
  name: string;
  email: string;
}

interface GroupPaymentSetupProps {
  jobId: string;
  totalAmount: number;
  currency: string;
  onComplete?: () => void;
}

export const GroupPaymentSetup = ({ jobId, totalAmount, currency, onComplete }: GroupPaymentSetupProps) => {
  const [paymentMode, setPaymentMode] = useState<'single_payer' | 'split_equal'>('split_equal');
  const [travelers, setTravelers] = useState<Traveler[]>([
    { name: '', email: '' },
    { name: '', email: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addTraveler = () => {
    setTravelers([...travelers, { name: '', email: '' }]);
  };

  const removeTraveler = (index: number) => {
    if (travelers.length > 1) {
      setTravelers(travelers.filter((_, i) => i !== index));
    }
  };

  const updateTraveler = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...travelers];
    updated[index][field] = value;
    setTravelers(updated);
  };

  const calculateAmountPerTraveler = () => {
    if (paymentMode === 'single_payer') return totalAmount;
    return totalAmount / travelers.length;
  };

  const handleCreatePaymentLinks = async () => {
    // Validate travelers
    const invalidTravelers = travelers.some(t => !t.name.trim() || !t.email.trim());
    if (invalidTravelers) {
      toast({
        title: "Missing Information",
        description: "Please fill in all traveler names and emails",
        variant: "destructive"
      });
      return;
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = travelers.some(t => !emailRegex.test(t.email));
    if (invalidEmails) {
      toast({
        title: "Invalid Email",
        description: "Please enter valid email addresses for all travelers",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-group-payment-links', {
        body: {
          jobId,
          travelers,
          paymentMode
        }
      });

      if (error) throw error;

      toast({
        title: "Payment Links Created!",
        description: `Email notifications sent to ${data.travelers.length} traveler(s)`,
      });

      onComplete?.();
    } catch (error: any) {
      console.error('Error creating payment links:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create payment links",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Up Group Payment</CardTitle>
        <CardDescription>
          Configure how payments will be split among travelers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Mode Selection */}
        <div className="space-y-3">
          <Label>Payment Method</Label>
          <RadioGroup value={paymentMode} onValueChange={(value: any) => setPaymentMode(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single_payer" id="single_payer" />
              <Label htmlFor="single_payer" className="font-normal cursor-pointer">
                One person pays total ({currency} {totalAmount.toFixed(2)})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="split_equal" id="split_equal" />
              <Label htmlFor="split_equal" className="font-normal cursor-pointer">
                Split equally ({currency} {calculateAmountPerTraveler().toFixed(2)} per person)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Travelers List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Travelers</Label>
            <Button onClick={addTraveler} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Traveler
            </Button>
          </div>

          {travelers.map((traveler, index) => (
            <Card key={index} className="p-4">
              <div className="flex gap-3 items-start">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor={`name-${index}`}>Name</Label>
                    <Input
                      id={`name-${index}`}
                      value={traveler.name}
                      onChange={(e) => updateTraveler(index, 'name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`email-${index}`}>Email</Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      value={traveler.email}
                      onChange={(e) => updateTraveler(index, 'email', e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  {paymentMode === 'split_equal' && (
                    <p className="text-sm text-muted-foreground">
                      Amount: {currency} {calculateAmountPerTraveler().toFixed(2)}
                    </p>
                  )}
                  {paymentMode === 'single_payer' && index === 0 && (
                    <p className="text-sm text-muted-foreground">
                      This person will pay the full amount: {currency} {totalAmount.toFixed(2)}
                    </p>
                  )}
                </div>
                {travelers.length > 1 && (
                  <Button
                    onClick={() => removeTraveler(index)}
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-semibold">Payment Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-medium">{currency} {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Number of Travelers:</span>
              <span className="font-medium">{travelers.length}</span>
            </div>
            {paymentMode === 'split_equal' && (
              <div className="flex justify-between">
                <span>Amount per Traveler:</span>
                <span className="font-medium">{currency} {calculateAmountPerTraveler().toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleCreatePaymentLinks} 
          disabled={loading}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? 'Sending Payment Links...' : 'Send Payment Links to Travelers'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Each traveler will receive an email with their unique payment link. 
          The booking will be confirmed once all payments are received.
        </p>
      </CardContent>
    </Card>
  );
};
