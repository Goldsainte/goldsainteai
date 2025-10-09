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
  },

  // General/Welcome Templates
  {
    title: "Welcome Message",
    content: "Hi! I'm [Agent Name], your dedicated travel agent. I'm here to help make your trip perfect. What can I assist you with today?",
    category: "General",
    shortcut: "/welcome"
  },
  {
    title: "Thank You",
    content: "Thank you for choosing us! I'm excited to help plan your trip. Let me know if you have any questions.",
    category: "General",
    shortcut: "/thanks"
  },
  {
    title: "Working On It",
    content: "I'm working on this right now and will get back to you within [Time]. Thanks for your patience!",
    category: "General"
  },
  {
    title: "Follow-up Check",
    content: "Just checking in! Do you need any updates or have additional questions about your booking?",
    category: "General"
  },
  {
    title: "Out of Office",
    content: "I'm currently away but will respond to your message as soon as I'm back. For urgent matters, please contact our 24/7 support line.",
    category: "General"
  },

  // Payment & Billing Templates
  {
    title: "Payment Confirmation",
    content: "Payment received! Your booking is now fully confirmed. A receipt has been emailed to you.",
    category: "Payments",
    shortcut: "/payment-confirmed"
  },
  {
    title: "Invoice Sent",
    content: "I've sent your invoice to [Email]. Please review and let me know if you have any questions about the charges.",
    category: "Payments"
  },
  {
    title: "Payment Plan Available",
    content: "We offer flexible payment plans. Would you like to split this into [Number] installments?",
    category: "Payments"
  },
  {
    title: "Payment Reminder",
    content: "Friendly reminder: Your payment of [Amount] is due by [Date] to secure your booking.",
    category: "Payments"
  },
  {
    title: "Refund Processing",
    content: "Your refund of [Amount] is being processed and should appear in your account within 5-10 business days.",
    category: "Payments"
  },

  // Changes & Cancellations Templates
  {
    title: "Modification Request Received",
    content: "I've received your request to modify your booking. Let me check availability and fees. I'll update you shortly.",
    category: "Changes",
    shortcut: "/mod-received"
  },
  {
    title: "Cancellation Policy",
    content: "The cancellation policy for this booking allows free cancellation until [Date]. After that, a [Amount] fee applies.",
    category: "Changes"
  },
  {
    title: "Change Confirmed",
    content: "Your changes have been confirmed! Updated confirmation details are on the way to your email.",
    category: "Changes"
  },
  {
    title: "Cancellation Confirmed",
    content: "Your booking has been cancelled. A refund of [Amount] will be processed within [Timeframe].",
    category: "Changes",
    shortcut: "/cancel-confirmed"
  },
  {
    title: "Name Change",
    content: "I can help with that name change. There may be a fee of [Amount]. Should I proceed?",
    category: "Changes"
  },

  // Travel Documents Templates
  {
    title: "Passport Requirements",
    content: "For [Destination], you'll need a passport valid for at least 6 months beyond your travel dates. Need help checking requirements?",
    category: "Documents"
  },
  {
    title: "Visa Information",
    content: "You'll need a visa for [Destination]. I can assist with the application process. Shall I send you the details?",
    category: "Documents",
    shortcut: "/visa-info"
  },
  {
    title: "Document Checklist Sent",
    content: "I've emailed you a complete checklist of required travel documents for your trip. Let me know if you need help with any of them!",
    category: "Documents"
  },
  {
    title: "Travel Insurance Reminder",
    content: "Don't forget to get travel insurance! I can recommend great options that cover cancellations, medical emergencies, and more.",
    category: "Documents"
  },

  // Emergency & Support Templates
  {
    title: "Emergency Contact Info",
    content: "In case of emergency, contact our 24/7 hotline at [Phone Number] or email [Emergency Email]. We're always here to help!",
    category: "Support",
    shortcut: "/emergency"
  },
  {
    title: "Issue Resolution",
    content: "I'm so sorry you're experiencing this issue. I'm on it and will resolve this as quickly as possible. Updates coming soon.",
    category: "Support"
  },
  {
    title: "Travel Advisory",
    content: "There's a travel advisory for [Destination]. I'm monitoring the situation and will keep you updated. Your safety is our priority.",
    category: "Support"
  },
  {
    title: "Lost Luggage Assistance",
    content: "I'm here to help with your lost luggage. Please provide your baggage claim number and I'll coordinate with the airline.",
    category: "Support"
  },

  // Itinerary & Planning Templates
  {
    title: "Itinerary Sent",
    content: "Your complete trip itinerary has been sent to your email. All confirmation numbers and details are included. Safe travels!",
    category: "Planning",
    shortcut: "/itinerary-sent"
  },
  {
    title: "Activity Suggestions",
    content: "I've compiled some must-see attractions and activities for [Destination]. Would you like me to book any of these for you?",
    category: "Planning"
  },
  {
    title: "Weather Update",
    content: "The weather forecast for [Destination] during your stay shows [Weather]. I recommend packing [Items].",
    category: "Planning"
  },
  {
    title: "Local Tips",
    content: "Pro tip for [Destination]: [Helpful Local Advice]. Let me know if you want more insider recommendations!",
    category: "Planning"
  },
  {
    title: "Schedule Optimization",
    content: "I noticed you have some free time on [Date]. Want me to suggest some activities or arrange something special?",
    category: "Planning"
  },

  // Follow-up & Feedback Templates
  {
    title: "Pre-Trip Check-in",
    content: "Your trip is coming up soon! Do you have any last-minute questions or need anything else arranged?",
    category: "Follow-up",
    shortcut: "/pre-trip"
  },
  {
    title: "Post-Trip Follow-up",
    content: "Welcome back! I hope you had an amazing trip. I'd love to hear about your experience!",
    category: "Follow-up",
    shortcut: "/post-trip"
  },
  {
    title: "Feedback Request",
    content: "Your feedback helps us improve! Would you mind sharing your thoughts about the service and your trip?",
    category: "Follow-up"
  },
  {
    title: "Review Request",
    content: "If you enjoyed your trip and our service, we'd greatly appreciate a review. It really helps other travelers!",
    category: "Follow-up"
  },
  {
    title: "Future Travel",
    content: "Planning your next adventure? I'd love to help! I have access to exclusive deals and insider knowledge for destinations worldwide.",
    category: "Follow-up"
  },

  // Delays & Issues Templates
  {
    title: "Flight Delay Notification",
    content: "Your flight [Flight Number] has been delayed. I'm rebooking you on the next available flight and will send updated details shortly.",
    category: "Issues",
    shortcut: "/delay"
  },
  {
    title: "Booking Error Apology",
    content: "I sincerely apologize for the confusion with your booking. I'm fixing this right now and will make it right.",
    category: "Issues"
  },
  {
    title: "Compensation Offer",
    content: "Due to the inconvenience, I'd like to offer [Compensation] as an apology. Does this work for you?",
    category: "Issues"
  },
  {
    title: "Alternative Options",
    content: "Unfortunately [Issue]. However, I've found these alternative options: [Options]. Which would you prefer?",
    category: "Issues"
  },

  // Upgrades & Add-ons Templates
  {
    title: "Upgrade Offer",
    content: "Great news! I can upgrade you to [Upgrade Type] for just [Price]. Interested?",
    category: "Upgrades",
    shortcut: "/upgrade"
  },
  {
    title: "Insurance Offer",
    content: "Would you like comprehensive travel insurance? It covers cancellations, medical emergencies, and lost luggage for [Price].",
    category: "Upgrades"
  },
  {
    title: "VIP Services",
    content: "Want to make your trip extra special? We offer airport lounge access, private transfers, and concierge services.",
    category: "Upgrades"
  },
  {
    title: "Early Check-in/Late Checkout",
    content: "I can arrange early check-in or late checkout at your hotel for [Price]. Would you like me to add this?",
    category: "Upgrades"
  },

  // Group Travel Templates
  {
    title: "Group Booking Info",
    content: "For group bookings of [Number]+ travelers, we offer special rates and coordinated arrangements. Let me put together a package!",
    category: "Group Travel"
  },
  {
    title: "Payment Collection Status",
    content: "We've collected [Amount] from [Number] travelers so far. Still waiting on payments from [Names]. Deadline is [Date].",
    category: "Group Travel"
  },
  {
    title: "Group Coordination",
    content: "I've sent the group itinerary to all travelers. Everyone should have received confirmation and meeting point details.",
    category: "Group Travel"
  },
  {
    title: "Group Discount Applied",
    content: "Good news! Your group qualifies for a [Percentage]% discount. The new total is [Amount].",
    category: "Group Travel"
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
