import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Tag, User } from "lucide-react";

const creatorProfileSchema = z.object({
  display_name: z.string().min(2, "Display name must be at least 2 characters").optional(),
  handle: z.string().min(3, "Handle must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Handle can only contain letters, numbers, and underscores").optional(),
  avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  primary_niches: z.string().optional(),
  primary_regions: z.string().optional(),
  tiktok_handle: z.string().optional(),
  tiktok_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type CreatorProfileForm = z.infer<typeof creatorProfileSchema>;

export function CreatorProfileSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<CreatorProfileForm>({
    resolver: zodResolver(creatorProfileSchema),
    defaultValues: {
      display_name: "",
      handle: "",
      avatar_url: "",
      bio: "",
      primary_niches: "",
      primary_regions: "",
      tiktok_handle: "",
      tiktok_url: "",
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        reset({
          display_name: data.display_name || "",
          handle: data.handle || "",
          avatar_url: data.avatar_url || "",
          bio: data.bio || "",
          primary_niches: data.primary_niches?.join(", ") || "",
          primary_regions: data.primary_regions?.join(", ") || "",
          tiktok_handle: data.tiktok_handle || "",
          tiktok_url: data.tiktok_url || "",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CreatorProfileForm) => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      const payload = {
        displayName: data.display_name || undefined,
        handle: data.handle || undefined,
        avatarUrl: data.avatar_url || undefined,
        bio: data.bio || undefined,
        primaryNiches: data.primary_niches 
          ? data.primary_niches.split(",").map(n => n.trim()).filter(Boolean) 
          : undefined,
        primaryRegions: data.primary_regions 
          ? data.primary_regions.split(",").map(r => r.trim()).filter(Boolean) 
          : undefined,
        tiktokHandle: data.tiktok_handle || undefined,
        tiktokUrl: data.tiktok_url || undefined,
      };

      const { data: result, error } = await invokeWithAuth(
        "upsert-creator-profile",
        { body: payload }
      );

      if (error) {
        // Check for specific handle taken error
        if (error.includes("HANDLE_TAKEN") || error.includes("handle is already taken")) {
          toast({
            variant: "destructive",
            title: "Handle unavailable",
            description: "That handle is already taken. Please choose another.",
          });
          return;
        }
        
        throw new Error(error);
      }

      toast({
        title: "Profile updated",
        description: "Your public creator profile has been saved.",
      });
      
      // Reload to show updated data
      await loadProfile();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving profile",
        description: error.message || "Failed to save profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const nichesArray = watchedValues.primary_niches?.split(",").map(n => n.trim()).filter(Boolean) || [];
  const regionsArray = watchedValues.primary_regions?.split(",").map(r => r.trim()).filter(Boolean) || [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Public Creator Profile</CardTitle>
            <CardDescription>
              Manage how you appear to agents and on trip pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  placeholder="Your public name"
                  {...register("display_name")}
                />
                {errors.display_name && (
                  <p className="text-sm text-destructive">{errors.display_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="handle">Handle</Label>
                <Input
                  id="handle"
                  placeholder="yourhandle"
                  {...register("handle")}
                />
                {errors.handle && (
                  <p className="text-sm text-destructive">{errors.handle.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Your unique URL will be: /creator/@{watchedValues.handle || "yourhandle"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  placeholder="https://example.com/avatar.jpg"
                  {...register("avatar_url")}
                />
                {errors.avatar_url && (
                  <p className="text-sm text-destructive">{errors.avatar_url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell agents about yourself and your travel style..."
                  rows={4}
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {watchedValues.bio?.length || 0}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_niches">Primary Niches</Label>
                <Input
                  id="primary_niches"
                  placeholder="Adventure, Luxury, Budget Travel"
                  {...register("primary_niches")}
                />
                <p className="text-xs text-muted-foreground">
                  Separate niches with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_regions">Primary Regions</Label>
                <Input
                  id="primary_regions"
                  placeholder="Europe, Asia, South America"
                  {...register("primary_regions")}
                />
                <p className="text-xs text-muted-foreground">
                  Separate regions with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok_handle">TikTok Handle</Label>
                <Input
                  id="tiktok_handle"
                  placeholder="@yourhandle"
                  {...register("tiktok_handle")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok_url">TikTok Profile URL</Label>
                <Input
                  id="tiktok_url"
                  placeholder="https://tiktok.com/@yourhandle"
                  {...register("tiktok_url")}
                />
                {errors.tiktok_url && (
                  <p className="text-sm text-destructive">{errors.tiktok_url.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Preview</CardTitle>
            <CardDescription>
              How your profile will appear publicly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={watchedValues.avatar_url || ""} />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h3 className="text-xl font-semibold">
                  {watchedValues.display_name || "Creator Name"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{watchedValues.handle || "handle"}
                </p>
                {watchedValues.tiktok_handle && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <span>TikTok:</span>
                    <span>{watchedValues.tiktok_handle}</span>
                  </p>
                )}
              </div>
            </div>

            {watchedValues.bio && (
              <div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {watchedValues.bio}
                </p>
              </div>
            )}

            {nichesArray.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>Niches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nichesArray.map((niche, index) => (
                    <Badge key={index} variant="secondary">
                      {niche}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {regionsArray.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Regions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {regionsArray.map((region, index) => (
                    <Badge key={index} variant="outline">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
