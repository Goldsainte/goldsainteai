/**
 * Apple Calendar (.ics) export utility
 * Generates iCalendar format files for calendar sync
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  url?: string;
  organizer?: {
    name: string;
    email: string;
  };
}

/**
 * Format date for ICS file (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date, allDay: boolean = false): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  if (allDay) {
    return `${year}${month}${day}`;
  }

  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate ICS file content
 */
export function generateICS(events: CalendarEvent[], calendarName: string = "Travel Itinerary"): string {
  const lines: string[] = [];

  // Calendar header
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Goldsainte//Travel Itinerary//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(`X-WR-CALNAME:${escapeICS(calendarName)}`);
  lines.push("X-WR-TIMEZONE:UTC");

  // Add events
  for (const event of events) {
    lines.push("BEGIN:VEVENT");
    
    // Unique identifier
    const uid = `${Date.now()}-${Math.random().toString(36).substring(7)}@goldsainte.com`;
    lines.push(`UID:${uid}`);

    // Timestamps
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART${event.allDay ? ";VALUE=DATE" : ""}:${formatICSDate(event.startDate, event.allDay)}`);
    lines.push(`DTEND${event.allDay ? ";VALUE=DATE" : ""}:${formatICSDate(event.endDate, event.allDay)}`);

    // Event details
    lines.push(`SUMMARY:${escapeICS(event.title)}`);
    
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeICS(event.location)}`);
    }

    if (event.url) {
      lines.push(`URL:${event.url}`);
    }

    if (event.organizer) {
      lines.push(`ORGANIZER;CN=${escapeICS(event.organizer.name)}:mailto:${event.organizer.email}`);
    }

    lines.push("STATUS:CONFIRMED");
    lines.push("SEQUENCE:0");
    lines.push("END:VEVENT");
  }

  // Calendar footer
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Download ICS file
 */
export function downloadICS(content: string, filename: string = "itinerary.ics"): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Convert itinerary data to calendar events
 */
export function itineraryToEvents(itinerary: {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  activities?: Array<{
    title: string;
    description?: string;
    date: string;
    time?: string;
    location?: string;
  }>;
}): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Main trip event
  events.push({
    title: itinerary.title,
    description: `Trip to ${itinerary.destination}`,
    location: itinerary.destination,
    startDate: new Date(itinerary.startDate),
    endDate: new Date(itinerary.endDate),
    allDay: true,
  });

  // Individual activities
  if (itinerary.activities) {
    for (const activity of itinerary.activities) {
      const startDate = activity.time
        ? new Date(`${activity.date}T${activity.time}`)
        : new Date(activity.date);

      const endDate = new Date(startDate);
      if (activity.time) {
        endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration
      } else {
        endDate.setDate(endDate.getDate() + 1);
      }

      events.push({
        title: activity.title,
        description: activity.description,
        location: activity.location,
        startDate,
        endDate,
        allDay: !activity.time,
      });
    }
  }

  return events;
}

/**
 * Export itinerary as ICS file
 */
export function exportItineraryAsICS(
  itinerary: Parameters<typeof itineraryToEvents>[0],
  filename?: string
): void {
  const events = itineraryToEvents(itinerary);
  const icsContent = generateICS(events, itinerary.title);
  downloadICS(icsContent, filename || `${itinerary.title.replace(/\s+/g, "-").toLowerCase()}.ics`);
}
