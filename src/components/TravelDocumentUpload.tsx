import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TravelDocumentUploadProps {
  itineraryId: string;
  userId: string;
  onUploadComplete?: () => void;
}

export const TravelDocumentUpload = ({
  itineraryId,
  userId,
  onUploadComplete,
}: TravelDocumentUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    document_type: "passport",
    title: "",
    document_number: "",
    issue_date: "",
    expiry_date: "",
    notes: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a document to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${itineraryId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("travel-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("travel-documents")
        .getPublicUrl(fileName);

      // Save document record
      const { error: dbError } = await supabase
        .from("travel_documents")
        .insert({
          itinerary_id: itineraryId,
          user_id: userId,
          document_type: formData.document_type,
          document_title: formData.title,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          document_number: formData.document_number || null,
          issue_date: formData.issue_date || null,
          expiry_date: formData.expiry_date || null,
          notes: formData.notes || null,
        });

      if (dbError) throw dbError;

      toast({
        title: "Document uploaded",
        description: "Your travel document has been saved successfully",
      });

      setFormData({
        document_type: "passport",
        title: "",
        document_number: "",
        issue_date: "",
        expiry_date: "",
        notes: "",
      });
      setFile(null);

      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Travel Document
        </CardTitle>
        <CardDescription>
          Store important travel documents like passports, visas, and tickets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select
              value={formData.document_type}
              onValueChange={(value) => setFormData({ ...formData, document_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="ticket">Ticket</SelectItem>
                <SelectItem value="insurance">Travel Insurance</SelectItem>
                <SelectItem value="voucher">Voucher</SelectItem>
                <SelectItem value="reservation">Reservation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              placeholder="e.g., US Passport"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_number">Document Number (Optional)</Label>
            <Input
              id="document_number"
              placeholder="e.g., ABC123456"
              value={formData.document_number}
              onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload Document</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG (max 10MB)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
