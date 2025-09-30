import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlightCard } from '@/components/FlightCard';
import { SimplePropertyCard } from '@/components/SimplePropertyCard';
import { RestaurantCard } from '@/components/RestaurantCard';
import { Loader2, Heart } from 'lucide-react';

const Favorites = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { favorites, isLoading: favLoading } = useFavorites();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || favLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const flights = favorites.filter(f => f.favorite_type === 'flight');
  const hotels = favorites.filter(f => f.favorite_type === 'hotel');
  const restaurants = favorites.filter(f => f.favorite_type === 'restaurant');

  return (
    <main className="flex-1 bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            My Favorites
          </h1>
        </div>

        {favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No favorites yet</h2>
            <p className="text-muted-foreground">
              Start adding your favorite flights, hotels, and restaurants to see them here!
            </p>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-background">
              <TabsTrigger value="all">All ({favorites.length})</TabsTrigger>
              <TabsTrigger value="flights">Flights ({flights.length})</TabsTrigger>
              <TabsTrigger value="hotels">Hotels ({hotels.length})</TabsTrigger>
              <TabsTrigger value="restaurants">Restaurants ({restaurants.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6 mt-6">
              {flights.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">✈️ Flights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flights.map((fav) => (
                      <FlightCard
                        key={fav.id}
                        flight={fav.favorite_data.flight}
                        dictionaries={fav.favorite_data.dictionaries}
                      />
                    ))}
                  </div>
                </div>
              )}

              {hotels.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">🏨 Hotels</h2>
                  <div className="space-y-4">
                    {hotels.map((fav) => (
                      <SimplePropertyCard
                        key={fav.id}
                        property={fav.favorite_data}
                        type="hotels"
                      />
                    ))}
                  </div>
                </div>
              )}

              {restaurants.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">🍽️ Restaurants</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {restaurants.map((fav) => (
                      <RestaurantCard
                        key={fav.id}
                        {...fav.favorite_data}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="flights" className="mt-6">
              {flights.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No favorite flights yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flights.map((fav) => (
                    <FlightCard
                      key={fav.id}
                      flight={fav.favorite_data.flight}
                      dictionaries={fav.favorite_data.dictionaries}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="hotels" className="mt-6">
              {hotels.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No favorite hotels yet</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {hotels.map((fav) => (
                    <SimplePropertyCard
                      key={fav.id}
                      property={fav.favorite_data}
                      type="hotels"
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="restaurants" className="mt-6">
              {restaurants.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No favorite restaurants yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restaurants.map((fav) => (
                    <RestaurantCard
                      key={fav.id}
                      {...fav.favorite_data}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
};

export default Favorites;
