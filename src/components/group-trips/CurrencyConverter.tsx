import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRightLeft, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CurrencyConverterProps {
  suggestions: any[];
}

const POPULAR_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
];

export const CurrencyConverter = ({ suggestions }: CurrencyConverterProps) => {
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [targetCurrency, setTargetCurrency] = useState("EUR");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExchangeRate();
  }, [baseCurrency, targetCurrency]);

  const fetchExchangeRate = async () => {
    if (baseCurrency === targetCurrency) {
      setExchangeRate(1);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-exchange-rates', {
        body: { baseCurrency, targetCurrency }
      });

      if (error) throw error;

      setExchangeRate(data.rate);
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast({
        title: "Exchange rate unavailable",
        description: "Could not fetch current exchange rates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalBudget = () => {
    return suggestions.reduce((sum, s) => sum + (s.price || 0), 0);
  };

  const convertPrice = (price: number) => {
    if (!exchangeRate) return price;
    return price * exchangeRate;
  };

  const getSymbol = (code: string) => {
    return POPULAR_CURRENCIES.find(c => c.code === code)?.symbol || code;
  };

  const totalBudget = getTotalBudget();

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Currency Converter</h3>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">From</label>
            <Select value={baseCurrency} onValueChange={setBaseCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">To</label>
            <Select value={targetCurrency} onValueChange={setTargetCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading exchange rate...</div>
        ) : exchangeRate ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Exchange Rate</div>
              <div className="text-lg font-semibold">
                1 {getSymbol(baseCurrency)} = {exchangeRate.toFixed(4)} {getSymbol(targetCurrency)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Budget</div>
                <div className="text-2xl font-bold">
                  {getSymbol(baseCurrency)}{totalBudget.toFixed(2)}
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-primary/5">
                <div className="text-sm text-muted-foreground mb-1">Converted Amount</div>
                <div className="text-2xl font-bold text-primary">
                  {getSymbol(targetCurrency)}{convertPrice(totalBudget).toFixed(2)}
                </div>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Individual Items</div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    suggestion.price && (
                      <div key={suggestion.id} className="flex items-center justify-between p-3 bg-muted/50 rounded text-sm">
                        <div className="flex-1 truncate">
                          <span className="font-medium">{suggestion.title}</span>
                          <span className="text-muted-foreground ml-2">({suggestion.suggestion_type})</span>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <span className="text-muted-foreground">
                            {getSymbol(baseCurrency)}{suggestion.price.toFixed(2)}
                          </span>
                          <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-primary">
                            {getSymbol(targetCurrency)}{convertPrice(suggestion.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
};
