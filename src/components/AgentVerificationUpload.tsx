import { useState } from "react";
import { Upload, CheckCircle2, AlertCircle, FileText, Shield, Award, FileCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface VerificationStatus {
  identity_verified: boolean;
  background_check_status: string;
  professional_license_verified: boolean;
  insurance_verified: boolean;
  trust_score: number;
}

interface AgentVerificationUploadProps {
  agentId: string;
  status: VerificationStatus;
  onVerificationSubmit: () => void;
}

export const AgentVerificationUpload = ({
  agentId,
  status,
  onVerificationSubmit,
}: AgentVerificationUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);

  const uploadDocument = async (
    file: File,
    verificationType: string,
    documentType: string
  ) => {
    try {
      setUploading(verificationType);

      // Upload to storage
      const sanitizedName = sanitizeFileName(file.name);
      const fileExt = sanitizedName.split(".").pop();
      const filePath = `${agentId}/${verificationType}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, file);

      if (uploadError) {
        // Better error message for invalid file name characters
        if (uploadError.message?.includes('Invalid key')) {
          throw new Error(`File name contains unsupported characters. Please rename "${file.name}" and try again.`);
        }
        throw uploadError;
      }

      // Bucket is private — generate a long-lived signed URL (1 year)
      const { data: urlData, error: signError } = await supabase.storage
        .from("verification-documents")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (signError || !urlData) throw signError ?? new Error("Failed to sign URL");

      // Create verification request
      const { error: requestError } = await supabase
        .from("agent_verification_requests")
        .insert({
          agent_id: agentId,
          verification_type: verificationType,
          document_urls: [urlData.signedUrl],
          additional_info: { document_type: documentType },
        });

      if (requestError) throw requestError;

      toast({
        title: "Document uploaded",
        description: "Your verification request has been submitted for review.",
      });

      onVerificationSubmit();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    verificationType: string,
    documentType: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10485760) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file",
        variant: "destructive",
      });
      return;
    }

    await uploadDocument(file, verificationType, documentType);
  };

  const getVerificationProgress = () => {
    let completed = 0;
    if (status.identity_verified) completed++;
    if (status.background_check_status === "approved") completed++;
    if (status.professional_license_verified) completed++;
    if (status.insurance_verified) completed++;
    return (completed / 4) * 100;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trust & Safety Verification
          </CardTitle>
          <CardDescription>
            Complete these verifications to build trust with customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verification Progress</span>
              <Badge variant="outline">
                Trust Score: {status.trust_score.toFixed(1)}/5.0
              </Badge>
            </div>
            <Progress value={getVerificationProgress()} className="h-2" />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Verified agents receive more job opportunities and higher trust from customers.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Identity Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Identity Verification
            </span>
            {status.identity_verified ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">Not Verified</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Upload a government-issued ID and a selfie for identity verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identity-doc">Government-issued ID</Label>
            <Input
              id="identity-doc"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e, "identity", "government_id")}
              disabled={uploading === "identity" || status.identity_verified}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="selfie">Selfie Photo</Label>
            <Input
              id="selfie"
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e, "identity", "selfie")}
              disabled={uploading === "identity" || status.identity_verified}
            />
          </div>
          {uploading === "identity" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 animate-pulse" />
              Uploading...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Background Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Background Check
            </span>
            {status.background_check_status === "approved" ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            ) : status.background_check_status === "pending" ? (
              <Badge variant="secondary">Under Review</Badge>
            ) : (
              <Badge variant="outline">Not Started</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Request a professional background check to verify your credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="background-check">Background Check Document</Label>
            <Input
              id="background-check"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e, "background_check", "report")}
              disabled={uploading === "background_check" || status.background_check_status === "approved"}
            />
          </div>
          {uploading === "background_check" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 animate-pulse" />
              Uploading...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional License */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Professional License
            </span>
            {status.professional_license_verified ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">Not Verified</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Upload your travel agent license or professional certification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="license">License Document</Label>
            <Input
              id="license"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e, "professional_license", "license")}
              disabled={uploading === "professional_license" || status.professional_license_verified}
            />
          </div>
          {uploading === "professional_license" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 animate-pulse" />
              Uploading...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Insurance Coverage
            </span>
            {status.insurance_verified ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">Not Verified</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Provide proof of professional liability insurance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="insurance">Insurance Document</Label>
            <Input
              id="insurance"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e, "insurance", "policy")}
              disabled={uploading === "insurance" || status.insurance_verified}
            />
          </div>
          {uploading === "insurance" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 animate-pulse" />
              Uploading...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
