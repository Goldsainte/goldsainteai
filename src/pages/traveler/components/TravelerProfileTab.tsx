import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  username?: string | null;
  bio?: string | null;
  email?: string | null;
  phone_number?: string | null;
  home_base?: string | null;
  avatar_url?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  website_url?: string | null;
}

interface TravelerProfileTabProps {
  profile: ProfileData | null;
  onProfileUpdate: (updates: Partial<ProfileData>) => void;
}

export function TravelerProfileTab({ profile, onProfileUpdate }: TravelerProfileTabProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    display_name: profile?.display_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    phone_number: profile?.phone_number || "",
    home_base: profile?.home_base || "",
    instagram_handle: profile?.instagram_handle || "",
    tiktok_handle: profile?.tiktok_handle || "",
    website_url: profile?.website_url || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

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
          phone_number: formData.phone_number || null,
          home_base: formData.home_base || null,
          instagram_handle: formData.instagram_handle || null,
          tiktok_handle: formData.tiktok_handle || null,
          website_url: formData.website_url || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      onProfileUpdate(formData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

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
            onUploadComplete={(url) => onProfileUpdate({ avatar_url: url })}
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
              <Label htmlFor="phone_number" className="text-[#0a2225]">Phone Number</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleInputChange("phone_number", e.target.value)}
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
            <Label htmlFor="website_url" className="text-[#0a2225]">Website</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) => handleInputChange("website_url", e.target.value)}
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
