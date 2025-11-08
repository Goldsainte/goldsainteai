import { CompactHotelCard } from "@/components/CompactHotelCard";

interface HotelGridProps {
  hotels: any[];
  searchDates?: { checkIn: string; checkOut: string };
}

export const HotelGrid = ({ hotels, searchDates }: HotelGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {hotels.map((hotel, index) => (
        <CompactHotelCard
          key={hotel.hotel_id || hotel.id || index}
          property={hotel}
          searchDates={searchDates}
        />
      ))}
    </div>
  );
};
