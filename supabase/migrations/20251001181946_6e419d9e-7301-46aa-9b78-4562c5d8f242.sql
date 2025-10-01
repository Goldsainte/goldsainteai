-- Add comprehensive booking preferences fields to user_booking_preferences table

-- Hotel preferences
ALTER TABLE user_booking_preferences 
ADD COLUMN IF NOT EXISTS destination TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS distance_from_center NUMERIC,
ADD COLUMN IF NOT EXISTS distance_from_airport NUMERIC,
ADD COLUMN IF NOT EXISTS price_range_min NUMERIC,
ADD COLUMN IF NOT EXISTS price_range_max NUMERIC,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS include_taxes_fees BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS room_type TEXT,
ADD COLUMN IF NOT EXISTS bed_type TEXT,
ADD COLUMN IF NOT EXISTS number_of_adults INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS number_of_children INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_review_score NUMERIC,
ADD COLUMN IF NOT EXISTS property_types TEXT[],
ADD COLUMN IF NOT EXISTS free_wifi BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS breakfast_included BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pool BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gym BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pet_friendly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS airport_shuttle BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accessible_rooms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS free_cancellation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pay_at_property BOOLEAN DEFAULT false;

-- Flight preferences
ALTER TABLE user_booking_preferences
ADD COLUMN IF NOT EXISTS departure_airport TEXT,
ADD COLUMN IF NOT EXISTS destination_airport TEXT,
ADD COLUMN IF NOT EXISTS flight_type TEXT DEFAULT 'round-trip',
ADD COLUMN IF NOT EXISTS include_nearby_airports BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_departure_time TEXT,
ADD COLUMN IF NOT EXISTS preferred_arrival_time TEXT,
ADD COLUMN IF NOT EXISTS max_duration_hours INTEGER,
ADD COLUMN IF NOT EXISTS direct_flights_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_layover_hours INTEGER,
ADD COLUMN IF NOT EXISTS max_stops INTEGER,
ADD COLUMN IF NOT EXISTS cabin_class TEXT DEFAULT 'economy',
ADD COLUMN IF NOT EXISTS excluded_airlines TEXT[],
ADD COLUMN IF NOT EXISTS preferred_alliance TEXT,
ADD COLUMN IF NOT EXISTS max_price_per_passenger NUMERIC,
ADD COLUMN IF NOT EXISTS baggage_carry_on BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS baggage_checked INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS flexible_fare BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refundable_ticket BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS number_of_infants INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wheelchair_assistance BOOLEAN DEFAULT false;

-- Restaurant preferences
ALTER TABLE user_booking_preferences
ADD COLUMN IF NOT EXISTS cuisine_types TEXT[],
ADD COLUMN IF NOT EXISTS restaurant_price_range TEXT,
ADD COLUMN IF NOT EXISTS seating_preference TEXT,
ADD COLUMN IF NOT EXISTS private_dining BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_friendly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS restaurant_experience_type TEXT[],
ADD COLUMN IF NOT EXISTS preferred_dining_time TEXT,
ADD COLUMN IF NOT EXISTS dining_time_flexible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS near_hotel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS walkable_distance BOOLEAN DEFAULT false;

-- Car rental preferences
ALTER TABLE user_booking_preferences
ADD COLUMN IF NOT EXISTS car_type TEXT,
ADD COLUMN IF NOT EXISTS transmission_type TEXT DEFAULT 'automatic',
ADD COLUMN IF NOT EXISTS car_features TEXT[],
ADD COLUMN IF NOT EXISTS unlimited_mileage BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pickup_location TEXT,
ADD COLUMN IF NOT EXISTS dropoff_location TEXT,
ADD COLUMN IF NOT EXISTS car_budget_min NUMERIC,
ADD COLUMN IF NOT EXISTS car_budget_max NUMERIC,
ADD COLUMN IF NOT EXISTS insurance_included BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS fuel_policy TEXT DEFAULT 'full-to-full',
ADD COLUMN IF NOT EXISTS minimum_driver_age INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS young_driver_accepted BOOLEAN DEFAULT false;

-- Event preferences
ALTER TABLE user_booking_preferences
ADD COLUMN IF NOT EXISTS event_types TEXT[],
ADD COLUMN IF NOT EXISTS event_location TEXT,
ADD COLUMN IF NOT EXISTS near_accommodation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS event_time_preference TEXT,
ADD COLUMN IF NOT EXISTS ticket_type TEXT,
ADD COLUMN IF NOT EXISTS seating_type TEXT,
ADD COLUMN IF NOT EXISTS digital_tickets BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS event_budget_min NUMERIC,
ADD COLUMN IF NOT EXISTS event_budget_max NUMERIC,
ADD COLUMN IF NOT EXISTS event_accessibility BOOLEAN DEFAULT false;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_booking_preferences_timestamp ON user_booking_preferences;
CREATE TRIGGER update_booking_preferences_timestamp
BEFORE UPDATE ON user_booking_preferences
FOR EACH ROW
EXECUTE FUNCTION update_booking_preferences_updated_at();