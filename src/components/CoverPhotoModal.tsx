import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface CoverPhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentCoverUrl: string | null;
  onSuccess: () => void;
}

export const CoverPhotoModal = ({
  open,
  onOpenChange,
  userId,
  currentCoverUrl,
  onSuccess,
}: CoverPhotoModalProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUploadPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error('Image must be less than 50MB');
        return;
      }

      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/cover/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ cover_image_url: publicUrl })
          .eq('id', userId);

        if (updateError) throw updateError;

        toast.success('Cover photo updated!');
        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        console.error('Error uploading cover photo:', error);
        toast.error(error.message || 'Failed to upload cover photo');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ cover_image_url: null })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Cover photo removed');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error removing cover photo:', error);
      toast.error('Failed to remove cover photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <div className="border-b">
          <h2 className="text-center py-4 font-semibold">Change Cover Photo</h2>
          <p className="text-center text-xs text-[#6B7280] pb-3 px-6">
            A wide, well-lit photo from a recent trip performs best. Recommended at least 1600&times;600px.
          </p>
        </div>

        <div className="flex flex-col">
          <Button
            variant="ghost"
            className="h-12 rounded-none text-blue-500 hover:text-blue-600 hover:bg-transparent font-semibold"
            onClick={handleUploadPhoto}
            disabled={uploading}
          >
            Upload Photo
          </Button>

          {currentCoverUrl && (
            <Button
              variant="ghost"
              className="h-12 rounded-none text-red-500 hover:text-red-600 hover:bg-transparent font-semibold border-t"
              onClick={handleRemovePhoto}
              disabled={uploading}
            >
              Remove Current Photo
            </Button>
          )}

          <Button
            variant="ghost"
            className="h-12 rounded-none hover:bg-transparent border-t"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
