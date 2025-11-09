import { MobileDatePicker } from "./MobileDatePicker";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  return (
    <MobileDatePicker
      mode="range"
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
      placeholder="Check-in - Check-out"
      className={className}
    />
  );
}
