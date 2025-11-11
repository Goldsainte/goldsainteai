import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarIcon, X, Check } from 'lucide-react';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface FlightDatePickerCardProps {
  prefill?: { depart?: string; return?: string };
  minDate?: string;
  maxDate?: string;
  mode?: 'roundTrip' | 'oneWay';
  timezone?: string;
  onConfirm: (dates: { depart: string; return?: string }, mode: 'roundTrip' | 'oneWay') => void;
}

export const FlightDatePickerCard = ({
  prefill,
  minDate,
  maxDate,
  mode: initialMode = 'roundTrip',
  onConfirm,
}: FlightDatePickerCardProps) => {
  const [mode, setMode] = useState<'roundTrip' | 'oneWay'>(initialMode);
  const [departDate, setDepartDate] = useState<Date | undefined>(
    prefill?.depart ? new Date(prefill.depart) : undefined
  );
  const [returnDate, setReturnDate] = useState<Date | undefined>(
    prefill?.return ? new Date(prefill.return) : undefined
  );
  const [activeInput, setActiveInput] = useState<'depart' | 'return'>('depart');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const today = startOfToday();
  const min = minDate ? new Date(minDate) : today;
  const max = maxDate ? new Date(maxDate) : addDays(today, 330);

  useEffect(() => {
    console.log('🎯 [TELEMETRY] flight_datepicker_shown');
    if (prefill?.depart || prefill?.return) {
      console.log('🎯 [TELEMETRY] flight_datepicker_prefill_applied');
    }
  }, [prefill]);

  const handleDepartSelect = (date: Date | undefined) => {
    setDepartDate(date);
    if (date && mode === 'roundTrip') {
      // Auto-switch to return input after selecting depart
      setActiveInput('return');
      // If return date is before depart, clear it
      if (returnDate && isBefore(returnDate, date)) {
        setReturnDate(undefined);
      }
    }
  };

  const handleReturnSelect = (date: Date | undefined) => {
    setReturnDate(date);
  };

  const handleModeToggle = () => {
    const newMode = mode === 'roundTrip' ? 'oneWay' : 'roundTrip';
    setMode(newMode);
    if (newMode === 'oneWay') {
      setReturnDate(undefined);
    }
    console.log('🎯 [TELEMETRY] flight_datepicker_mode_toggled', { mode: newMode });
  };

  const handleClear = () => {
    setDepartDate(undefined);
    setReturnDate(undefined);
    setActiveInput('depart');
  };

  const handleConfirm = () => {
    if (!departDate) return;

    const dates = {
      depart: format(departDate, 'yyyy-MM-dd'),
      ...(mode === 'roundTrip' && returnDate ? { return: format(returnDate, 'yyyy-MM-dd') } : {}),
    };

    console.log('🎯 [TELEMETRY] flight_datepicker_confirmed', { dates, mode });
    onConfirm(dates, mode);
    setIsCollapsed(true);
  };

  const canConfirm = departDate && (mode === 'oneWay' || returnDate);

  if (isCollapsed) {
    return (
      <div className="w-full max-w-[640px] mx-auto my-2">
        <div className="bg-muted rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium">
                {departDate && format(departDate, 'MMM dd, yyyy')}
              </span>
              {mode === 'roundTrip' && returnDate && (
                <>
                  <span className="text-muted-foreground mx-2">→</span>
                  <span className="font-medium">
                    {format(returnDate, 'MMM dd, yyyy')}
                  </span>
                </>
              )}
              {mode === 'oneWay' && (
                <span className="text-muted-foreground ml-2">(one-way)</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="text-xs"
          >
            Change dates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[640px] mx-auto my-2">
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Select your travel dates</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleModeToggle}
            className="text-xs"
          >
            {mode === 'roundTrip' ? 'Switch to One-way' : 'Switch to Round-trip'}
          </Button>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <Label htmlFor="depart-input" className="text-xs text-muted-foreground mb-1">
              Departure
            </Label>
            <Button
              id="depart-input"
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !departDate && 'text-muted-foreground',
                activeInput === 'depart' && 'ring-2 ring-primary'
              )}
              onClick={() => setActiveInput('depart')}
              aria-label="Select departure date"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {departDate ? format(departDate, 'MMM dd, yyyy') : 'Select date'}
            </Button>
          </div>

          {mode === 'roundTrip' && (
            <div>
              <Label htmlFor="return-input" className="text-xs text-muted-foreground mb-1">
                Return
              </Label>
              <Button
                id="return-input"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !returnDate && 'text-muted-foreground',
                  activeInput === 'return' && 'ring-2 ring-primary'
                )}
                onClick={() => setActiveInput('return')}
                aria-label="Select return date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {returnDate ? format(returnDate, 'MMM dd, yyyy') : 'Select date'}
              </Button>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="border border-border rounded-lg overflow-hidden mb-4">
          {activeInput === 'depart' && (
            <Calendar
              mode="single"
              selected={departDate}
              onSelect={handleDepartSelect}
              disabled={(date) => date < min || date > max}
              numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 640 ? 2 : 1}
              className={cn('p-3 pointer-events-auto')}
              initialFocus
            />
          )}
          {activeInput === 'return' && mode === 'roundTrip' && (
            <Calendar
              mode="single"
              selected={returnDate}
              onSelect={handleReturnSelect}
              disabled={(date) => {
                if (date < min || date > max) return true;
                if (departDate && isBefore(date, departDate)) return true;
                return false;
              }}
              numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 640 ? 2 : 1}
              className={cn('p-3 pointer-events-auto')}
              initialFocus
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!departDate && !returnDate}
            aria-label="Clear dates"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!canConfirm}
            aria-label="Confirm dates"
          >
            <Check className="h-4 w-4 mr-1" />
            Confirm dates
          </Button>
        </div>
      </div>
    </div>
  );
};
