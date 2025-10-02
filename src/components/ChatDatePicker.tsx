import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface ChatDatePickerProps {
  type: "hotel" | "flight";
  onDatesSelected: (dates: { checkIn?: string; checkOut?: string; departureDate?: string; returnDate?: string }) => void;
  onCancel: () => void;
}

export const ChatDatePicker = ({ type, onDatesSelected, onCancel }: ChatDatePickerProps) => {
  const [tripType, setTripType] = useState<"round-trip" | "one-way" | null>(type === "hotel" ? "round-trip" : null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [singleDate, setSingleDate] = useState<Date>();

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleSingleDateSelect = (date: Date | undefined) => {
    setSingleDate(date);
  };

  const handleConfirm = () => {
    if (type === "hotel" && dateRange?.from && dateRange?.to) {
      onDatesSelected({
        checkIn: format(dateRange.from, "yyyy-MM-dd"),
        checkOut: format(dateRange.to, "yyyy-MM-dd"),
      });
    } else if (type === "flight") {
      if (tripType === "round-trip" && dateRange?.from && dateRange?.to) {
        onDatesSelected({
          departureDate: format(dateRange.from, "yyyy-MM-dd"),
          returnDate: format(dateRange.to, "yyyy-MM-dd"),
        });
      } else if (tripType === "one-way" && singleDate) {
        onDatesSelected({
          departureDate: format(singleDate, "yyyy-MM-dd"),
        });
      }
    }
  };

  const canConfirm = () => {
    if (type === "hotel") {
      return dateRange?.from && dateRange?.to;
    }
    if (type === "flight") {
      if (!tripType) return false;
      if (tripType === "round-trip") return dateRange?.from && dateRange?.to;
      if (tripType === "one-way") return !!singleDate;
    }
    return false;
  };

  const getTitle = () => {
    if (type === "hotel") {
      return "Select Check-in & Check-out Dates";
    }
    if (!tripType) {
      return "Select Trip Type";
    }
    return tripType === "round-trip" ? "Select Departure & Return Dates" : "Select Departure Date";
  };

  const getSelectedDates = () => {
    if (type === "hotel" && dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`;
    }
    if (type === "flight") {
      if (tripType === "round-trip" && dateRange?.from && dateRange?.to) {
        return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`;
      }
      if (tripType === "one-way" && singleDate) {
        return `Departure: ${format(singleDate, "MMM dd, yyyy")}`;
      }
    }
    return null;
  };

  return (
    <Card className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {getTitle()}
          </h3>
          {getSelectedDates() && (
            <p className="text-sm text-muted-foreground mt-1">{getSelectedDates()}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {type === "flight" && !tripType ? (
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setTripType("round-trip")}
            className="flex-1"
          >
            Round Trip
          </Button>
          <Button
            variant="outline"
            onClick={() => setTripType("one-way")}
            className="flex-1"
          >
            One Way
          </Button>
        </div>
      ) : (
        <>
          {tripType === "one-way" ? (
            <Calendar
              mode="single"
              selected={singleDate}
              onSelect={handleSingleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border pointer-events-auto"
            />
          ) : (
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border pointer-events-auto"
            />
          )}

          <div className="flex gap-2 pt-4">
            {type === "flight" && tripType && (
              <Button
                variant="outline"
                onClick={() => {
                  setTripType(null);
                  setDateRange(undefined);
                  setSingleDate(undefined);
                }}
                className="flex-1"
              >
                Change Trip Type
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm()}
              className="flex-1"
            >
              Confirm Date{((type === "hotel" || tripType === "round-trip") && dateRange?.from && dateRange?.to) ? "s" : ""}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};
