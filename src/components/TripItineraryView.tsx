import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, DollarSign, Utensils, Calendar, Download } from 'lucide-react';

interface Activity {
  time: string;
  activity: string;
  location: string;
  estimatedCost: number;
  duration: string;
  notes: string;
}

interface RestaurantSuggestion {
  name: string;
  cuisine: string;
  priceRange: string;
  location: string;
  estimatedCost: number;
}

interface DailyItinerary {
  day: number;
  date: string;
  theme: string;
  morning: Activity;
  afternoon: Activity;
  evening: Activity;
  meals: {
    breakfast: RestaurantSuggestion;
    lunch: RestaurantSuggestion;
    dinner: RestaurantSuggestion;
  };
  transportation: {
    method: string;
    estimatedCost: number;
    notes: string;
  };
  totalDayCost: number;
  alternatives?: Activity[];
}

interface ItineraryOverview {
  totalCost: number;
  highlights: string[];
  packingTips: string[];
  localTips: string[];
}

interface TripItineraryViewProps {
  itinerary: DailyItinerary[];
  overview?: ItineraryOverview;
  destination: string;
}

export const TripItineraryView = ({ itinerary, overview, destination }: TripItineraryViewProps) => {
  const handleDownload = () => {
    // TODO: Implement PDF export
    console.log('Downloading itinerary...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Your {destination} Itinerary</h2>
          <p className="text-muted-foreground">{itinerary.length} days of adventure</p>
        </div>
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {overview && (
        <Card>
          <CardHeader>
            <CardTitle>Trip Overview</CardTitle>
            <CardDescription>Estimated total: ${overview.totalCost.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.highlights.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Highlights</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {overview.highlights.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {itinerary.map((day, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Day {day.day} - {day.theme}
                </CardTitle>
                <CardDescription>{day.date}</CardDescription>
              </div>
              <Badge variant="outline">${day.totalDayCost.toLocaleString()}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Morning */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">Morning - {day.morning.time}</span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="font-medium">{day.morning.activity}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {day.morning.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {day.morning.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${day.morning.estimatedCost}
                  </span>
                </div>
                {day.morning.notes && <p className="text-sm text-muted-foreground">{day.morning.notes}</p>}
              </div>
            </div>

            {/* Lunch */}
            <div className="pl-6 py-2 border-l-2 border-secondary">
              <div className="flex items-center gap-2 text-sm">
                <Utensils className="h-4 w-4" />
                <span className="font-medium">{day.meals.lunch.name}</span>
                <Badge variant="secondary">{day.meals.lunch.priceRange}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {day.meals.lunch.cuisine} • {day.meals.lunch.location} • ${day.meals.lunch.estimatedCost}
              </p>
            </div>

            <Separator />

            {/* Afternoon */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">Afternoon - {day.afternoon.time}</span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="font-medium">{day.afternoon.activity}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {day.afternoon.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {day.afternoon.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${day.afternoon.estimatedCost}
                  </span>
                </div>
                {day.afternoon.notes && <p className="text-sm text-muted-foreground">{day.afternoon.notes}</p>}
              </div>
            </div>

            {/* Dinner */}
            <div className="pl-6 py-2 border-l-2 border-secondary">
              <div className="flex items-center gap-2 text-sm">
                <Utensils className="h-4 w-4" />
                <span className="font-medium">{day.meals.dinner.name}</span>
                <Badge variant="secondary">{day.meals.dinner.priceRange}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {day.meals.dinner.cuisine} • {day.meals.dinner.location} • ${day.meals.dinner.estimatedCost}
              </p>
            </div>

            <Separator />

            {/* Evening */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">Evening - {day.evening.time}</span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="font-medium">{day.evening.activity}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {day.evening.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {day.evening.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${day.evening.estimatedCost}
                  </span>
                </div>
                {day.evening.notes && <p className="text-sm text-muted-foreground">{day.evening.notes}</p>}
              </div>
            </div>

            {/* Alternatives */}
            {day.alternatives && day.alternatives.length > 0 && (
              <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Backup Options</p>
                <div className="space-y-2">
                  {day.alternatives.map((alt, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">
                      • {alt.activity} ({alt.location})
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
