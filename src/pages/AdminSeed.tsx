import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";

const AdminSeed = () => {
  const [loading, setLoading] = useState(false);
  const [numCreators, setNumCreators] = useState(15);
  const [result, setResult] = useState<any>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('seed-content-creators', {
        body: { numCreators }
      });

      if (error) throw error;

      setResult(data);
      toast.success(`Successfully seeded ${data.stats.profiles} creators with ${data.stats.posts} posts!`);
    } catch (error: any) {
      console.error('Seeding error:', error);
      toast.error(error.message || 'Failed to seed content creators');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Content Creator Seeding
          </CardTitle>
          <CardDescription>
            Populate your database with realistic content creators, travel posts, and profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="numCreators">Number of Creators</Label>
            <Input
              id="numCreators"
              type="number"
              min={1}
              max={50}
              value={numCreators}
              onChange={(e) => setNumCreators(parseInt(e.target.value))}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Each creator will get 6-10 travel posts, follower relationships, and 2-3 collections
            </p>
          </div>

          <Button 
            onClick={handleSeed} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Database...
              </>
            ) : (
              'Seed Content Creators'
            )}
          </Button>

          {result && (
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-lg">Seeding Complete!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Profiles Created</p>
                    <p className="text-2xl font-bold">{result.stats.profiles}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Posts Created</p>
                    <p className="text-2xl font-bold">{result.stats.posts}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Follower Relationships</p>
                    <p className="text-2xl font-bold">{result.stats.follows}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Collections Created</p>
                    <p className="text-2xl font-bold">{result.stats.collections}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">What gets created:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Realistic creator profiles with bios, locations, and social links</li>
              <li>6-10 travel posts per creator with images from Unsplash</li>
              <li>Engagement metrics (likes, views, comments, shares)</li>
              <li>Follower relationships between creators</li>
              <li>2-3 featured collections per creator</li>
              <li>Posts distributed across last 6 months</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSeed;
