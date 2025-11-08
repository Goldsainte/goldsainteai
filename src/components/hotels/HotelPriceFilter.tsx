import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HotelPriceFilterProps {
  maxPrice: number;
  currency: string;
  onPriceChange: (value: number) => void;
  onCurrencyChange: (currency: string) => void;
  disabled?: boolean;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export const HotelPriceFilter = ({
  maxPrice,
  currency,
  onPriceChange,
  onCurrencyChange,
  disabled = false
}: HotelPriceFilterProps) => {
  const [localMax, setLocalMax] = useState(maxPrice);
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
  
  // Determine max slider value based on currency
  const getMaxSliderValue = () => {
    switch (currency) {
      case 'JPY': return 50000;
      case 'GBP':
      case 'EUR': return 1000;
      case 'USD':
      case 'CAD':
      case 'AUD':
      default: return 1500;
    }
  };

  const maxSliderValue = getMaxSliderValue();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Budget Filter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Max Price Per Night</Label>
            <span className="text-lg font-semibold text-primary">
              {currencySymbol}{localMax}
            </span>
          </div>
          <Slider
            value={[localMax]}
            onValueChange={(values) => setLocalMax(values[0])}
            onValueCommit={(values) => onPriceChange(values[0])}
            max={maxSliderValue}
            min={10}
            step={currency === 'JPY' ? 100 : 10}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currencySymbol}10</span>
            <span>{currencySymbol}{maxSliderValue}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Currency</Label>
          <Select value={currency} onValueChange={onCurrencyChange} disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code} - {curr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
