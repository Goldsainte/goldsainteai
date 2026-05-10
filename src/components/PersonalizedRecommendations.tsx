import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin, DollarSign, Calendar, Heart, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Experience {
  name: string;
  category: string;
  description: string;
}

interface Recommendation {
  destination: string;
  destinationCode: string;
  confidence: number;
  reason: string;
  highlights: string[];
  bestTime: string;
  estimatedBudget: {
    min: number;
    max: number;
    currency: string;
  };
  experiences: Experience[];
  similar_to: string;
}

export const PersonalizedRecommendations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke(
        'get-personalized-recommendations',
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      );

      if (functionError) throw functionError;

      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Failed to load recommendations');
      toast({
        title: 'Error',
        description: 'Failed to load personalized recommendations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      adventure: 'bg-orange-500',
      culture: 'bg-purple-500',
      relaxation: 'bg-[#0c4d47]',
      food: 'bg-green-500',
      nightlife: 'bg-pink-500',
      nature: 'bg-emerald-500'
    };
    return colors[category.toLowerCase()] || 'bg-gray-500';
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Sign in to see personalized travel recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Analyzing your travel preferences...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-destructive mb-4">{error}</p>
          <Button onClick={fetchRecommendations} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground mb-4">
            Start searching and booking trips to get personalized recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Personalized For You</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {recommendations.map((rec, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {rec.destination}
                  </CardTitle>
                  <CardDescription className="mt-2">{rec.reason}</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {rec.confidence}% match
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Budget */}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>
                  ${rec.estimatedBudget.min.toLocaleString()} - ${rec.estimatedBudget.max.toLocaleString()} {rec.estimatedBudget.currency}
                </span>
              </div>

              {/* Best Time */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{rec.bestTime}</span>
              </div>

              {/* Highlights */}
              <div>
                <p className="text-sm font-semibold mb-2">Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {rec.highlights.map((highlight, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Experiences */}
              <div>
                <p className="text-sm font-semibold mb-2">Recommended Experiences</p>
                <div className="space-y-2">
                  {rec.experiences.slice(0, 3).map((exp, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full ${getCategoryColor(exp.category)} mt-1.5`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{exp.name}</p>
                        <p className="text-xs text-muted-foreground">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Similar to */}
              {rec.similar_to && (
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Based on: {rec.similar_to}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" size="sm">
                  Explore {rec.destinationCode}
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={fetchRecommendations} variant="outline" className="w-full">
        <Sparkles className="h-4 w-4 mr-2" />
        Refresh Recommendations
      </Button>
    </div>
  );
};