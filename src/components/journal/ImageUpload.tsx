import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  bucket?: string;
}

export function ImageUpload({
  onImageUploaded,
  currentImageUrl,
  bucket = "journal-images",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be signed in to upload images");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      setImageUrl(publicUrl);
      onImageUploaded(publicUrl);

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setImageUrl("");
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-full h-64 object-cover rounded-xl"
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="absolute top-2 right-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-64 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload image
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP (max 10MB)
              </p>
            </>
          )}
        </button>
      )}
    </div>
  );
}
