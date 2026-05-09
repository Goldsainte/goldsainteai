import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, Loader2, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface UploadedPhoto {
  url: string;
  name: string;
}

interface StoryboardPhotoUploaderProps {
  onPhotosUploaded: (urls: string[]) => void;
}

const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export function StoryboardPhotoUploader({ onPhotosUploaded }: StoryboardPhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!VALID_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Invalid format. Use JPEG, PNG, WebP, or GIF`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: Too large. Max 50MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setProgress({ current: 0, total: validFiles.length });
    const newPhotos: UploadedPhoto[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setProgress({ current: i + 1, total: validFiles.length });

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `storyboard-uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error } = await supabase.storage
          .from("trip-assets")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("trip-assets")
          .getPublicUrl(fileName);

        newPhotos.push({ url: urlData.publicUrl, name: file.name });
      } catch (err: any) {
        console.error("Upload error:", err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (newPhotos.length > 0) {
      setUploadedPhotos((prev) => [...prev, ...newPhotos]);
      onPhotosUploaded(newPhotos.map((p) => p.url));
      toast.success(`${newPhotos.length} photo${newPhotos.length > 1 ? "s" : ""} uploaded!`);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      {/* Upload area */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs font-medium">
              Uploading {progress.current} of {progress.total}...
            </span>
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm font-medium">Upload your travel photos</span>
            <span className="text-xs">JPEG, PNG, WebP or GIF · Max 50MB each</span>
          </>
        )}
      </button>

      {/* Uploaded photos preview */}
      {uploadedPhotos.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {uploadedPhotos.map((photo, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden">
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-24 object-cover"
              loading="lazy"/>
              <div className="absolute top-1 right-1 flex gap-1">
                <CheckCircle className="h-4 w-4 text-green-400 drop-shadow" />
                <button
                  onClick={() => removePhoto(idx)}
                  className="h-5 w-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
