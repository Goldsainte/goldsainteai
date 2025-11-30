import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { decodeData } from "@/lib/utils";

interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  activities: string[];
  meals: string;
  accommodation: string;
}

export interface ItineraryPrefillData {
  destination: string;
  title: string;
  nights: number;
  vibes: string[];
  headline: string;
  budgetRange: string;
  itinerary: ItineraryDay[];
  // Calculated values
  startsOn: string;
  endsOn: string;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetLevel: "accessible" | "elevated" | "ultra_luxury";
  interests: string[];
  specialNotes: string;
}

// Map vibe tags to interests
const vibeToInterestMap: Record<string, string> = {
  "food & wine": "Food & wine",
  "foodie": "Food & wine",
  "culinary": "Food & wine",
  "gastronomy": "Food & wine",
  "wellness": "Wellness",
  "spa": "Wellness",
  "relaxation": "Wellness",
  "adventure": "Adventure",
  "hiking": "Adventure",
  "outdoor": "Adventure",
  "nature": "Adventure",
  "culture": "Culture & museums",
  "art": "Culture & museums",
  "history": "Culture & museums",
  "museums": "Culture & museums",
  "nightlife": "Nightlife",
  "party": "Nightlife",
  "family": "Family-friendly",
  "kids": "Family-friendly",
  "romantic": "Honeymoon / romance",
  "honeymoon": "Honeymoon / romance",
  "couples": "Honeymoon / romance",
  "anniversary": "Honeymoon / romance",
  "design": "Design hotels",
  "boutique": "Design hotels",
  "luxury": "Design hotels",
};

// Parse budget range string like "$3k-5k" or "$5,000-$10,000"
function parseBudgetRange(budgetRange: string): { min: number | null; max: number | null; level: "accessible" | "elevated" | "ultra_luxury" } {
  if (!budgetRange) return { min: null, max: null, level: "elevated" };
  
  const cleaned = budgetRange.toLowerCase().replace(/[$,]/g, "");
  
  // Handle "Xk-Yk" format
  const kMatch = cleaned.match(/(\d+)k?\s*[-–]\s*(\d+)k/);
  if (kMatch) {
    const min = parseInt(kMatch[1]) * (cleaned.includes("k") ? 1000 : 1);
    const max = parseInt(kMatch[2]) * 1000;
    return { 
      min, 
      max, 
      level: max >= 15000 ? "ultra_luxury" : max >= 7000 ? "elevated" : "accessible" 
    };
  }
  
  // Handle "X-Y" format (full numbers)
  const numMatch = cleaned.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (numMatch) {
    const min = parseInt(numMatch[1]);
    const max = parseInt(numMatch[2]);
    return { 
      min, 
      max, 
      level: max >= 15000 ? "ultra_luxury" : max >= 7000 ? "elevated" : "accessible" 
    };
  }
  
  return { min: null, max: null, level: "elevated" };
}

// Get date X days from today in YYYY-MM-DD format
function getDateFromToday(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

export function useItineraryPrefill(): {
  hasItineraryPrefill: boolean;
  prefillData: ItineraryPrefillData | null;
} {
  const [searchParams] = useSearchParams();
  
  const prefillData = useMemo(() => {
    const from = searchParams.get("from");
    if (from !== "collection") return null;
    
    const destination = searchParams.get("destination") || "";
    const title = searchParams.get("title") || "";
    const nights = parseInt(searchParams.get("nights") || "0") || 0;
    const vibesRaw = searchParams.get("vibes") || "";
    const headline = searchParams.get("headline") || "";
    const budgetRange = searchParams.get("budget") || "";
    const itineraryEncoded = searchParams.get("itinerary") || "";
    
    // Parse vibes
    const vibes = vibesRaw ? vibesRaw.split(",").map(v => v.trim()).filter(Boolean) : [];
    
    // Parse itinerary JSON
    let itinerary: ItineraryDay[] = [];
    if (itineraryEncoded) {
      try {
        const decoded = decodeData(itineraryEncoded);
        if (Array.isArray(decoded)) {
          itinerary = decoded;
        }
      } catch (e) {
        console.error("Failed to decode itinerary:", e);
      }
    }
    
    // Calculate dates (start 30 days from today)
    const startsOn = getDateFromToday(30);
    const endsOn = nights > 0 ? getDateFromToday(30 + nights) : getDateFromToday(37);
    
    // Parse budget
    const { min: budgetMin, max: budgetMax, level: budgetLevel } = parseBudgetRange(budgetRange);
    
    // Map vibes to interests
    const interests: string[] = [];
    vibes.forEach(vibe => {
      const lowVibe = vibe.toLowerCase();
      Object.entries(vibeToInterestMap).forEach(([key, interest]) => {
        if (lowVibe.includes(key) && !interests.includes(interest)) {
          interests.push(interest);
        }
      });
    });
    
    // Build special notes from headline + itinerary summary
    let specialNotes = "";
    if (headline) {
      specialNotes = `AI-curated inspiration: ${headline}`;
    }
    if (itinerary.length > 0) {
      const daySummary = itinerary
        .map(day => `Day ${day.dayNumber}: ${day.title}`)
        .join("; ");
      specialNotes += specialNotes ? `\n\nItinerary overview: ${daySummary}` : `Itinerary overview: ${daySummary}`;
    }
    
    return {
      destination,
      title,
      nights,
      vibes,
      headline,
      budgetRange,
      itinerary,
      startsOn,
      endsOn,
      budgetMin,
      budgetMax,
      budgetLevel,
      interests,
      specialNotes,
    };
  }, [searchParams]);
  
  return {
    hasItineraryPrefill: prefillData !== null && prefillData.destination !== "",
    prefillData,
  };
}
