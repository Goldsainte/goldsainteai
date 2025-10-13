import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";

export default function UploadEmailAssets() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [heroUrl, setHeroUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("email-assets")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from("email-assets")
      .getPublicUrl(path);
    
    return publicUrl;
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast({
        title: "No file selected",
        description: "Please select the logo file first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const url = await uploadFile(logoFile, "logo-horizontal-green.png");
      setLogoUrl(url);
      toast({
        title: "Logo uploaded successfully!",
        description: url,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadHero = async () => {
    if (!heroFile) {
      toast({
        title: "No file selected",
        description: "Please select the hero image file first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const url = await uploadFile(heroFile, "email-hero-password-reset.jpg");
      setHeroUrl(url);
      toast({
        title: "Hero image uploaded successfully!",
        description: url,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Email Assets</h1>
        <p className="text-muted-foreground">
          Upload the logo and hero image for password reset emails
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo Image
            </CardTitle>
            <CardDescription>
              Upload logo-horizontal-green.png from your public folder
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logo-file">Select Logo File</Label>
              <Input
                id="logo-file"
                type="file"
                accept="image/png"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>
            <Button 
              onClick={handleUploadLogo} 
              disabled={uploading || !logoFile}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload Logo"}
            </Button>
            {logoUrl && (
              <div className="flex items-start gap-2 p-3 bg-success/10 border border-success/20 rounded-md">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Upload successful!</p>
                  <p className="text-xs text-muted-foreground break-all">{logoUrl}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Hero Image
            </CardTitle>
            <CardDescription>
              Upload email-hero-password-reset.jpg from your public folder
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hero-file">Select Hero Image File</Label>
              <Input
                id="hero-file"
                type="file"
                accept="image/jpeg,image/jpg"
                onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>
            <Button 
              onClick={handleUploadHero} 
              disabled={uploading || !heroFile}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload Hero Image"}
            </Button>
            {heroUrl && (
              <div className="flex items-start gap-2 p-3 bg-success/10 border border-success/20 rounded-md">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Upload successful!</p>
                  <p className="text-xs text-muted-foreground break-all">{heroUrl}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {(logoUrl || heroUrl) && (
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-2">Images uploaded successfully!</p>
                  <p className="text-muted-foreground">
                    Once both images are uploaded, the password reset email function will be updated automatically to use these new URLs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
