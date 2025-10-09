import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, MapPin } from "lucide-react";

interface Notification {
  id: string;
  userName: string;
  location: string;
  agentName: string;
  timestamp: Date;
}

// Simulated real-time booking data
const sampleNotifications: Omit<Notification, "id" | "timestamp">[] = [
  { userName: "Sarah M.", location: "Paris", agentName: "Emma L." },
  { userName: "James K.", location: "Tokyo", agentName: "Michael R." },
  { userName: "Olivia P.", location: "Dubai", agentName: "Sophia T." },
  { userName: "David L.", location: "Maldives", agentName: "Isabella C." },
  { userName: "Emma W.", location: "Santorini", agentName: "Lucas M." },
  { userName: "Ryan B.", location: "Bali", agentName: "Charlotte S." },
  { userName: "Sophie H.", location: "Amalfi Coast", agentName: "Oliver K." },
  { userName: "Marcus T.", location: "Swiss Alps", agentName: "Amelia R." },
];

export const SocialProofNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Show initial notification after 3 seconds
    const initialTimeout = setTimeout(() => {
      showRandomNotification();
    }, 3000);

    // Show new notification every 15-25 seconds
    const interval = setInterval(() => {
      showRandomNotification();
    }, Math.random() * 10000 + 15000); // Random between 15-25 seconds

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const showRandomNotification = () => {
    const randomNotif = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)];
    const newNotification: Notification = {
      ...randomNotif,
      id: Math.random().toString(),
      timestamp: new Date(),
    };

    setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]);
    setVisible(true);

    // Hide after 8 seconds
    setTimeout(() => {
      setVisible(false);
    }, 8000);
  };

  const latestNotification = notifications[0];

  if (!latestNotification) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-8 left-8 z-50 max-w-sm"
        >
          <div className="bg-card border border-border rounded-xl shadow-xl p-4 backdrop-blur-lg bg-opacity-95">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="bg-green-500/10 rounded-full p-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-1">
                  <span className="font-semibold">{latestNotification.userName}</span> just booked a trip!
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{latestNotification.location}</span>
                  </div>
                  <span>•</span>
                  <span>with {latestNotification.agentName}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getTimeAgo(latestNotification.timestamp)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
}
