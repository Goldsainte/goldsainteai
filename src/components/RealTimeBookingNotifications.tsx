import { useState, useEffect } from "react";
import { CheckCircle, User, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface BookingNotification {
  id: string;
  customerName: string;
  destination: string;
  agentName: string;
  timestamp: Date;
}

export const RealTimeBookingNotifications = () => {
  const [currentNotification, setCurrentNotification] = useState<BookingNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Simulated real-time bookings (in production, this would come from Supabase realtime)
  const sampleBookings: BookingNotification[] = [
    { id: "1", customerName: "Sarah M.", destination: "Paris", agentName: "Agent Emma", timestamp: new Date() },
    { id: "2", customerName: "John D.", destination: "Tokyo", agentName: "Agent Michael", timestamp: new Date() },
    { id: "3", customerName: "Lisa K.", destination: "Santorini", agentName: "Agent Sofia", timestamp: new Date() },
    { id: "4", customerName: "David R.", destination: "Dubai", agentName: "Agent Aisha", timestamp: new Date() },
    { id: "5", customerName: "Emma L.", destination: "Bali", agentName: "Agent Carlos", timestamp: new Date() },
  ];

  useEffect(() => {
    const showNotification = () => {
      const randomBooking = sampleBookings[Math.floor(Math.random() * sampleBookings.length)];
      setCurrentNotification(randomBooking);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Show first notification after 3 seconds
    const initialTimeout = setTimeout(showNotification, 3000);

    // Show new notification every 12 seconds
    const interval = setInterval(showNotification, 12000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {isVisible && currentNotification && (
        <div
          className={cn(
            "fixed bottom-6 left-6 z-50 max-w-sm transition-all duration-300",
            isVisible ? "animate-in slide-in-from-bottom-4 fade-in" : "animate-out slide-out-to-bottom-4 fade-out"
          )}
        >
          <div className="bg-card border shadow-lg rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <CheckCircle className="h-4 w-4 text-green-600 absolute -bottom-1 -right-1 bg-background rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">
                  {currentNotification.customerName} just booked{" "}
                  <span className="text-primary font-semibold">
                    {currentNotification.destination}
                  </span>
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>with {currentNotification.agentName}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.floor(Math.random() * 5) + 1} minutes ago
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
