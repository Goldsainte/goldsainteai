import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceCalendarProps {
  basePrice: number;
  currency: string;
  checkIn: string;
  checkOut: string;
}

export const PriceCalendar = ({ basePrice, currency, checkIn, checkOut }: PriceCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days with prices
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month with prices
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      // Simulate price variations
      let priceMultiplier = 1;
      if (isWeekend) priceMultiplier = 1.3;
      if (day >= 20 && day <= 25) priceMultiplier = 0.7; // Cheaper period
      if (day >= 1 && day <= 5) priceMultiplier = 1.5; // Peak period
      
      const dayPrice = Math.round(basePrice * priceMultiplier);
      const isDeal = priceMultiplier < 0.85;
      
      days.push({
        day,
        date,
        price: dayPrice,
        isDeal,
        isPast,
        isWeekend,
      });
    }
    
    return days;
  }, [currentMonth, basePrice]);

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cheapestDays = useMemo(() => {
    return calendarDays
      .filter((d): d is NonNullable<typeof d> => d !== null && d.isDeal && !d.isPast)
      .slice(0, 3)
      .map(d => d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }, [calendarDays]);

  return (
    <Card className="p-6 space-y-4 bg-background border shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Best time to book</h3>
        {cheapestDays.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingDown className="h-4 w-4" />
            <span className="font-medium">Save up to 30%</span>
          </div>
        )}
      </div>

      {cheapestDays.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-900">
            Lowest prices: {cheapestDays.join(', ')}
          </p>
        </div>
      )}

      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{monthName}</h4>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((dayData, idx) => {
          if (!dayData) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const { day, price, isDeal, isPast, isWeekend } = dayData;
          
          return (
            <button
              key={idx}
              disabled={isPast}
              className={cn(
                "aspect-square rounded-lg p-1 text-center transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed",
                isPast && "bg-muted",
                !isPast && !isDeal && "bg-background border hover:border-primary",
                isDeal && !isPast && "bg-green-50 border-2 border-green-500",
                isWeekend && !isPast && !isDeal && "bg-blue-50"
              )}
            >
              <div className="text-xs font-semibold">{day}</div>
              <div className={cn(
                "text-[10px] font-medium mt-0.5",
                isDeal ? "text-green-700" : "text-muted-foreground"
              )}>
                {currency}{price}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs pt-2 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border bg-background" />
          <span>Regular</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-50 border" />
          <span>Weekend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-50 border-2 border-green-500" />
          <span>Best deal</span>
        </div>
      </div>
    </Card>
  );
};
