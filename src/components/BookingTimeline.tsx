// src/components/BookingTimeline.tsx
import { CheckCircle, Clock, AlertCircle, Circle } from "lucide-react";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  status: "completed" | "current" | "upcoming" | "failed";
}

interface BookingTimelineProps {
  events: TimelineEvent[];
}

export function BookingTimeline({ events }: BookingTimelineProps) {
  const getStatusIcon = (status: TimelineEvent["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case "current":
        return <Clock className="w-4 h-4 text-accent" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "upcoming":
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: TimelineEvent["status"]) => {
    switch (status) {
      case "completed":
        return "border-primary bg-primary/10";
      case "current":
        return "border-accent bg-accent/10";
      case "failed":
        return "border-destructive bg-destructive/10";
      case "upcoming":
        return "border-muted-foreground/30 bg-muted";
    }
  };

  return (
    <div className="rounded-3xl bg-card border border-border p-4 space-y-4">
      <h3 className="text-sm font-semibold text-card-foreground">Booking Timeline</h3>
      <div className="space-y-4">
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          return (
            <div key={event.id} className="flex gap-3">
              {/* Icon & Line */}
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full border-2 p-1 ${getStatusColor(
                    event.status
                  )}`}
                >
                  {getStatusIcon(event.status)}
                </div>
                {!isLast && (
                  <div className="w-0.5 h-full min-h-[32px] bg-border mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-medium text-card-foreground">
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
