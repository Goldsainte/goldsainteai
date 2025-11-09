import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type MobileDatePickerProps =
  | {
      mode?: "single";
      singleDate?: Date;
      onSingleDateChange?: (date: Date | undefined) => void;
      dateRange?: never;
      onDateRangeChange?: never;
      className?: string;
      placeholder?: string;
    }
  | {
      mode: "range";
      dateRange?: DateRange;
      onDateRangeChange: (range: DateRange | undefined) => void;
      singleDate?: never;
      onSingleDateChange?: never;
      className?: string;
      placeholder?: string;
    };

export function MobileDatePicker({
  dateRange,
  onDateRangeChange,
  className,
  placeholder = "Select dates",
  mode = "range",
  singleDate,
  onSingleDateChange,
}: MobileDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Quick date shortcuts for mobile
  const getQuickDateRanges = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return [
      {
        label: "This Weekend",
        from: new Date(today.setDate(today.getDate() + (6 - today.getDay()))),
        to: new Date(today.setDate(today.getDate() + 1)),
      },
      {
        label: "Next Week",
        from: tomorrow,
        to: nextWeek,
      },
      {
        label: "2 Weeks",
        from: tomorrow,
        to: twoWeeks,
      },
      {
        label: "1 Month",
        from: tomorrow,
        to: nextMonth,
      },
    ];
  };

  const handleQuickSelect = (range: { from: Date; to: Date }) => {
    if (mode === "range") {
      onDateRangeChange({ from: range.from, to: range.to });
    }
    setOpen(false);
  };

  const handleConfirm = () => {
    setOpen(false);
  };

  const displayText = () => {
    if (mode === "single" && singleDate) {
      return format(singleDate, "MMM dd, yyyy");
    }
    if (mode === "range" && dateRange?.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`;
      }
      return format(dateRange.from, "MMM dd, yyyy");
    }
    return placeholder;
  };

  const triggerButton = (
    <Button
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal min-h-[3.5rem] px-4 text-base rounded-xl border-border touch-manipulation",
        !(dateRange?.from || singleDate) && "text-muted-foreground",
        className
      )}
    >
      <CalendarIcon className="mr-3 h-5 w-5 shrink-0" />
      <span className="truncate">{displayText()}</span>
    </Button>
  );

  // Mobile: Use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left border-b pb-4">
            <DrawerTitle className="text-xl">Select {mode === "range" ? "Date Range" : "Date"}</DrawerTitle>
            <DrawerDescription>
              {mode === "range" ? "Choose your check-in and check-out dates" : "Choose your travel date"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto px-4 py-6 space-y-6">
            {mode === "range" && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Quick Select</p>
                <div className="grid grid-cols-2 gap-3">
                  {getQuickDateRanges().map((range) => (
                    <Button
                      key={range.label}
                      variant="outline"
                      className="h-auto py-3 touch-manipulation"
                      onClick={() => handleQuickSelect(range)}
                    >
                      <span className="text-sm font-medium">{range.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              {mode === "range" ? (
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={onDateRangeChange}
                  numberOfMonths={1}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="pointer-events-auto touch-manipulation scale-110 origin-top"
                  classNames={{
                    day: "h-11 w-11 text-base",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                    day_today: "bg-accent/50 text-accent-foreground",
                  }}
                />
              ) : (
                <Calendar
                  mode="single"
                  selected={singleDate}
                  onSelect={onSingleDateChange}
                  numberOfMonths={1}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="pointer-events-auto touch-manipulation scale-110 origin-top"
                  classNames={{
                    day: "h-11 w-11 text-base",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                    day_today: "bg-accent/50 text-accent-foreground",
                  }}
                />
              )}
            </div>
          </div>

          <DrawerFooter className="border-t pt-4">
            <Button 
              onClick={handleConfirm} 
              className="w-full h-12 text-base touch-manipulation"
              disabled={mode === "range" ? !dateRange?.from || !dateRange?.to : !singleDate}
            >
              Confirm Dates
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full h-12 text-base touch-manipulation">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        {mode === "range" ? (
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(range) => {
              onDateRangeChange(range);
              if (range?.from && range?.to) {
                setOpen(false);
              }
            }}
            numberOfMonths={2}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className="pointer-events-auto"
          />
        ) : (
          <Calendar
            mode="single"
            selected={singleDate}
            onSelect={(date) => {
              onSingleDateChange?.(date);
              setOpen(false);
            }}
            numberOfMonths={2}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className="pointer-events-auto"
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
