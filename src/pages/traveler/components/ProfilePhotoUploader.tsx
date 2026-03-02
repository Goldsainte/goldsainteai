import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfilePhotoUploaderProps {
  userId: string;
  currentAvatarUrl?: string | null;
  displayName?: string;
  onUploadComplete: (url: string) => void;
  size?: "sm" | "md" | "lg";
}

export function ProfilePhotoUploader({
  userId,
  currentAvatarUrl,
  displayName,
  onUploadComplete,
  size = "lg",
}: ProfilePhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate userId is present
    if (!userId) {
      console.error("Cannot upload photo: userId is empty");
      toast.error("Profile not loaded yet. Please wait and try again.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Image must be less than 50MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || 'jpg';
      // Use simple path format that matches RLS policy: userId/filename
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      console.log("[ProfilePhotoUploader] Uploading to path:", fileName);
      console.log("[ProfilePhotoUploader] File size:", file.size, "bytes");
      console.log("[ProfilePhotoUploader] File type:", file.type);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '3600',
          contentType: file.type 
        });

      if (uploadError) {
        console.error("[ProfilePhotoUploader] Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("[ProfilePhotoUploader] Upload successful:", uploadData);

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      console.log("[ProfilePhotoUploader] Public URL:", urlData.publicUrl);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", userId);

      if (updateError) {
        console.error("[ProfilePhotoUploader] Profile update error:", updateError);
        throw updateError;
      }

      onUploadComplete(urlData.publicUrl);
      toast.success("Profile photo updated");
    } catch (error: any) {
      console.error("[ProfilePhotoUploader] Full error:", error);
      const errorMessage = error?.message || error?.error_description || "Failed to upload photo";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-[#E5DFC6]`}>
          <AvatarImage src={currentAvatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="bg-[#F6F0E4] text-[#0a2225] text-xl font-secondary">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4]"
      >
        {uploading ? "Uploading..." : "Change Photo"}
      </Button>
    </div>
  );
}
