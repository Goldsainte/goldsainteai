import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hotel, Plane, UtensilsCrossed, Car, Ticket, FileDown, FileText } from "lucide-react";
import jsPDF from "jspdf";


interface PreferencesFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isLoading?: boolean;
}

export function ComprehensivePreferencesForm({ onSubmit, initialData, isLoading }: PreferencesFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialData || {});
  const [hotelPriceRange, setHotelPriceRange] = useState([initialData?.price_range_min || 20, initialData?.price_range_max || 1000]);
  const [flightMaxPrice, setFlightMaxPrice] = useState(initialData?.max_price_per_passenger || 500);
  const [carBudgetRange, setCarBudgetRange] = useState([initialData?.car_budget_min || 20, initialData?.car_budget_max || 500]);
  const [eventBudgetRange, setEventBudgetRange] = useState([initialData?.event_budget_min || 20, initialData?.event_budget_max || 500]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      price_range_min: hotelPriceRange[0],
      price_range_max: hotelPriceRange[1],
      max_price_per_passenger: flightMaxPrice,
      car_budget_min: carBudgetRange[0],
      car_budget_max: carBudgetRange[1],
      event_budget_min: eventBudgetRange[0],
      event_budget_max: eventBudgetRange[1],
    };
    onSubmit(submitData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: string, value: string) => {
    const array = value.split(',').map(s => s.trim()).filter(Boolean);
    updateField(field, array);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    doc.setFontSize(18);
    doc.text("Travel Booking Preferences", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    doc.setFontSize(12);
    
    // Helper to add section
    const addSection = (title: string, content: Record<string, any>) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, "bold");
      doc.text(title, 20, yPos);
      yPos += 7;
      doc.setFont(undefined, "normal");
      
      Object.entries(content).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          const val = Array.isArray(value) ? value.join(", ") : String(value);
          doc.text(`${label}: ${val}`, 25, yPos);
          yPos += 6;
        }
      });
      yPos += 5;
    };

    // Hotel Section
    addSection("Hotel Preferences", {
      destination: formData.destination,
      neighborhood: formData.neighborhood,
      "price_range": `$${hotelPriceRange[0]} - $${hotelPriceRange[1]}`,
      "distance_from_center": formData.distance_from_center ? `${formData.distance_from_center} miles` : undefined,
      "distance_from_airport": formData.distance_from_airport ? `${formData.distance_from_airport} miles` : undefined,
      room_type: formData.room_type,
      bed_type: formData.bed_type,
      min_star_rating: formData.preferred_hotel_rating,
      adults: formData.number_of_adults,
      children: formData.number_of_children,
      amenities: formData.preferred_amenities,
    });

    // Flight Section
    addSection("Flight Preferences", {
      departure_airport: formData.departure_airport,
      destination_airport: formData.destination_airport,
      flight_type: formData.flight_type,
      cabin_class: formData.cabin_class,
      max_price: `$${flightMaxPrice}`,
      preferred_airlines: formData.preferred_airlines,
      seat_preference: formData.seat_preference,
    });

    // Restaurant Section
    addSection("Restaurant Preferences", {
      cuisine_types: formData.cuisine_types,
      dietary_restrictions: formData.dietary_restrictions,
      price_range: formData.restaurant_price_range,
      seating_preference: formData.seating_preference,
    });

    // Car Rental Section
    addSection("Car Rental Preferences", {
      car_type: formData.car_type,
      transmission: formData.transmission_type,
      budget: `$${carBudgetRange[0]} - $${carBudgetRange[1]}`,
      pickup_location: formData.pickup_location,
      dropoff_location: formData.dropoff_location,
    });

    // Event Section
    addSection("Event Preferences", {
      event_types: formData.event_types,
      event_location: formData.event_location,
      budget: `$${eventBudgetRange[0]} - $${eventBudgetRange[1]}`,
      ticket_type: formData.ticket_type,
    });

    // Travel Documents Section
    addSection("Travel Documents", {
      passport_number: formData.passport_number,
      passport_expiry: formData.passport_expiry,
      passport_issuing_country: formData.passport_issuing_country,
      visa_required_countries: formData.visa_required_countries,
      visa_assistance_needed: formData.visa_assistance_needed ? "Yes" : "No",
    });

    if (formData.special_requests) {
      addSection("Special Requests", { notes: formData.special_requests });
    }

    doc.save("travel-preferences.pdf");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Accordion type="multiple" defaultValue={["hotel"]} className="w-full">
        {/* Hotel Preferences */}
        <AccordionItem value="hotel">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Hotel className="h-5 w-5 text-primary" />
              Hotel Booking Preferences
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destination">{t("pref.destination_city", "Destination / City")}</Label>
                <Input
                  id="destination"
                  placeholder={t("pref.e_g_paris_tokyo", "e.g., Paris, Tokyo")}
                  defaultValue={initialData?.destination}
                  onChange={(e) => updateField('destination', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">{t("pref.neighborhood", "Neighborhood")}</Label>
                <Input
                  id="neighborhood"
                  placeholder={t("pref.e_g_downtown_old_town", "e.g., Downtown, Old Town")}
                  defaultValue={initialData?.neighborhood}
                  onChange={(e) => updateField('neighborhood', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distance_from_center">{t("pref.distance_from_city_center_miles", "Distance from City Center (miles)")}</Label>
                <Input
                  id="distance_from_center"
                  type="number"
                  step="0.1"
                  placeholder={t("pref.e_g_2_5", "e.g., 2.5")}
                  defaultValue={initialData?.distance_from_center}
                  onChange={(e) => updateField('distance_from_center', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="distance_from_airport">{t("pref.distance_from_airport_miles", "Distance from Airport (miles)")}</Label>
                <Input
                  id="distance_from_airport"
                  type="number"
                  step="0.1"
                  placeholder={t("pref.e_g_5_0", "e.g., 5.0")}
                  defaultValue={initialData?.distance_from_airport}
                  onChange={(e) => updateField('distance_from_airport', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{t("pref.price_range_per_night", "Price Range per Night")}</Label>
                  <span className="text-sm font-medium">${hotelPriceRange[0]} - ${hotelPriceRange[1] >= 1000 ? '1000+' : hotelPriceRange[1]}</span>
                </div>
                <Slider
                  min={20}
                  max={1000}
                  step={10}
                  value={hotelPriceRange}
                  onValueChange={setHotelPriceRange}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="currency">{t("pref.currency", "Currency")}</Label>
                <select
                  id="currency"
                  defaultValue={initialData?.currency || 'USD'}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="USD">{t("pref.usd", "USD")}</option>
                  <option value="EUR">{t("pref.eur", "EUR")}</option>
                  <option value="GBP">{t("pref.gbp", "GBP")}</option>
                  <option value="JPY">{t("pref.jpy", "JPY")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="room_type">{t("pref.room_type", "Room Type")}</Label>
                <select
                  id="room_type"
                  defaultValue={initialData?.room_type}
                  onChange={(e) => updateField('room_type', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">{t("pref.any", "Any")}</option>
                  <option value="single">{t("pref.single", "Single")}</option>
                  <option value="double">{t("pref.double", "Double")}</option>
                  <option value="suite">{t("pref.suite", "Suite")}</option>
                  <option value="family">{t("pref.family", "Family")}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="bed_type">{t("pref.bed_type", "Bed Type")}</Label>
                <select
                  id="bed_type"
                  defaultValue={initialData?.bed_type}
                  onChange={(e) => updateField('bed_type', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">{t("pref.any", "Any")}</option>
                  <option value="king">{t("pref.king", "King")}</option>
                  <option value="queen">{t("pref.queen", "Queen")}</option>
                  <option value="twin">{t("pref.twin", "Twin")}</option>
                  <option value="bunk">{t("pref.bunk", "Bunk")}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="preferred_hotel_rating">{t("pref.min_star_rating", "Min Star Rating")}</Label>
                <Input
                  id="preferred_hotel_rating"
                  type="number"
                  min="1"
                  max="5"
                  defaultValue={initialData?.preferred_hotel_rating || 3}
                  onChange={(e) => updateField('preferred_hotel_rating', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="number_of_adults">{t("pref.adults", "Adults")}</Label>
                <Input
                  id="number_of_adults"
                  type="number"
                  min="1"
                  defaultValue={initialData?.number_of_adults || 1}
                  onChange={(e) => updateField('number_of_adults', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="number_of_children">{t("pref.children", "Children")}</Label>
                <Input
                  id="number_of_children"
                  type="number"
                  min="0"
                  defaultValue={initialData?.number_of_children || 0}
                  onChange={(e) => updateField('number_of_children', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="min_review_score">{t("pref.min_review_score_1_10", "Min Review Score (1-10)")}</Label>
                <Input
                  id="min_review_score"
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  defaultValue={initialData?.min_review_score}
                  onChange={(e) => updateField('min_review_score', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="property_types">{t("pref.property_types_comma_separated", "Property Types (comma-separated)")}</Label>
              <Input
                id="property_types"
                placeholder={t("pref.hotel_boutique_hotel_resort_apartment", "Hotel, Boutique hotel, Resort, Apartment")}
                defaultValue={initialData?.property_types?.join(', ')}
                onChange={(e) => updateArrayField('property_types', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>{t("pref.hotel_amenities", "Hotel Amenities")}</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'free_wifi', label: t("pref.free_wi_fi", 'Free Wi-Fi') },
                  { id: 'breakfast_included', label: t("pref.breakfast", 'Breakfast') },
                  { id: 'pool', label: t("pref.pool", 'Pool') },
                  { id: 'gym', label: t("pref.gym", 'Gym') },
                  { id: 'parking', label: t("pref.parking", 'Parking') },
                  { id: 'pet_friendly', label: t("pref.pet_friendly", 'Pet-Friendly') },
                  { id: 'airport_shuttle', label: t("pref.airport_shuttle", 'Airport Shuttle') },
                  { id: 'accessible_rooms', label: t("pref.accessible", 'Accessible') },
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      defaultChecked={initialData?.[id]}
                      onCheckedChange={(checked) => updateField(id, checked)}
                    />
                    <Label htmlFor={id} className="cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("pref.booking_flexibility", "Booking Flexibility")}</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'free_cancellation', label: t("pref.free_cancellation", 'Free Cancellation') },
                  { id: 'pay_at_property', label: t("pref.pay_at_property", 'Pay at Property') },
                  { id: 'include_taxes_fees', label: t("pref.include_taxes_fees", 'Include Taxes/Fees') },
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      defaultChecked={initialData?.[id] ?? true}
                      onCheckedChange={(checked) => updateField(id, checked)}
                    />
                    <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Flight Preferences */}
        <AccordionItem value="flight">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              Flight Booking Preferences
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departure_airport">{t("pref.departure_airport", "Departure Airport")}</Label>
                <Input
                  id="departure_airport"
                  placeholder={t("pref.e_g_jfk_lax", "e.g., JFK, LAX")}
                  defaultValue={initialData?.departure_airport}
                  onChange={(e) => updateField('departure_airport', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="destination_airport">{t("pref.destination_airport", "Destination Airport")}</Label>
                <Input
                  id="destination_airport"
                  placeholder={t("pref.e_g_cdg_nrt", "e.g., CDG, NRT")}
                  defaultValue={initialData?.destination_airport}
                  onChange={(e) => updateField('destination_airport', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flight_type">{t("pref.flight_type", "Flight Type")}</Label>
                <select
                  id="flight_type"
                  defaultValue={initialData?.flight_type || 'round-trip'}
                  onChange={(e) => updateField('flight_type', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="round-trip">{t("pref.round_trip", "Round-Trip")}</option>
                  <option value="one-way">{t("pref.one_way", "One-Way")}</option>
                  <option value="multi-city">{t("pref.multi_city", "Multi-City")}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="cabin_class">{t("pref.cabin_class", "Cabin Class")}</Label>
                <select
                  id="cabin_class"
                  defaultValue={initialData?.cabin_class || 'economy'}
                  onChange={(e) => updateField('cabin_class', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="economy">{t("pref.economy", "Economy")}</option>
                  <option value="premium_economy">{t("pref.premium_economy", "Premium Economy")}</option>
                  <option value="business">{t("pref.business", "Business")}</option>
                  <option value="first">{t("pref.first_class", "First Class")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferred_departure_time">{t("pref.preferred_departure_time", "Preferred Departure Time")}</Label>
                <select
                  id="preferred_departure_time"
                  defaultValue={initialData?.preferred_departure_time}
                  onChange={(e) => updateField('preferred_departure_time', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">{t("pref.any_time", "Any Time")}</option>
                  <option value="morning">{t("pref.morning_6am_12pm", "Morning (6AM-12PM)")}</option>
                  <option value="afternoon">{t("pref.afternoon_12pm_6pm", "Afternoon (12PM-6PM)")}</option>
                  <option value="evening">{t("pref.evening_6pm_12am", "Evening (6PM-12AM)")}</option>
                  <option value="night">{t("pref.night_12am_6am", "Night (12AM-6AM)")}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="preferred_arrival_time">{t("pref.preferred_arrival_time", "Preferred Arrival Time")}</Label>
                <select
                  id="preferred_arrival_time"
                  defaultValue={initialData?.preferred_arrival_time}
                  onChange={(e) => updateField('preferred_arrival_time', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">{t("pref.any_time", "Any Time")}</option>
                  <option value="morning">{t("pref.morning", "Morning")}</option>
                  <option value="afternoon">{t("pref.afternoon", "Afternoon")}</option>
                  <option value="evening">{t("pref.evening", "Evening")}</option>
                  <option value="night">{t("pref.night", "Night")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="max_duration_hours">{t("pref.max_duration_hours", "Max Duration (hours)")}</Label>
                <Input
                  id="max_duration_hours"
                  type="number"
                  defaultValue={initialData?.max_duration_hours}
                  onChange={(e) => updateField('max_duration_hours', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="max_layover_hours">{t("pref.max_layover_hours", "Max Layover (hours)")}</Label>
                <Input
                  id="max_layover_hours"
                  type="number"
                  defaultValue={initialData?.max_layover_hours}
                  onChange={(e) => updateField('max_layover_hours', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="max_stops">{t("pref.max_stops", "Max Stops")}</Label>
                <Input
                  id="max_stops"
                  type="number"
                  min="0"
                  max="3"
                  defaultValue={initialData?.max_stops}
                  onChange={(e) => updateField('max_stops', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferred_airlines">{t("pref.preferred_airlines_comma_separated", "Preferred Airlines (comma-separated)")}</Label>
                <Input
                  id="preferred_airlines"
                  placeholder={t("pref.emirates_qatar_airways_singapore_airline", "Emirates, Qatar Airways, Singapore Airlines")}
                  defaultValue={initialData?.preferred_airlines?.join(', ')}
                  onChange={(e) => updateArrayField('preferred_airlines', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="excluded_airlines">{t("pref.excluded_airlines_comma_separated", "Excluded Airlines (comma-separated)")}</Label>
                <Input
                  id="excluded_airlines"
                  placeholder={t("pref.budget_airlines_to_avoid", "Budget airlines to avoid")}
                  defaultValue={initialData?.excluded_airlines?.join(', ')}
                  onChange={(e) => updateArrayField('excluded_airlines', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{t("pref.max_price_per_passenger", "Max Price per Passenger")}</Label>
                  <span className="text-sm font-medium">${flightMaxPrice >= 1000 ? '1000+' : flightMaxPrice}</span>
                </div>
                <Slider
                  min={20}
                  max={1000}
                  step={10}
                  value={[flightMaxPrice]}
                  onValueChange={(val) => setFlightMaxPrice(val[0])}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="baggage_checked">{t("pref.checked_bags", "Checked Bags")}</Label>
                <Input
                  id="baggage_checked"
                  type="number"
                  min="0"
                  defaultValue={initialData?.baggage_checked || 1}
                  onChange={(e) => updateField('baggage_checked', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seat_preference">{t("pref.seat_preference", "Seat Preference")}</Label>
                <select
                  id="seat_preference"
                  defaultValue={initialData?.seat_preference || 'window'}
                  onChange={(e) => updateField('seat_preference', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="window">{t("pref.window", "Window")}</option>
                  <option value="aisle">{t("pref.aisle", "Aisle")}</option>
                  <option value="middle">{t("pref.middle", "Middle")}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="meal_preference">{t("pref.meal_preference", "Meal Preference")}</Label>
                <select
                  id="meal_preference"
                  defaultValue={initialData?.meal_preference || 'regular'}
                  onChange={(e) => updateField('meal_preference', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="regular">{t("pref.regular", "Regular")}</option>
                  <option value="vegetarian">{t("pref.vegetarian", "Vegetarian")}</option>
                  <option value="vegan">{t("pref.vegan", "Vegan")}</option>
                  <option value="kosher">{t("pref.kosher", "Kosher")}</option>
                  <option value="halal">{t("pref.halal", "Halal")}</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("pref.flight_options", "Flight Options")}</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'include_nearby_airports', label: t("pref.include_nearby_airports", 'Include Nearby Airports') },
                  { id: 'direct_flights_only', label: t("pref.direct_flights_only", 'Direct Flights Only') },
                  { id: 'baggage_carry_on', label: t("pref.carry_on_included", 'Carry-On Included') },
                  { id: 'flexible_fare', label: t("pref.flexible_fare", 'Flexible Fare') },
                  { id: 'refundable_ticket', label: t("pref.refundable", 'Refundable') },
                  { id: 'wheelchair_assistance', label: t("pref.wheelchair_assistance", 'Wheelchair Assistance') },
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      defaultChecked={initialData?.[id]}
                      onCheckedChange={(checked) => updateField(id, checked)}
                    />
                    <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Restaurant Preferences */}
        <AccordionItem value="restaurant">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Restaurant Preferences
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <Label htmlFor="cuisine_types">{t("pref.cuisine_types_comma_separated", "Cuisine Types (comma-separated)")}</Label>
              <Input
                id="cuisine_types"
                placeholder={t("pref.italian_japanese_indian_vegan", "Italian, Japanese, Indian, Vegan")}
                defaultValue={initialData?.cuisine_types?.join(', ')}
                onChange={(e) => updateArrayField('cuisine_types', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dietary_restrictions">{t("pref.dietary_requirements_comma_separated", "Dietary Requirements (comma-separated)")}</Label>
              <Input
                id="dietary_restrictions"
                placeholder={t("pref.vegetarian_gluten_free_halal_kosher", "Vegetarian, Gluten-free, Halal, Kosher")}
                defaultValue={initialData?.dietary_restrictions?.join(', ')}
                onChange={(e) => updateArrayField('dietary_restrictions', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="restaurant_price_range">{t("pref.price_range", "Price Range")}</Label>
                <select
                  id="restaurant_price_range"
                  defaultValue={initialData?.restaurant_price_range}
                  onChange={(e) => updateField('restaurant_price_range', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">{t("pref.any", "Any")}</option>
                  <option value="$">$ - Budget</option>
                  <option value="$$">$$ - Moderate</option>
                  <option value="$$$">$$$ - Upscale</option>
                  <option value="$$$$">$$$$ - Fine Dining</option>
                </select>
              </div>
              <div>
                <Label htmlFor="seating_preference">{t("pref.seating_preference", "Seating Preference")}</Label>
                <select
                  id="seating_preference"
                  defaultValue={initialData?.seating_preference}
                  onChange={(e) => updateField('seating_preference', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">{t("pref.any", "Any")}</option>
                  <option value="indoor">{t("pref.indoor", "Indoor")}</option>
                  <option value="outdoor">{t("pref.outdoor", "Outdoor")}</option>
                  <option value="terrace">{t("pref.terrace", "Terrace")}</option>
                  <option value="bar">{t("pref.bar_seating", "Bar Seating")}</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="restaurant_experience_type">{t("pref.experience_type_comma_separated", "Experience Type (comma-separated)")}</Label>
              <Input
                id="restaurant_experience_type"
                placeholder={t("pref.fine_dining_casual_local_favorites_stree", "Fine dining, Casual, Local favorites, Street food")}
                defaultValue={initialData?.restaurant_experience_type?.join(', ')}
                onChange={(e) => updateArrayField('restaurant_experience_type', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferred_dining_time">{t("pref.preferred_dining_time", "Preferred Dining Time")}</Label>
                <select
                  id="preferred_dining_time"
                  defaultValue={initialData?.preferred_dining_time}
                  onChange={(e) => updateField('preferred_dining_time', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">{t("pref.any", "Any")}</option>
                  <option value="breakfast">{t("pref.breakfast", "Breakfast")}</option>
                  <option value="brunch">{t("pref.brunch", "Brunch")}</option>
                  <option value="lunch">{t("pref.lunch", "Lunch")}</option>
                  <option value="dinner">{t("pref.dinner", "Dinner")}</option>
                  <option value="late_night">{t("pref.late_night", "Late Night")}</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("pref.restaurant_options", "Restaurant Options")}</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'private_dining', label: t("pref.private_dining", 'Private Dining') },
                  { id: 'group_friendly', label: t("pref.group_friendly", 'Group-Friendly') },
                  { id: 'dining_time_flexible', label: t("pref.time_flexible", 'Time Flexible') },
                  { id: 'near_hotel', label: t("pref.near_hotel", 'Near Hotel') },
                  { id: 'walkable_distance', label: t("pref.walkable", 'Walkable') },
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      defaultChecked={initialData?.[id]}
                      onCheckedChange={(checked) => updateField(id, checked)}
                    />
                    <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Car Rental Preferences */}
        <AccordionItem value="car">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Car Rental Preferences
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="car_type">{t("pref.car_type", "Car Type")}</Label>
                <select
                  id="car_type"
                  defaultValue={initialData?.car_type}
                  onChange={(e) => updateField('car_type', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">{t("pref.any", "Any")}</option>
                  <option value="economy">{t("pref.economy", "Economy")}</option>
                  <option value="compact">{t("pref.compact", "Compact")}</option>
                  <option value="mid-size">{t("pref.mid_size", "Mid-Size")}</option>
                  <option value="suv">{t("pref.suv", "SUV")}</option>
                  <option value="luxury">{t("pref.luxury", "Luxury")}</option>
                  <option value="convertible">{t("pref.convertible", "Convertible")}</option>
                  <option value="van">{t("pref.van_7_seater", "Van / 7-Seater")}</option>
                  <option value="electric">{t("pref.electric_hybrid", "Electric/Hybrid")}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="transmission_type">{t("pref.transmission", "Transmission")}</Label>
                <select
                  id="transmission_type"
                  defaultValue={initialData?.transmission_type || 'automatic'}
                  onChange={(e) => updateField('transmission_type', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="automatic">{t("pref.automatic", "Automatic")}</option>
                  <option value="manual">{t("pref.manual", "Manual")}</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="car_features">{t("pref.car_features_comma_separated", "Car Features (comma-separated)")}</Label>
              <Input
                id="car_features"
                placeholder={t("pref.gps_bluetooth_air_conditioning", "GPS, Bluetooth, Air conditioning")}
                defaultValue={initialData?.car_features?.join(', ')}
                onChange={(e) => updateArrayField('car_features', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup_location">{t("pref.pickup_location", "Pickup Location")}</Label>
                <Input
                  id="pickup_location"
                  placeholder={t("pref.airport_city_center", "Airport, City Center")}
                  defaultValue={initialData?.pickup_location}
                  onChange={(e) => updateField('pickup_location', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dropoff_location">{t("pref.drop_off_location", "Drop-off Location")}</Label>
                <Input
                  id="dropoff_location"
                  placeholder={t("pref.same_or_different", "Same or different")}
                  defaultValue={initialData?.dropoff_location}
                  onChange={(e) => updateField('dropoff_location', e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t("pref.car_rental_budget", "Car Rental Budget")}</Label>
                <span className="text-sm font-medium">${carBudgetRange[0]} - ${carBudgetRange[1] >= 1000 ? '1000+' : carBudgetRange[1]}</span>
              </div>
              <Slider
                min={20}
                max={1000}
                step={10}
                value={carBudgetRange}
                onValueChange={setCarBudgetRange}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fuel_policy">{t("pref.fuel_policy", "Fuel Policy")}</Label>
                <select
                  id="fuel_policy"
                  defaultValue={initialData?.fuel_policy || 'full-to-full'}
                  onChange={(e) => updateField('fuel_policy', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="full-to-full">{t("pref.full_to_full", "Full to Full")}</option>
                  <option value="pre-purchase">{t("pref.pre_purchase", "Pre-Purchase")}</option>
                  <option value="same-to-same">{t("pref.same_to_same", "Same to Same")}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="minimum_driver_age">{t("pref.minimum_driver_age", "Minimum Driver Age")}</Label>
                <Input
                  id="minimum_driver_age"
                  type="number"
                  defaultValue={initialData?.minimum_driver_age || 25}
                  onChange={(e) => updateField('minimum_driver_age', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("pref.car_rental_options", "Car Rental Options")}</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'unlimited_mileage', label: t("pref.unlimited_mileage", 'Unlimited Mileage') },
                  { id: 'insurance_included', label: t("pref.insurance_included", 'Insurance Included') },
                  { id: 'young_driver_accepted', label: t("pref.young_driver_ok", 'Young Driver OK') },
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      defaultChecked={initialData?.[id] ?? true}
                      onCheckedChange={(checked) => updateField(id, checked)}
                    />
                    <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Event Preferences */}
        <AccordionItem value="event">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Event Booking Preferences
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <Label htmlFor="event_types">{t("pref.event_types", "Event Types")}</Label>
              <Select
                value={formData.event_types?.[0] || ""}
                onValueChange={(val) => updateField('event_types', [val])}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("pref.select_event_type", "Select event type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="music">{t("pref.music_concerts", "Music / Concerts")}</SelectItem>
                  <SelectItem value="sports">{t("pref.sports", "Sports")}</SelectItem>
                  <SelectItem value="arts">{t("pref.arts_theatre", "Arts & Theatre")}</SelectItem>
                  <SelectItem value="family">{t("pref.family_kids", "Family / Kids")}</SelectItem>
                  <SelectItem value="festivals">{t("pref.festivals", "Festivals")}</SelectItem>
                  <SelectItem value="comedy">{t("pref.comedy", "Comedy")}</SelectItem>
                  <SelectItem value="film">{t("pref.film_movies", "Film / Movies")}</SelectItem>
                  <SelectItem value="miscellaneous">{t("pref.miscellaneous", "Miscellaneous")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event_location">{t("pref.event_location", "Event Location")}</Label>
                <Input
                  id="event_location"
                  placeholder={t("pref.city_venue", "City / Venue")}
                  defaultValue={initialData?.event_location}
                  onChange={(e) => updateField('event_location', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="event_time_preference">{t("pref.time_preference", "Time Preference")}</Label>
                <select
                  id="event_time_preference"
                  defaultValue={initialData?.event_time_preference}
                  onChange={(e) => updateField('event_time_preference', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">{t("pref.any", "Any")}</option>
                  <option value="morning">{t("pref.morning", "Morning")}</option>
                  <option value="afternoon">{t("pref.afternoon", "Afternoon")}</option>
                  <option value="evening">{t("pref.evening", "Evening")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticket_type">{t("pref.ticket_type", "Ticket Type")}</Label>
                <select
                  id="ticket_type"
                  defaultValue={initialData?.ticket_type}
                  onChange={(e) => updateField('ticket_type', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">{t("pref.any", "Any")}</option>
                  <option value="vip">{t("pref.vip", "VIP")}</option>
                  <option value="general">{t("pref.general_admission", "General Admission")}</option>
                  <option value="balcony">{t("pref.balcony", "Balcony")}</option>
                  <option value="box">{t("pref.box_seats", "Box Seats")}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="seating_type">{t("pref.seating_type", "Seating Type")}</Label>
                <select
                  id="seating_type"
                  defaultValue={initialData?.seating_type}
                  onChange={(e) => updateField('seating_type', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">{t("pref.any", "Any")}</option>
                  <option value="seated">{t("pref.seated", "Seated")}</option>
                  <option value="standing">{t("pref.standing", "Standing")}</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t("pref.event_budget", "Event Budget")}</Label>
                <span className="text-sm font-medium">${eventBudgetRange[0]} - ${eventBudgetRange[1] >= 1000 ? '1000+' : eventBudgetRange[1]}</span>
              </div>
              <Slider
                min={20}
                max={1000}
                step={10}
                value={eventBudgetRange}
                onValueChange={setEventBudgetRange}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>{t("pref.event_options", "Event Options")}</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'near_accommodation', label: t("pref.near_accommodation", 'Near Accommodation') },
                  { id: 'digital_tickets', label: t("pref.digital_tickets", 'Digital Tickets') },
                  { id: 'event_accessibility', label: t("pref.accessibility", 'Accessibility') },
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      defaultChecked={initialData?.[id] ?? true}
                      onCheckedChange={(checked) => updateField(id, checked)}
                    />
                    <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Travel Documents */}
        <AccordionItem value="documents">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Travel Documents & Visa Information
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passport_number">{t("pref.passport_number", "Passport Number")}</Label>
                <Input
                  id="passport_number"
                  placeholder={t("pref.e_g_ab1234567", "e.g., AB1234567")}
                  defaultValue={initialData?.passport_number}
                  onChange={(e) => updateField('passport_number', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="passport_expiry">{t("pref.passport_expiry_date", "Passport Expiry Date")}</Label>
                <Input
                  id="passport_expiry"
                  type="date"
                  defaultValue={initialData?.passport_expiry}
                  onChange={(e) => updateField('passport_expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passport_issuing_country">{t("pref.passport_issuing_country", "Passport Issuing Country")}</Label>
                <Input
                  id="passport_issuing_country"
                  placeholder={t("pref.e_g_united_states", "e.g., United States")}
                  defaultValue={initialData?.passport_issuing_country}
                  onChange={(e) => updateField('passport_issuing_country', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nationality">{t("pref.nationality", "Nationality")}</Label>
                <Input
                  id="nationality"
                  placeholder={t("pref.e_g_american", "e.g., American")}
                  defaultValue={initialData?.nationality}
                  onChange={(e) => updateField('nationality', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="visa_required_countries">{t("pref.countries_where_visa_may_be_required_com", "Countries Where Visa May Be Required (comma-separated)")}</Label>
              <Input
                id="visa_required_countries"
                placeholder={t("pref.e_g_china_russia_india", "e.g., China, Russia, India")}
                defaultValue={initialData?.visa_required_countries?.join(', ')}
                onChange={(e) => updateArrayField('visa_required_countries', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="visa_assistance_needed"
                defaultChecked={initialData?.visa_assistance_needed}
                onCheckedChange={(checked) => updateField('visa_assistance_needed', checked)}
              />
              <Label htmlFor="visa_assistance_needed" className="cursor-pointer text-sm">
                I need visa assistance for my travels
              </Label>
            </div>

            <div>
              <Label htmlFor="travel_insurance">{t("pref.travel_insurance_provider_optional", "Travel Insurance Provider (optional)")}</Label>
              <Input
                id="travel_insurance"
                placeholder={t("pref.e_g_allianz_world_nomads", "e.g., Allianz, World Nomads")}
                defaultValue={initialData?.travel_insurance}
                onChange={(e) => updateField('travel_insurance', e.target.value)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div>
        <Label htmlFor="special_requests">{t("pref.additional_special_requests", "Additional Special Requests")}</Label>
        <Textarea
          id="special_requests"
          placeholder={t("pref.any_other_preferences_or_requirements", "Any other preferences or requirements...")}
          defaultValue={initialData?.special_requests}
          onChange={(e) => updateField('special_requests', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
        <Checkbox
          id="auto_booking_enabled"
          defaultChecked={initialData?.auto_booking_enabled}
          onCheckedChange={(checked) => updateField('auto_booking_enabled', checked)}
        />
        <Label htmlFor="auto_booking_enabled" className="cursor-pointer text-sm">
          Enable Auto-Booking (AI will automatically book based on your preferences)
        </Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1" size="lg" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save All Preferences"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={exportToPDF} className="gap-2">
          <FileDown className="h-4 w-4" />
          Export PDF
        </Button>
      </div>
    </form>
  );
}
