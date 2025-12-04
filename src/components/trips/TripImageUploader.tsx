import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface TripImageUploaderProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
  label?: string;
  compact?: boolean;
}

export function TripImageUploader({ currentUrl, onUpload, label, compact }: TripImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, WebP, or GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    try {
      setUploading(true);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `trip-images/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from("trip-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("trip-assets")
        .getPublicUrl(filePath);

      onUpload(urlData.publicUrl);
      toast.success("Image uploaded");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image: " + error.message);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-[4/3] border-2 border-dashed border-[#E5DFC6] rounded-lg flex flex-col items-center justify-center gap-2 text-[#6B7280] hover:border-[#C7A962] hover:text-[#C7A962] transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">Add Image</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {currentUrl ? (
        <div className="relative group">
          <img
            src={currentUrl}
            alt="Cover"
            className="w-full max-w-md aspect-video object-cover rounded-lg border border-[#E5DFC6]"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Replace"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onUpload("")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full max-w-md aspect-video border-2 border-dashed border-[#E5DFC6] rounded-lg flex flex-col items-center justify-center gap-3 text-[#6B7280] hover:border-[#C7A962] hover:text-[#C7A962] transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">{label || "Upload Cover Image"}</span>
              <span className="text-xs">JPEG, PNG, WebP or GIF (max 5MB)</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
