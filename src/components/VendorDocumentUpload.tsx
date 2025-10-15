import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

// Utility to sanitize file names for safe storage keys
function sanitizeFileName(originalName: string): string {
  const parts = originalName.split('.');
  const extension = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  let baseName = parts.join('.');
  
  // Normalize Unicode and strip diacritics
  baseName = baseName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  
  // Replace all whitespace variants (including narrow no-break space U+202F) with dashes
  baseName = baseName.replace(/[\s\u00A0\u202F\u2009\u200A]+/g, '-');
  
  // Remove all characters except alphanumeric, dots, dashes, underscores
  baseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '');
  
  // Remove leading/trailing dashes and collapse multiple dashes
  baseName = baseName.replace(/^-+|-+$/g, '').replace(/-+/g, '-');
  
  // Truncate base name to 80 characters max
  baseName = baseName.substring(0, 80);
  
  // If baseName is empty after sanitization, use a fallback
  if (!baseName) baseName = 'file';
  
  return extension ? `${baseName}.${extension}` : baseName;
}

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
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} - Please upload PDF, JPG, or PNG files only`,
          variant: "destructive",
        });
        return false;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10485760) {
        toast({
          title: "File too large",
          description: `${file.name} - File size must be less than 10MB`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload all files simultaneously
      const uploadPromises = validFiles.map(async (file) => {
        const sanitizedName = sanitizeFileName(file.name);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${sanitizedName}`;
        const filePath = `${user.id}/${documentType}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vendor-documents')
          .upload(filePath, file);

        if (uploadError) {
          // Better error message for invalid file name characters
          if (uploadError.message?.includes('Invalid key')) {
            throw new Error(`File name contains unsupported characters. Please rename "${file.name}" and try again.`);
          }
          throw uploadError;
        }

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

        return {
          id: docData.id,
          fileName: file.name,
          fileUrl: publicUrl
        };
      });

      const results = await Promise.all(uploadPromises);

      // Update parent component with all new documents
      onDocumentsChange([...documents, ...results]);

      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${results.length} document${results.length > 1 ? 's' : ''}`,
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
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Accepted formats: PDF, JPG, PNG (Max 10MB per file) • Multiple files allowed
          </p>
        </div>
      </div>

      {uploading && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm">Uploading documents...</p>
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
