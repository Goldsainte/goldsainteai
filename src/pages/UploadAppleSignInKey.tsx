import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Upload } from "lucide-react";

const UploadAppleSignInKey = () => {
  const { toast } = useToast();
  const [p8File, setP8File] = useState<File | null>(null);
  const [p8Content, setP8Content] = useState<string>("");
  const [keyId, setKeyId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [servicesId, setServicesId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleP8FileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.p8')) {
        toast({
          title: "Invalid file type",
          description: "Please select a .p8 file",
          variant: "destructive",
        });
        return;
      }

      setP8File(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setP8Content(content);
      };
      reader.readAsText(file);
    }
  };

  const handleUploadAll = async () => {
    if (!p8Content || !keyId || !teamId || !servicesId) {
      toast({
        title: "Missing information",
        description: "Please provide the .p8 file, Key ID, Team ID, and Services ID",
        variant: "destructive",
      });
      return;
    }

    if (keyId.length !== 10) {
      toast({
        title: "Invalid Key ID",
        description: "Key ID must be exactly 10 characters",
        variant: "destructive",
      });
      return;
    }

    if (teamId.length !== 10) {
      toast({
        title: "Invalid Team ID",
        description: "Team ID must be exactly 10 characters",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload credentials",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('apple_signin_credentials')
        .upsert({
          user_id: user.id,
          p8_key: p8Content,
          key_id: keyId,
          team_id: teamId,
          services_id: servicesId,
        });

      if (error) throw error;

      setUploadComplete(true);
      toast({
        title: "Success!",
        description: "Apple Sign-In credentials saved successfully",
      });
    } catch (error) {
      console.error('Error uploading credentials:', error);
      toast({
        title: "Upload failed",
        description: "Failed to save credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadComplete) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle className="text-green-900">Credentials Saved!</CardTitle>
            </div>
            <CardDescription className="text-green-700">
              Your Apple Sign-In credentials have been securely stored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800">
              Apple Sign-In is now configured for your application. Users can now sign in using their Apple ID.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload Sign in with Apple Credentials</CardTitle>
          <CardDescription>
            Upload your Apple Developer credentials to enable Sign in with Apple
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="p8-file">P8 Private Key File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="p8-file"
                type="file"
                accept=".p8"
                onChange={handleP8FileChange}
                className="flex-1"
              />
              {p8File && (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The .p8 file downloaded from Apple Developer Console
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="key-id">Key ID</Label>
            <Input
              id="key-id"
              type="text"
              placeholder="Enter 10-character Key ID"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Found in Apple Developer Console under Keys
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-id">Team ID</Label>
            <Input
              id="team-id"
              type="text"
              placeholder="Enter 10-character Team ID"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Found in Apple Developer Console under Membership
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="services-id">Services ID (Client ID)</Label>
            <Input
              id="services-id"
              type="text"
              placeholder="e.g., com.goldsainte.signin"
              value={servicesId}
              onChange={(e) => setServicesId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The identifier configured for Sign in with Apple in Apple Developer Console
            </p>
          </div>

          <Button
            onClick={handleUploadAll}
            disabled={!p8Content || !keyId || !teamId || !servicesId || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Save Credentials
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadAppleSignInKey;
