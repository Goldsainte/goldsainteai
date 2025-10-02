import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Package } from "lucide-react";

interface BaggageSelectorProps {
  flight: any;
  passengers: number;
  onBaggageSelected: (baggage: any[]) => void;
  selectedBaggage: any[];
}

export const BaggageSelector = ({ flight, passengers, onBaggageSelected, selectedBaggage }: BaggageSelectorProps) => {
  const [baggage, setBaggage] = useState<any[]>(
    selectedBaggage.length > 0 
      ? selectedBaggage 
      : Array.from({ length: passengers }, () => ({
          carryOn: 1,
          checked: 0
        }))
  );

  // Parse baggage allowance from flight offer
  const baggageAllowance = flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags || {};
  const includedChecked = baggageAllowance.quantity || 0;
  const carryOnIncluded = 1; // Standard: 1 carry-on included

  // Baggage fees (example pricing - should come from airline in production)
  const checkedBagFee = 35; // per bag
  const extraCarryOnFee = 0; // Usually included
  const currency = flight.price.currency || 'USD';

  const updateBaggage = (passengerIndex: number, type: 'carryOn' | 'checked', value: number) => {
    const updated = [...baggage];
    updated[passengerIndex] = { ...updated[passengerIndex], [type]: value };
    setBaggage(updated);
  };

  const calculateTotal = () => {
    let total = 0;
    baggage.forEach((b) => {
      // Charge for checked bags beyond included allowance
      const extraChecked = Math.max(0, b.checked - includedChecked);
      total += extraChecked * checkedBagFee;
      
      // Charge for extra carry-ons if applicable
      const extraCarryOn = Math.max(0, b.carryOn - carryOnIncluded);
      total += extraCarryOn * extraCarryOnFee;
    });
    return total;
  };

  const handleConfirm = () => {
    onBaggageSelected(baggage);
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Baggage Allowance</h3>
        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>Carry-on: {carryOnIncluded} bag included per passenger</span>
          </p>
          <p className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Checked bags: {includedChecked} bag{includedChecked !== 1 ? 's' : ''} included per passenger</span>
          </p>
          <p className="text-muted-foreground">
            Additional checked bags: {currency} {checkedBagFee} each
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: passengers }).map((_, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Passenger {index + 1}</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`carryOn-${index}`}>Carry-on Bags</Label>
                <Select
                  value={baggage[index]?.carryOn?.toString() || "1"}
                  onValueChange={(value) => updateBaggage(index, 'carryOn', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 bags</SelectItem>
                    <SelectItem value="1">1 bag (Included)</SelectItem>
                    <SelectItem value="2">2 bags</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`checked-${index}`}>Checked Bags</Label>
                <Select
                  value={baggage[index]?.checked?.toString() || "0"}
                  onValueChange={(value) => updateBaggage(index, 'checked', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 bags {includedChecked > 0 ? '(Not using included)' : ''}</SelectItem>
                    {includedChecked > 0 && <SelectItem value="1">1 bag (Included)</SelectItem>}
                    {includedChecked > 1 && <SelectItem value="2">2 bags (Included)</SelectItem>}
                    <SelectItem value={includedChecked > 0 ? (includedChecked + 1).toString() : "1"}>
                      {includedChecked > 0 ? includedChecked + 1 : 1} bag{includedChecked > 0 ? 's' : ''} 
                      {includedChecked > 0 && ` (+${currency} ${checkedBagFee})`}
                    </SelectItem>
                    <SelectItem value={includedChecked > 0 ? (includedChecked + 2).toString() : "2"}>
                      {includedChecked > 0 ? includedChecked + 2 : 2} bags 
                      (+{currency} {checkedBagFee * (includedChecked > 0 ? 2 : 2)})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {calculateTotal() > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Additional Baggage Fees:</span>
            <span className="text-lg font-bold">{currency} {calculateTotal().toFixed(2)}</span>
          </div>
        </div>
      )}

      <Button onClick={handleConfirm} className="w-full">
        Continue to Payment
      </Button>
    </div>
  );
};