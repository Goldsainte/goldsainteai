/**
 * Default quick reply templates for travel agents
 * These can be imported by agents to get started quickly
 */

export interface DefaultQuickReply {
  title: string;
  content: string;
  category: string;
  shortcut?: string;
}

export const DEFAULT_QUICK_REPLIES: DefaultQuickReply[] = [
  // Hotel Templates
  {
    title: "Hotel Confirmation",
    content: "Hotel confirmed! Your stay at [Hotel Name] from [Dates] is booked. A confirmation email has been sent.",
    category: "Hotels",
    shortcut: "/hotel-confirmed"
  },
  {
    title: "Hotel Deal Offer",
    content: "I've found a great deal at [Hotel Name], including [Perks]. Want me to lock it in?",
    category: "Hotels",
    shortcut: "/hotel-deal"
  },
  {
    title: "Hotel Location Preference",
    content: "Would you prefer a hotel closer to the city center or something quieter with a view?",
    category: "Hotels"
  },
  {
    title: "Hotel Comparison Offer",
    content: "Need help choosing between [Hotel A] and [Hotel B]? I can compare them for you.",
    category: "Hotels"
  },
  {
    title: "Hotel Preferences Check",
    content: "Just checking—do you have any hotel preferences (budget, star rating, amenities)?",
    category: "Hotels"
  },

  // Flight Templates
  {
    title: "Flight Confirmation",
    content: "Your flight on [Airline] from [Departure] to [Destination] is booked. E-ticket details are on the way.",
    category: "Flights",
    shortcut: "/flight-confirmed"
  },
  {
    title: "Flight Deal Found",
    content: "I found a great fare with only 1 stop and short layover. Want to book it now?",
    category: "Flights",
    shortcut: "/flight-deal"
  },
  {
    title: "Flight Class Preference",
    content: "Are you okay with basic economy, or should I search for standard/main cabin options?",
    category: "Flights"
  },
  {
    title: "Seat Preference Check",
    content: "Any seat preferences—window, aisle, or extra legroom?",
    category: "Flights"
  },
  {
    title: "Flight Search Update",
    content: "Let me check if there are any flight deals for your dates. Will update you shortly!",
    category: "Flights"
  },

  // Car Rental Templates
  {
    title: "Car Rental Confirmation",
    content: "Car rental is confirmed! You'll be driving a [Car Type] from [Pickup Location] on [Date].",
    category: "Car Rentals",
    shortcut: "/car-confirmed"
  },
  {
    title: "Car Add-ons Check",
    content: "Do you need a car with GPS, child seat, or any other add-ons?",
    category: "Car Rentals"
  },
  {
    title: "Transmission Preference",
    content: "Would you prefer an automatic or manual transmission?",
    category: "Car Rentals"
  },
  {
    title: "Compact Car Deal",
    content: "There's a great deal on compact cars right now. Want me to reserve one?",
    category: "Car Rentals"
  },
  {
    title: "Pickup Location Check",
    content: "Need pickup/drop-off at the airport or a city location?",
    category: "Car Rentals"
  },

  // Event Templates
  {
    title: "Event Confirmation",
    content: "Your tickets for [Event Name] on [Date] are confirmed. I've emailed you the details.",
    category: "Events",
    shortcut: "/event-confirmed"
  },
  {
    title: "Event Seating Preference",
    content: "Would you like VIP seating or general admission for this event?",
    category: "Events"
  },
  {
    title: "Event Access Offer",
    content: "I can get you access to [Event Name]—interested?",
    category: "Events"
  },
  {
    title: "Event Bundle Offer",
    content: "Want to bundle the event with a hotel or dinner reservation nearby?",
    category: "Events"
  },
  {
    title: "Alternative Event Suggestion",
    content: "There's a similar event happening the same week. Want to see your options?",
    category: "Events"
  },

  // Restaurant Templates
  {
    title: "Restaurant Confirmation",
    content: "Your table at [Restaurant Name] is booked for [Date & Time]. Enjoy!",
    category: "Restaurants",
    shortcut: "/restaurant-confirmed"
  },
  {
    title: "Cuisine & Dietary Preference",
    content: "Do you have a cuisine preference or dietary needs I should keep in mind?",
    category: "Restaurants"
  },
  {
    title: "Local Restaurant Suggestion",
    content: "There's a top-rated local spot near your hotel—want me to reserve a table?",
    category: "Restaurants"
  },
  {
    title: "Urgent Restaurant Booking",
    content: "I found availability at [Restaurant Name], but it fills up fast. Should I book it now?",
    category: "Restaurants"
  },
  {
    title: "Meal Time Preference",
    content: "Would you like a lunch or dinner reservation—or both?",
    category: "Restaurants"
  }
];

/**
 * Import default templates for an agent
 */
export async function importDefaultTemplates(
  agentId: string,
  supabase: any
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const templates = DEFAULT_QUICK_REPLIES.map(template => ({
      agent_id: agentId,
      ...template
    }));

    const { data, error } = await supabase
      .from("quick_reply_templates")
      .insert(templates)
      .select();

    if (error) throw error;

    return {
      success: true,
      count: data?.length || 0
    };
  } catch (error) {
    console.error("Error importing default templates:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
