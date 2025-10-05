import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, X, Download } from "lucide-react";
import { toast } from "sonner";

interface JobFileUploadProps {
  jobId: string;
  attachments: any[];
  onUploadComplete: () => void;
}

export const JobFileUpload = ({ jobId, attachments, onUploadComplete }: JobFileUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    
    // Validate file size (10MB max)
    if (file.size > 10485760) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not supported. Please upload PDF, images, or Word documents.");
      return;
    }

    try {
      setUploading(true);

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${jobId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('job-attachments')
        .getPublicUrl(fileName);

      // Save attachment record
      const { error: dbError } = await supabase
        .from('marketplace_job_attachments')
        .insert({
          job_id: jobId,
          uploaded_by: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type
        });

      if (dbError) throw dbError;

      toast.success("File uploaded successfully");
      onUploadComplete();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (attachmentId: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/job-attachments/');
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('job-attachments')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete record
      const { error: dbError } = await supabase
        .from('marketplace_job_attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) throw dbError;

      toast.success("File deleted");
      onUploadComplete();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Attachments</span>
          <Button
            size="sm"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No attachments yet</p>
            <p className="text-xs mt-1">Upload documents, images, or requirements</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-5 w-5 flex-shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(attachment.file_url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {attachment.uploaded_by === user?.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(attachment.id, attachment.file_url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Accepted formats: PDF, JPG, PNG, WEBP, DOC, DOCX (Max 10MB)
        </p>
      </CardContent>
    </Card>
  );
};