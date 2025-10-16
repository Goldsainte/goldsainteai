import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Users, Trash2, AlertTriangle } from "lucide-react";

const AdminSeed = () => {
  const [loading, setLoading] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [numCreators, setNumCreators] = useState(15);
  const [seedMode, setSeedMode] = useState<'new' | 'hybrid'>('new');
  const [result, setResult] = useState<any>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);

  const handleSeed = async (skipCheck = false) => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('seed-content-creators', {
        body: { numCreators, mode: seedMode, skipCheck }
      });

      if (error) throw error;

      // Check for warning
      if (data?.warning && !skipCheck) {
        setExistingData(data.existing);
        setShowWarning(true);
        setLoading(false);
        return;
      }

      setResult(data);
      const message = seedMode === 'hybrid' 
        ? `Successfully added content! ${data.stats.posts} new posts created.`
        : `Successfully seeded ${data.stats.profiles} creators with ${data.stats.posts} posts!`;
      toast.success(message);
    } catch (error: any) {
      console.error('Seeding error:', error);
      toast.error(error.message || 'Failed to seed content creators');
    } finally {
      setLoading(false);
    }
  };

  const proceedWithSeeding = () => {
    setShowWarning(false);
    handleSeed(true);
  };

  const handleClearData = async () => {
    setClearingData(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('clear-seeded-data', {
        body: { confirmToken: 'DELETE_ALL_SEEDED_DATA' }
      });

      if (error) throw error;

      toast.success(`Cleared ${data.deleted.profiles} profiles, ${data.deleted.posts} posts, and ${data.deleted.follows} follows`);
      setResult(null);
      setShowClearDialog(false);
    } catch (error: any) {
      console.error('Clear error:', error);
      toast.error(error.message || 'Failed to clear seeded data');
    } finally {
      setClearingData(false);
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seeding Mode</Label>
              <RadioGroup value={seedMode} onValueChange={(value: 'new' | 'hybrid') => setSeedMode(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new" className="font-normal cursor-pointer">
                    Create New Creators Only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="hybrid" />
                  <Label htmlFor="hybrid" className="font-normal cursor-pointer">
                    Add to Existing + Create New (70% enhance / 30% new)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numCreators">
                {seedMode === 'hybrid' ? 'Total Content Volume' : 'Number of Creators'}
              </Label>
              <Input
                id="numCreators"
                type="number"
                min={1}
                max={50}
                value={numCreators}
                onChange={(e) => setNumCreators(parseInt(e.target.value))}
                disabled={loading || clearingData}
              />
              <p className="text-sm text-muted-foreground">
                {seedMode === 'hybrid' 
                  ? 'Will add 3-5 posts to existing creators and create some new ones'
                  : 'Each creator will get 6-10 travel posts, follower relationships, and 2-3 collections'
                }
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => handleSeed(false)} 
              disabled={loading || clearingData}
              className="flex-1"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Database...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Seed Content Creators
                </>
              )}
            </Button>

            <Button 
              variant="destructive"
              onClick={() => setShowClearDialog(true)}
              disabled={loading || clearingData}
              size="lg"
            >
              {clearingData ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>

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

      {/* Warning Dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Seeded Data Already Exists
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Your database already contains seeded content:</p>
              {existingData && (
                <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                  <p>• {existingData.profiles} creator profiles</p>
                  <p>• {existingData.posts} travel posts</p>
                  <p>• {existingData.collections} collections</p>
                </div>
              )}
              <p className="text-sm">
                You can either switch to <strong>Hybrid Mode</strong> to add content to existing creators,
                or <strong>Clear All Data</strong> and start fresh.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => {
              setShowWarning(false);
              setSeedMode('hybrid');
            }}>
              Switch to Hybrid Mode
            </Button>
            <AlertDialogAction onClick={proceedWithSeeding}>
              Proceed Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Data Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Clear All Seeded Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all creator profiles, travel posts, collections, and follow relationships that were created by the seeding tool.
              <br /><br />
              <strong>This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90">
              Yes, Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSeed;
