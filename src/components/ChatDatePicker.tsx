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
  const [mode, setMode] = useState<"checkIn" | "checkOut" | "departure">(
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
      setDepartureDate(date);
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
      });
    }
  };

  const canConfirm = type === "hotel" 
    ? checkIn && checkOut 
    : departureDate;

  const getTitle = () => {
    if (type === "hotel") {
      return mode === "checkIn" ? "Select Check-in Date" : "Select Check-out Date";
    }
    return "Select Departure Date";
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
      if (departureDate) {
        return `Departure: ${format(departureDate, "MMM dd, yyyy")}`;
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

      <Calendar
        mode="single"
        selected={mode === "checkIn" ? checkIn : mode === "checkOut" ? checkOut : departureDate}
        onSelect={handleDateSelect}
        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        className="rounded-md border pointer-events-auto"
      />

      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="flex-1"
        >
          Confirm Date{type === "hotel" && checkIn && checkOut ? "s" : ""}
        </Button>
      </div>
    </Card>
  );
};
