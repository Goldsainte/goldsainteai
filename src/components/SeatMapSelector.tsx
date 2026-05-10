import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plane, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
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
  
  // Touch gesture state
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSeatMap();
  }, []);

  const fetchSeatMap = async () => {
    setLoading(true);
    try {
      toast.info("Seat selection is currently unavailable");
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

  // Touch gesture handlers
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      setLastTouchDistance(distance);
      setLastTouchCenter(center);
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan gesture (only when zoomed)
      setIsPanning(true);
      setLastTouchCenter({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance && lastTouchCenter) {
      // Pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      
      const scaleChange = distance / lastTouchDistance;
      const newScale = Math.min(Math.max(scale * scaleChange, 1), 4);
      
      setScale(newScale);
      setLastTouchDistance(distance);
      setLastTouchCenter(center);
    } else if (e.touches.length === 1 && isPanning && lastTouchCenter && scale > 1) {
      // Pan
      e.preventDefault();
      const dx = e.touches[0].clientX - lastTouchCenter.x;
      const dy = e.touches[0].clientY - lastTouchCenter.y;
      
      setTranslateX(translateX + dx);
      setTranslateY(translateY + dy);
      setLastTouchCenter({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setLastTouchDistance(null);
    setLastTouchCenter(null);
  };

  const handleZoomIn = () => {
    setScale(Math.min(scale * 1.3, 4));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.3, 1);
    setScale(newScale);
    if (newScale === 1) {
      setTranslateX(0);
      setTranslateY(0);
    }
  };

  const handleResetZoom = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
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
          
          {/* Zoom controls - only show on mobile */}
          <div className="flex md:hidden flex-col gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="h-8 w-8"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="h-8 w-8"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            {scale > 1 && (
              <Button
                size="icon"
                variant="outline"
                onClick={handleResetZoom}
                className="h-8 w-8 animate-fade-in"
                title="Reset zoom"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Touch gesture hint */}
        {scale === 1 && (
          <p className="text-xs text-muted-foreground mt-2 md:hidden animate-fade-in">
            💡 Pinch to zoom, drag to pan when zoomed
          </p>
        )}
        {scale > 1 && (
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground md:hidden animate-fade-in">
            <span>Zoom: {Math.round(scale * 100)}%</span>
            <span className="text-primary">Drag to pan</span>
          </div>
        )}
      </div>

      {/* Touch-enabled seat map container */}
      <div 
        ref={containerRef}
        className="relative border rounded-lg overflow-hidden touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          touchAction: scale > 1 ? 'none' : 'pan-y',
          cursor: isPanning ? 'grabbing' : scale > 1 ? 'grab' : 'default'
        }}
      >
        <div 
          ref={contentRef}
          className="p-4 transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="space-y-4">
            {seatMap[0]?.decks?.map((deck: any, deckIndex: number) => (
              <div key={deckIndex} className="bg-background/95 rounded-lg p-4 border">
                <h4 className="font-semibold mb-4">Deck {deckIndex + 1}</h4>
                
                <div className="inline-flex flex-col min-w-max space-y-2">
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
        </div>
      </div>
  );
};
