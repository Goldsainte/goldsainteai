import { DollarSign, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  amount?: number;
  showConversion?: boolean;
}

export const CurrencySelector = ({
  selectedCurrency,
  onCurrencyChange,
  amount,
  showConversion = false,
}: CurrencySelectorProps) => {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  const currencies: Currency[] = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  ];

  useEffect(() => {
    if (showConversion && amount && selectedCurrency !== "USD") {
      fetchExchangeRate();
    }
  }, [selectedCurrency, amount, showConversion]);

  const fetchExchangeRate = async () => {
    try {
      const { data, error } = await supabase
        .rpc("convert_currency", {
          amount: amount || 0,
          from_curr: "USD",
          to_curr: selectedCurrency,
        });

      if (error) throw error;
      
      if (data && amount) {
        setConvertedAmount(data);
        setExchangeRate(data / amount);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  };

  const selectedCurrencyData = currencies.find((c) => c.code === selectedCurrency);

  return (
    <div className="space-y-2">
      <Label htmlFor="currency">Currency</Label>
      <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
        <SelectTrigger id="currency">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <span className="font-mono">{currency.symbol}</span>
                <span>{currency.name}</span>
                <Badge variant="outline">{currency.code}</Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showConversion && amount && convertedAmount && selectedCurrency !== "USD" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Currency Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">USD {amount.toFixed(2)}</span>
              <span className="text-muted-foreground">≈</span>
              <span className="font-semibold">
                {selectedCurrencyData?.symbol}
                {convertedAmount.toFixed(2)}
              </span>
            </div>
            {exchangeRate && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Exchange Rate: 1 USD = {exchangeRate.toFixed(4)} {selectedCurrency}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
