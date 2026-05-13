import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isReservedUsername } from "@/lib/reservedUsernames";

interface ProfileData {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  username?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  home_base?: string | null;
  avatar_url?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  website?: string | null;
}

export function TravelerProfileTab() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    username: "",
    bio: "",
    phone: "",
    home_base: "",
    instagram_handle: "",
    tiktok_handle: "",
    website: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("No authenticated user found");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, display_name, username, bio, email, phone, home_base, avatar_url, instagram_handle, tiktok_handle, website")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast.error("Failed to load profile");
          setLoading(false);
          return;
        }

        if (data) {
          setProfile(data);
          setFormData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            display_name: data.display_name || "",
            username: data.username || "",
            bio: data.bio || "",
            phone: data.phone || "",
            home_base: data.home_base || "",
            instagram_handle: data.instagram_handle || "",
            tiktok_handle: data.tiktok_handle || "",
            website: data.website || "",
          });
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
        toast.error("Something went wrong loading your profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    if (isReservedUsername(formData.username)) {
      toast.error("This username is reserved and cannot be used");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          display_name: formData.display_name || null,
          username: formData.username || null,
          bio: formData.bio || null,
          phone: formData.phone || null,
          home_base: formData.home_base || null,
          instagram_handle: formData.instagram_handle || null,
          tiktok_handle: formData.tiktok_handle || null,
          website: formData.website || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...formData });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#C7A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="font-secondary text-xl text-[#0a2225]">Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center pb-8">
          <ProfilePhotoUploader
            userId={profile?.id || ""}
            currentAvatarUrl={profile?.avatar_url}
            displayName={profile?.display_name || "Traveler"}
            onUploadComplete={(url) => setProfile(prev => prev ? { ...prev, avatar_url: url } : null)}
            size="lg"
          />
          <p className="text-sm text-[#6B7280] mt-4 text-center max-w-sm">
            Upload a photo to personalize your profile. Images should be at least 200x200 pixels.
          </p>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="font-secondary text-xl text-[#0a2225]">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-[#0a2225]">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]"
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-[#0a2225]">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-[#0a2225]">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange("display_name", e.target.value)}
                className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]"
                placeholder="How you want to be known"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#0a2225]">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]"
                placeholder="@username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-[#0a2225]">About You</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] min-h-[100px]"
              placeholder="Tell us a bit about yourself and your travel style..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="font-secondary text-xl text-[#0a2225]">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#0a2225]">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ""}
              disabled
              className="border-[#E5DFC6] bg-[#F6F0E4] text-[#6B7280]"
            />
            <p className="text-xs text-[#6B7280]">Email cannot be changed here. Contact support if needed.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#0a2225]">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_base" className="text-[#0a2225]">Location</Label>
              <Input
                id="home_base"
                value={formData.home_base}
                onChange={(e) => handleInputChange("home_base", e.target.value)}
                className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]"
                placeholder="City, Country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Connections */}
      <Card className="bg-white border-[#E5DFC6] rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="font-secondary text-xl text-[#0a2225]">Social Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="instagram_handle" className="text-[#0a2225]">Instagram</Label>
              <Input
                id="instagram_handle"
                value={formData.instagram_handle}
                onChange={(e) => handleInputChange("instagram_handle", e.target.value)}
                className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]"
                placeholder="@instagram_handle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok_handle" className="text-[#0a2225]">TikTok</Label>
              <Input
                id="tiktok_handle"
                value={formData.tiktok_handle}
                onChange={(e) => handleInputChange("tiktok_handle", e.target.value)}
                className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]"
                placeholder="@tiktok_handle"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-[#0a2225]">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962]"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white rounded-full px-8"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
