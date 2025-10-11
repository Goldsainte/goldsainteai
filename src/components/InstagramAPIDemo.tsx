import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Instagram } from "lucide-react";

export const InstagramAPIDemo = () => {
  const [username, setUsername] = useState("");
  const [endpoint, setEndpoint] = useState("user");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fetchInstagramData = async () => {
    if (!username && endpoint !== 'media') {
      toast.error("Please enter an Instagram username");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('instagram-api', {
        body: { endpoint, username, mediaId: username }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data.data);
      toast.success("Data fetched successfully!");
    } catch (error: any) {
      console.error('Instagram API error:', error);
      toast.error(error.message || "Failed to fetch Instagram data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-6 w-6" />
            Instagram Premium API
          </CardTitle>
          <CardDescription>
            Fetch Instagram data using RapidAPI's Instagram Premium API 2023
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint</Label>
            <Select value={endpoint} onValueChange={setEndpoint}>
              <SelectTrigger id="endpoint">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User Profile</SelectItem>
                <SelectItem value="posts">User Posts</SelectItem>
                <SelectItem value="followers">Followers</SelectItem>
                <SelectItem value="following">Following</SelectItem>
                <SelectItem value="media">Single Post</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">
              {endpoint === 'media' ? 'Post URL/ID' : 'Instagram Username'}
            </Label>
            <Input
              id="username"
              placeholder={endpoint === 'media' ? 'Post URL or ID' : '@username'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <Button onClick={fetchInstagramData} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              'Fetch Data'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
