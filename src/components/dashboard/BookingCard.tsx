import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, MapPin, ChevronRight, Plane, Hotel } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface BookingCardProps {
  booking: {
    id: string;
    booking_reference: string;
    booking_type: string;
    status: string;
    total_price: number;
    currency: string;
    booking_data: any;
  };
}

export function BookingCard({ booking }: BookingCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-5 w-5" />;
      case 'hotel':
        return <Hotel className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              {getBookingIcon(booking.booking_type)}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base md:text-lg line-clamp-2">
                {booking.booking_type === 'flight' 
                  ? `${booking.booking_data?.origin} → ${booking.booking_data?.destination}`
                  : booking.booking_data?.hotelName || 'Hotel Booking'
                }
              </CardTitle>
              <CardDescription className="text-xs md:text-sm truncate">
                Ref: {booking.booking_reference}
              </CardDescription>
            </div>
          </div>
          <Badge className={`${getStatusColor(booking.status)} shrink-0`}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              {formatDate(booking.booking_data?.departureDate || booking.booking_data?.checkIn)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              {booking.booking_data?.departureTime || booking.booking_data?.checkInTime || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
            <span className="font-semibold truncate">
              {booking.currency} {Number(booking.total_price).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{booking.booking_data?.destination}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1 text-sm h-9 md:h-10"
            onClick={() => navigate(`/booking-details/${booking.id}`)}
          >
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">Details</span>
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          {booking.status !== 'cancelled' && booking.booking_type === 'flight' && (
            <Button 
              variant="default" 
              className="flex-1 sm:flex-initial text-sm h-9 md:h-10"
              onClick={() => navigate(`/modify-flight/${booking.id}`)}
            >
              <span className="hidden sm:inline">Modify Flight</span>
              <span className="sm:hidden">Modify</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
