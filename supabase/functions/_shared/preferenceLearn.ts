/**
 * AI Preference Learning Utility
 * Stores and retrieves user travel preferences from conversations
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

export interface TravelPreferences {
  travel_style?: string[];
  budget_preference?: string;
  preferred_destinations?: string[];
  preferred_accommodation_types?: string[];
  preferred_airlines?: string[];
  dietary_restrictions?: string[];
  accessibility_needs?: string[];
  travel_companions?: string;
  trip_frequency?: string;
  booking_preferences?: Record<string, any>;
  conversation_context?: Record<string, any>;
}

/**
 * Retrieve user's travel preferences
 */
export async function getUserPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<TravelPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_travel_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        console.log(`[PREF-LEARN] No preferences found for user ${userId}`);
        return null;
      }
      console.error('[PREF-LEARN] Error fetching preferences:', error);
      return null;
    }

    console.log(`[PREF-LEARN] Retrieved preferences for user ${userId}`);
    return data as TravelPreferences;
  } catch (error) {
    console.error('[PREF-LEARN] Exception fetching preferences:', error);
    return null;
  }
}

/**
 * Save or update user's travel preferences
 */
export async function saveUserPreferences(
  supabase: SupabaseClient,
  userId: string,
  preferences: Partial<TravelPreferences>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_travel_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        last_updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('[PREF-LEARN] Error saving preferences:', error);
      return false;
    }

    console.log(`[PREF-LEARN] Saved preferences for user ${userId}`);
    return true;
  } catch (error) {
    console.error('[PREF-LEARN] Exception saving preferences:', error);
    return false;
  }
}

/**
 * Extract preferences from conversation context
 */
export function extractPreferencesFromConversation(
  messages: Array<{ role: string; content: string }>
): Partial<TravelPreferences> {
  const extracted: Partial<TravelPreferences> = {};
  const conversationText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Travel style detection
  const travelStyles = [];
  if (/\b(luxury|high[- ]end|5[- ]star|upscale|premium)\b/i.test(conversationText)) {
    travelStyles.push('luxury');
  }
  if (/\b(budget|cheap|affordable|economical|backpack)\b/i.test(conversationText)) {
    travelStyles.push('budget');
  }
  if (/\b(adventure|hiking|outdoor|active|extreme)\b/i.test(conversationText)) {
    travelStyles.push('adventure');
  }
  if (/\b(relax|spa|beach|resort|peaceful)\b/i.test(conversationText)) {
    travelStyles.push('relaxation');
  }
  if (/\b(family|kids|children)\b/i.test(conversationText)) {
    travelStyles.push('family');
  }
  if (travelStyles.length > 0) {
    extracted.travel_style = travelStyles;
  }

  // Budget preference
  if (/\$([\d,]+)/i.test(conversationText) || /\b(budget|price|cost)\b/i.test(conversationText)) {
    const budgetMatch = conversationText.match(/\$([\d,]+)/);
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1].replace(/,/g, ''));
      if (amount < 100) extracted.budget_preference = 'budget';
      else if (amount < 300) extracted.budget_preference = 'moderate';
      else extracted.budget_preference = 'luxury';
    }
  }

  // Accommodation preferences
  const accommodationTypes = [];
  if (/\b(hotel|motel)\b/i.test(conversationText)) accommodationTypes.push('hotel');
  if (/\b(resort)\b/i.test(conversationText)) accommodationTypes.push('resort');
  if (/\b(airbnb|apartment|condo)\b/i.test(conversationText)) accommodationTypes.push('vacation_rental');
  if (/\b(hostel)\b/i.test(conversationText)) accommodationTypes.push('hostel');
  if (accommodationTypes.length > 0) {
    extracted.preferred_accommodation_types = accommodationTypes;
  }

  // Dietary restrictions
  const dietaryRestrictions = [];
  if (/\b(vegetarian|vegan)\b/i.test(conversationText)) {
    if (/\bvegan\b/i.test(conversationText)) dietaryRestrictions.push('vegan');
    else dietaryRestrictions.push('vegetarian');
  }
  if (/\b(gluten[- ]free|celiac)\b/i.test(conversationText)) dietaryRestrictions.push('gluten_free');
  if (/\b(kosher)\b/i.test(conversationText)) dietaryRestrictions.push('kosher');
  if (/\b(halal)\b/i.test(conversationText)) dietaryRestrictions.push('halal');
  if (dietaryRestrictions.length > 0) {
    extracted.dietary_restrictions = dietaryRestrictions;
  }

  // Accessibility needs
  const accessibilityNeeds = [];
  if (/\b(wheelchair|mobility|accessible|disability)\b/i.test(conversationText)) {
    accessibilityNeeds.push('wheelchair_accessible');
  }
  if (accessibilityNeeds.length > 0) {
    extracted.accessibility_needs = accessibilityNeeds;
  }

  // Travel companions
  if (/\b(family|kids|children)\b/i.test(conversationText)) {
    extracted.travel_companions = 'family';
  } else if (/\b(couple|partner|spouse)\b/i.test(conversationText)) {
    extracted.travel_companions = 'couple';
  } else if (/\b(solo|alone|myself)\b/i.test(conversationText)) {
    extracted.travel_companions = 'solo';
  } else if (/\b(friends|group)\b/i.test(conversationText)) {
    extracted.travel_companions = 'friends';
  }

  return extracted;
}

/**
 * Build context string from stored preferences
 */
export function buildPreferenceContext(preferences: TravelPreferences | null): string {
  if (!preferences) return '';

  const parts = [];

  if (preferences.travel_style && preferences.travel_style.length > 0) {
    parts.push(`User prefers ${preferences.travel_style.join(', ')} travel.`);
  }

  if (preferences.budget_preference) {
    parts.push(`Budget preference: ${preferences.budget_preference}.`);
  }

  if (preferences.preferred_destinations && preferences.preferred_destinations.length > 0) {
    parts.push(`Previously interested in: ${preferences.preferred_destinations.join(', ')}.`);
  }

  if (preferences.preferred_accommodation_types && preferences.preferred_accommodation_types.length > 0) {
    parts.push(`Prefers ${preferences.preferred_accommodation_types.join(' or ')} accommodations.`);
  }

  if (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
    parts.push(`Dietary needs: ${preferences.dietary_restrictions.join(', ')}.`);
  }

  if (preferences.accessibility_needs && preferences.accessibility_needs.length > 0) {
    parts.push(`Accessibility requirements: ${preferences.accessibility_needs.join(', ')}.`);
  }

  if (preferences.travel_companions) {
    parts.push(`Usually travels with: ${preferences.travel_companions}.`);
  }

  return parts.length > 0 ? `\n\nUser Profile:\n${parts.join('\n')}` : '';
}
