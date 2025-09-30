import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

interface ChatDatePickerProps {
  type: "hotel" | "flight";
  onDatesSelected: (dates: { checkIn?: string; checkOut?: string; departureDate?: string; returnDate?: string }) => void;
  onCancel: () => void;
}

export const ChatDatePicker = ({ type, onDatesSelected, onCancel }: ChatDatePickerProps) => {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [tripType, setTripType] = useState<"one-way" | "return" | null>(null);
  const [mode, setMode] = useState<"checkIn" | "checkOut" | "departure" | "return">(
    type === "hotel" ? "checkIn" : "departure"
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (type === "hotel") {
      if (mode === "checkIn") {
        setCheckIn(date);
        setMode("checkOut");
      } else {
        setCheckOut(date);
      }
    } else {
      if (mode === "departure") {
        setDepartureDate(date);
        // For one-way trips, skip to confirmation
        if (tripType === "one-way") {
          return;
        }
        setMode("return");
      } else {
        setReturnDate(date);
      }
    }
  };

  const handleConfirm = () => {
    if (type === "hotel" && checkIn && checkOut) {
      onDatesSelected({
        checkIn: format(checkIn, "yyyy-MM-dd"),
        checkOut: format(checkOut, "yyyy-MM-dd"),
      });
    } else if (type === "flight" && departureDate) {
      onDatesSelected({
        departureDate: format(departureDate, "yyyy-MM-dd"),
        returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
      });
    }
  };

  const canConfirm = type === "hotel" 
    ? checkIn && checkOut 
    : tripType === "one-way" ? departureDate : departureDate && returnDate;

  const getTitle = () => {
    if (type === "hotel") {
      return mode === "checkIn" ? "Select Check-in Date" : "Select Check-out Date";
    }
    return mode === "departure" ? "Select Departure Date" : "Select Return Date (Optional)";
  };

  const getSelectedDates = () => {
    if (type === "hotel") {
      if (checkIn && checkOut) {
        return `${format(checkIn, "MMM dd")} - ${format(checkOut, "MMM dd")}`;
      }
      if (checkIn) {
        return `Check-in: ${format(checkIn, "MMM dd, yyyy")}`;
      }
    } else {
      if (departureDate && returnDate) {
        return `${format(departureDate, "MMM dd")} - ${format(returnDate, "MMM dd")}`;
      }
      if (departureDate) {
        return `Departure: ${format(departureDate, "MMM dd, yyyy")}`;
      }
    }
    return null;
  };

  // Show trip type selection for flights first
  if (type === "flight" && tripType === null) {
    return (
      <Card className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Select Trip Type
          </h3>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-start gap-1 hover:border-primary hover:bg-primary/5"
            onClick={() => setTripType("one-way")}
          >
            <span className="font-semibold">One-way</span>
            <span className="text-sm text-muted-foreground">Single flight to your destination</span>
          </Button>
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-start gap-1 hover:border-primary hover:bg-primary/5"
            onClick={() => setTripType("return")}
          >
            <span className="font-semibold">Return trip</span>
            <span className="text-sm text-muted-foreground">Round trip with return flight</span>
          </Button>
        </div>
      </Card>
    );
  }

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

      <Calendar
        mode="single"
        selected={mode === "checkIn" ? checkIn : mode === "checkOut" ? checkOut : mode === "departure" ? departureDate : returnDate}
        onSelect={handleDateSelect}
        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        className="rounded-md border pointer-events-auto"
      />

      <div className="flex gap-2 pt-4">
        {type === "flight" && mode === "return" && tripType === "one-way" && (
          <Button
            variant="outline"
            onClick={() => {
              setReturnDate(undefined);
              handleConfirm();
            }}
            className="flex-1"
          >
            Skip Return Date
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="flex-1"
        >
          Confirm Dates
        </Button>
      </div>
    </Card>
  );
};
