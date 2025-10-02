import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plane } from "lucide-react";
import { toast } from "sonner";

interface SeatMapSelectorProps {
  flight: any;
  passengers: number;
  onSeatsSelected: (seats: any[]) => void;
  selectedSeats: any[];
}

export const SeatMapSelector = ({ flight, passengers, onSeatsSelected, selectedSeats }: SeatMapSelectorProps) => {
  const [loading, setLoading] = useState(false);
  const [seatMap, setSeatMap] = useState<any>(null);
  const [tempSelectedSeats, setTempSelectedSeats] = useState<any[]>(selectedSeats);

  useEffect(() => {
    fetchSeatMap();
  }, []);

  const fetchSeatMap = async () => {
    setLoading(true);
    try {
      console.log('Fetching seat map for flight:', flight.id);
      const { data, error } = await supabase.functions.invoke('amadeus-get-seatmap', {
        body: { flightOffer: flight }
      });

      console.log('Seat map response:', data);
      if (error) {
        console.error('Seat map API error:', error);
        throw error;
      }
      
      if (data?.message) {
        console.log('Seat map message:', data.message);
      }
      
      setSeatMap(data?.seatmap || []);
    } catch (error: any) {
      console.error('Seat map error:', error);
      toast.error("Unable to load seat map. You can skip this step.");
      setSeatMap([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: any, deckIndex: number, rowIndex: number, seatIndex: number) => {
    if (seat.travelerPricing?.[0]?.seatAvailabilityStatus !== 'AVAILABLE') return;

    const seatId = `${deckIndex}-${rowIndex}-${seatIndex}`;
    const existingIndex = tempSelectedSeats.findIndex(s => s.id === seatId);

    if (existingIndex >= 0) {
      // Deselect seat
      setTempSelectedSeats(tempSelectedSeats.filter(s => s.id !== seatId));
    } else if (tempSelectedSeats.length < passengers) {
      // Select seat
      setTempSelectedSeats([...tempSelectedSeats, {
        id: seatId,
        number: seat.number,
        price: seat.travelerPricing?.[0]?.price?.total || 0,
        currency: seat.travelerPricing?.[0]?.price?.currency || 'USD',
        characteristics: seat.characteristicsCodes
      }]);
    } else {
      toast.error(`You can only select ${passengers} seat(s)`);
    }
  };

  const handleConfirm = () => {
    if (tempSelectedSeats.length === passengers) {
      onSeatsSelected(tempSelectedSeats);
    } else {
      toast.error(`Please select ${passengers} seat(s)`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading seat map...</p>
      </div>
    );
  }

  if (!seatMap || seatMap.length === 0) {
    return (
      <div className="text-center py-8">
        <Plane className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">Seat selection is not available for this flight</p>
        <Button onClick={() => onSeatsSelected([])}>Continue without selecting seats</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Select Your Seats</h3>
        <p className="text-sm text-muted-foreground">
          Selected: {tempSelectedSeats.length} / {passengers} seat(s)
        </p>
        {tempSelectedSeats.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tempSelectedSeats.map((seat, idx) => (
              <div key={seat.id} className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                Passenger {idx + 1}: Seat {seat.number} 
                {seat.price > 0 && ` (+${seat.currency} ${seat.price})`}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {seatMap[0]?.decks?.map((deck: any, deckIndex: number) => (
          <div key={deckIndex} className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Deck {deckIndex + 1}</h4>
            
            <div className="space-y-2">
              {deck.seats?.deckConfiguration?.rows?.map((row: any, rowIndex: number) => (
                <div key={rowIndex} className="flex items-center gap-2">
                  <span className="text-sm w-8 text-muted-foreground">{row.rowNumber}</span>
                  <div className="flex gap-2 flex-1 justify-center">
                    {row.seats?.map((seat: any, seatIndex: number) => {
                      const seatId = `${deckIndex}-${rowIndex}-${seatIndex}`;
                      const isSelected = tempSelectedSeats.some(s => s.id === seatId);
                      const isAvailable = seat.travelerPricing?.[0]?.seatAvailabilityStatus === 'AVAILABLE';
                      
                      return (
                        <button
                          key={seatIndex}
                          onClick={() => handleSeatClick(seat, deckIndex, rowIndex, seatIndex)}
                          disabled={!isAvailable}
                          className={`
                            w-10 h-10 rounded text-xs font-medium transition-colors
                            ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                            ${isAvailable && !isSelected ? 'bg-muted hover:bg-muted/80 border' : ''}
                            ${!isAvailable ? 'bg-destructive/20 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          {seat.number || '—'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted border rounded" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary rounded" />
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-destructive/20 rounded" />
                <span>Occupied</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => onSeatsSelected([])} className="flex-1">
          Skip Seat Selection
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={tempSelectedSeats.length !== passengers}
          className="flex-1"
        >
          Confirm Seats ({tempSelectedSeats.length}/{passengers})
        </Button>
      </div>
    </div>
  );
};