import { useState } from "react";
import { MobileDatePicker } from "./MobileDatePicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface ChatDatePickerProps {
  type: "hotel" | "flight";
  onDatesSelected: (dates: { checkIn?: string; checkOut?: string; departureDate?: string; returnDate?: string }) => void;
  onCancel: () => void;
  suggestedDate?: Date;
}

export const ChatDatePicker = ({ type, onDatesSelected, onCancel, suggestedDate }: ChatDatePickerProps) => {
  const [tripType, setTripType] = useState<"round-trip" | "one-way" | null>(type === "hotel" ? "round-trip" : null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [singleDate, setSingleDate] = useState<Date>();
  const [validationError, setValidationError] = useState<string>("");

  // Ensure calendar always shows current or future month
  const getDefaultMonth = () => {
    const today = new Date();
    if (suggestedDate && suggestedDate >= today) {
      return suggestedDate;
    }
    return today;
  };

  // Validate date ranges
  const validateDateRange = (range: DateRange | undefined): string => {
    if (!range?.from || !range?.to) return "";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if dates are in the past
    if (range.from < today) {
      return type === "hotel" ? "Check-in date cannot be in the past" : "Departure date cannot be in the past";
    }
    
    if (range.to < today) {
      return type === "hotel" ? "Check-out date cannot be in the past" : "Return date cannot be in the past";
    }
    
    // Check if end date is before start date
    if (range.to <= range.from) {
      if (type === "hotel") {
        return "Check-out date must be at least 1 day after check-in";
      } else {
        return "Return date must be after departure date";
      }
    }
    
    // Check minimum stay for hotels (at least 1 night)
    if (type === "hotel") {
      const diffTime = Math.abs(range.to.getTime() - range.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 1) {
        return "Minimum stay is 1 night";
      }
    }
    
    // Check maximum date range (e.g., 365 days)
    const diffTime = Math.abs(range.to.getTime() - range.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      return "Date range cannot exceed 365 days";
    }
    
    return "";
  };

  const validateSingleDate = (date: Date | undefined): string => {
    if (!date) return "";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return "Departure date cannot be in the past";
    }
    
    return "";
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    const error = validateDateRange(range);
    setValidationError(error);
  };

  const handleSingleDateSelect = (date: Date | undefined) => {
    setSingleDate(date);
    const error = validateSingleDate(date);
    setValidationError(error);
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
    // Don't allow confirm if there's a validation error
    if (validationError) return false;
    
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
    <Card className="p-6 pb-24 md:pb-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 bg-gradient-to-br from-background to-background/95 border-primary/20 shadow-2xl w-full max-w-[420px]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {getTitle()}
          </h3>
          {getSelectedDates() && (
            <p className="text-sm text-muted-foreground mt-1">{getSelectedDates()}</p>
          )}
          {validationError && (
            <p className="text-sm text-destructive mt-1 font-medium">{validationError}</p>
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
          <div className="py-2">
            {tripType === "one-way" ? (
              <MobileDatePicker
                mode="single"
                singleDate={singleDate}
                onSingleDateChange={handleSingleDateSelect}
                placeholder="Select departure date"
                className="border-primary/10 shadow-lg"
              />
            ) : (
              <MobileDatePicker
                mode="range"
                dateRange={dateRange}
                onDateRangeChange={handleDateSelect}
                placeholder={type === "hotel" ? "Check-in - Check-out" : "Departure - Return"}
                className="border-primary/10 shadow-lg"
              />
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {type === "flight" && tripType && (
              <Button
                variant="outline"
                onClick={() => {
                  setTripType(null);
                  setDateRange(undefined);
                  setSingleDate(undefined);
                  setValidationError("");
                }}
                className="flex-1"
              >
                Change Trip Type
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm()}
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Confirm Date{((type === "hotel" || tripType === "round-trip") && dateRange?.from && dateRange?.to) ? "s" : ""}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};
