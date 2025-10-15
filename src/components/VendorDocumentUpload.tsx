import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface UploadedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
}

interface VendorDocumentUploadProps {
  documentType: 'insurance' | 'driver_license';
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  label: string;
  required?: boolean;
}

export default function VendorDocumentUpload({
  documentType,
  documents,
  onDocumentsChange,
  label,
  required = false
}: VendorDocumentUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, JPG, or PNG files only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10485760) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to storage
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${documentType}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(filePath);

      // Save metadata to database
      const { data: docData, error: dbError } = await supabase
        .from('vendor_document_uploads')
        .insert({
          user_id: user.id,
          document_type: documentType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Update parent component
      onDocumentsChange([
        ...documents,
        {
          id: docData.id,
          fileName: file.name,
          fileUrl: publicUrl
        }
      ]);

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded`,
      });

      // Reset input
      event.target.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (documentId: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/vendor-documents/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        
        // Delete from storage
        await supabase.storage
          .from('vendor-documents')
          .remove([filePath]);
      }

      // Delete from database
      await supabase
        .from('vendor_document_uploads')
        .delete()
        .eq('id', documentId);

      // Update parent component
      onDocumentsChange(documents.filter(doc => doc.id !== documentId));

      toast({
        title: "Document removed",
        description: "The document has been deleted",
      });
    } catch (error: any) {
      console.error('Remove error:', error);
      toast({
        title: "Remove failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`upload-${documentType}`}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="mt-2">
          <Input
            id={`upload-${documentType}`}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Accepted formats: PDF, JPG, PNG (Max 10MB)
          </p>
        </div>
      </div>

      {uploading && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm">Uploading document...</p>
          </div>
        </Card>
      )}

      {documents.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Documents ({documents.length})</Label>
          {documents.map((doc) => (
            <Card key={doc.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.fileName}</p>
                    <a 
                      href={doc.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View document
                    </a>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(doc.id, doc.fileUrl)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
