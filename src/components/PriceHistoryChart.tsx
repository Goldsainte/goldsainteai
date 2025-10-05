import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PriceHistoryData {
  date_recorded: string;
  average_price: number;
  sample_size: number;
}

interface PriceHistoryChartProps {
  bookingType: string;
  destination?: string;
}

export const PriceHistoryChart = ({ bookingType, destination }: PriceHistoryChartProps) => {
  const [priceData, setPriceData] = useState<PriceHistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPriceHistory();
  }, [bookingType, destination]);

  const fetchPriceHistory = async () => {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      let query = (supabase as any)
        .from("price_history")
        .select("date_recorded, average_price, sample_size")
        .eq("booking_type", bookingType)
        .gte("date_recorded", threeMonthsAgo.toISOString().split("T")[0])
        .order("date_recorded", { ascending: true });

      if (destination) {
        query = query.eq("destination", destination);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPriceData(data || []);
    } catch (error) {
      console.error("Error fetching price history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || priceData.length === 0) {
    return null;
  }

  const chartData = priceData.map((item) => ({
    date: format(new Date(item.date_recorded), "MMM dd"),
    price: item.average_price,
    samples: item.sample_size,
  }));

  const latestPrice = priceData[priceData.length - 1]?.average_price || 0;
  const oldestPrice = priceData[0]?.average_price || 0;
  const priceChange = latestPrice - oldestPrice;
  const percentChange = oldestPrice > 0 ? (priceChange / oldestPrice) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Price Trends (Last 90 Days)
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Market pricing history for {bookingType}</span>
          <div className="flex items-center gap-2">
            <span className={percentChange >= 0 ? "text-green-500" : "text-red-500"}>
              {percentChange >= 0 ? "+" : ""}
              {percentChange.toFixed(1)}%
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              formatter={(value: number, name: string) => {
                if (name === "price") return [`$${value.toFixed(2)}`, "Average Price"];
                return [value, "Samples"];
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Based on {priceData.reduce((sum, item) => sum + item.sample_size, 0)} bookings
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
