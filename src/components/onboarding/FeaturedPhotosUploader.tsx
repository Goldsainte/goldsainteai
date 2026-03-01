import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedPhotosUploaderProps {
  userId: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function FeaturedPhotosUploader({
  userId,
  photos,
  onPhotosChange,
  maxPhotos = 6,
}: FeaturedPhotosUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setIsUploading(true);
    const newPhotos: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/portfolio/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        newPhotos.push(publicUrl);
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
        toast.success(`${newPhotos.length} photo(s) uploaded`);
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Failed to upload photos");
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden border border-[#E5DFC6] group"
          >
            <img
              src={photo}
              alt={`Portfolio ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-[#C7A962] animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-[#C7A962]" />
                <span className="text-xs text-[#6B7280]">Add Photo</span>
              </>
            )}
          </label>
        )}
      </div>

      <p className="text-xs text-[#6B7280] text-center">
        {photos.length}/{maxPhotos} photos • These showcase your best travel content
      </p>
    </div>
  );
}
