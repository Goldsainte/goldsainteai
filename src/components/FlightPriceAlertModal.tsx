import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2 } from "lucide-react";

interface FlightPriceAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  cabinClass?: string;
  currentPrice?: number;
  currency?: string;
}

export const FlightPriceAlertModal = ({
  open,
  onOpenChange,
  origin,
  destination,
  departureDate,
  returnDate,
  adults = 1,
  cabinClass = 'ECONOMY',
  currentPrice,
  currency = 'USD'
}: FlightPriceAlertModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [targetPrice, setTargetPrice] = useState(currentPrice ? Math.floor(currentPrice * 0.9).toString() : '');
  const [notificationFrequency, setNotificationFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant');

  const handleCreateAlert = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to set price alerts",
        variant: "destructive"
      });
      return;
    }

    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid target price",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('flight_price_alerts')
        .insert({
          user_id: user.id,
          origin_code: origin.split(' - ')[0].trim(),
          destination_code: destination.split(' - ')[0].trim(),
          departure_date: departureDate,
          return_date: returnDate || null,
          adults,
          cabin_class: cabinClass,
          target_price: parseFloat(targetPrice),
          currency,
          notification_frequency: notificationFrequency,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "✅ Price Alert Created!",
        description: `We'll notify you when flights drop to ${currency} ${targetPrice} or below`
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating price alert:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create price alert",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const originCode = origin.split(' - ')[0].trim();
  const destCode = destination.split(' - ')[0].trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Set Price Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when this flight's price drops below your target
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Route Info */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg">{originCode}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-bold text-lg">{destCode}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {returnDate && ` - ${new Date(returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {adults} {adults === 1 ? 'Adult' : 'Adults'} • {cabinClass}
            </div>
          </div>

          {/* Current Price Display */}
          {currentPrice && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="text-sm text-muted-foreground mb-1">Current Best Price</div>
              <div className="text-2xl font-bold text-primary">{currency} {currentPrice.toFixed(2)}</div>
            </div>
          )}

          {/* Target Price Input */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice">
              Target Price ({currency})
            </Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.01"
              placeholder="Enter your target price"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We'll notify you when prices drop to or below this amount
            </p>
          </div>

          {/* Notification Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Notification Frequency</Label>
            <Select
              value={notificationFrequency}
              onValueChange={(value: any) => setNotificationFrequency(value)}
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant (Every price drop)</SelectItem>
                <SelectItem value="daily">Daily Summary</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateAlert}
            className="flex-1"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Alert
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
