import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Thermometer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WeatherDay {
  date: { year: number; month: number; day: number };
  temperature: {
    minTemperature: { value: number; unit: string };
    maxTemperature: { value: number; unit: string };
  };
  condition: {
    description: string;
    icon?: string;
  };
  precipitation?: {
    probability: number;
  };
  humidity?: number;
  windSpeed?: {
    value: number;
    unit: string;
  };
}

interface WeatherForecastProps {
  tripId: string;
}

export const WeatherForecast = ({ tripId }: WeatherForecastProps) => {
  const [forecasts, setForecasts] = useState<WeatherDay[]>([]);
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWeather();
  }, [tripId]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-weather-forecast', {
        body: { tripId }
      });

      if (error) throw error;

      setForecasts(data.forecasts || []);
      setLocation(data.location || "");
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast({
        title: "Weather unavailable",
        description: "Could not load weather forecast for this destination",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('rain') || desc.includes('shower')) return <CloudRain className="h-8 w-8" />;
    if (desc.includes('snow')) return <CloudSnow className="h-8 w-8" />;
    if (desc.includes('cloud') || desc.includes('overcast')) return <Cloud className="h-8 w-8" />;
    if (desc.includes('clear') || desc.includes('sunny')) return <Sun className="h-8 w-8" />;
    return <Cloud className="h-8 w-8" />;
  };

  const formatDate = (date: { year: number; month: number; day: number }) => {
    return new Date(date.year, date.month - 1, date.day).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const convertToFahrenheit = (celsius: number) => {
    return Math.round((celsius * 9/5) + 32);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Weather Forecast</h3>
        </div>
        <p className="text-muted-foreground">Loading weather data...</p>
      </Card>
    );
  }

  if (forecasts.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Weather Forecast</h3>
        </div>
        <p className="text-muted-foreground">No weather data available for {location}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Cloud className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Weather Forecast</h3>
        {location && <span className="text-sm text-muted-foreground">for {location}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecasts.map((forecast, index) => (
          <Card key={index} className="p-4 bg-muted/50">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{formatDate(forecast.date)}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {forecast.condition.description}
                  </p>
                </div>
                <div className="text-primary">
                  {getWeatherIcon(forecast.condition.description)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-2 text-sm">
                  <span className="font-medium">
                    {Math.round(forecast.temperature.maxTemperature.value)}°C
                  </span>
                  <span className="text-muted-foreground">
                    / {Math.round(forecast.temperature.minTemperature.value)}°C
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  ({convertToFahrenheit(forecast.temperature.maxTemperature.value)}°F 
                  / {convertToFahrenheit(forecast.temperature.minTemperature.value)}°F)
                </span>
              </div>

              {forecast.precipitation && (
                <div className="flex items-center gap-2 text-sm">
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                  <span>{Math.round(forecast.precipitation.probability * 100)}% chance of rain</span>
                </div>
              )}

              {forecast.windSpeed && (
                <div className="flex items-center gap-2 text-sm">
                  <Wind className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {Math.round(forecast.windSpeed.value)} {forecast.windSpeed.unit}
                  </span>
                </div>
              )}

              {forecast.humidity && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Droplets className="h-4 w-4" />
                  <span>{forecast.humidity}% humidity</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Packing tip:</strong> Check the forecast above to plan what to bring for your trip!
        </p>
      </div>
    </Card>
  );
};
