import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Shield, CheckCircle, XCircle, Clock, Camera } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VerificationStatus {
  verification_type: string;
  status: string;
  verified_at?: string;
  rejection_reason?: string;
}

export function CustomerVerificationUpload() {
  const [step, setStep] = useState<'list' | 'select' | 'document' | 'selfie'>('list');
  const [selectedIdType, setSelectedIdType] = useState<string>("");
  const [documentUploadId, setDocumentUploadId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verifications, setVerifications] = useState<VerificationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const verificationTypes = [
    { value: "government_id", label: "Government ID" },
    { value: "passport", label: "Passport" },
    { value: "drivers_license", label: "Driver's License" },
  ];

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("customer_verifications")
        .select("verification_type, status, verified_at, rejection_reason, metadata")
        .eq("user_id", user.id);

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error("Error loading verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setStep('list');
    setSelectedIdType("");
    setDocumentUploadId(null);
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload document to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${selectedIdType}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("verification-documents")
        .getPublicUrl(filePath);

      // Create verification record
      const { data: insertData, error: insertError } = await supabase
        .from("customer_verifications")
        .insert({
          user_id: user.id,
          verification_type: selectedIdType,
          document_url: publicUrl,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Save record ID and move to selfie step
      setDocumentUploadId(insertData.id);
      toast.success("ID document uploaded successfully! Now take a selfie.");
      setStep('selfie');
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload ID document");
    } finally {
      setUploading(false);
    }
  };

  const handleSelfieUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !documentUploadId) {
      toast.error("Document upload ID missing");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload selfie to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/selfie-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("verification-documents")
        .getPublicUrl(filePath);

      // Update existing verification record with selfie_url in metadata
      const { error: updateError } = await supabase
        .from("customer_verifications")
        .update({
          metadata: {
            selfie_url: publicUrl
          }
        })
        .eq('id', documentUploadId);

      if (updateError) throw updateError;

      toast.success("Verification submitted! Awaiting admin review.");
      
      // Reset wizard and reload verifications
      resetWizard();
      loadVerifications();
    } catch (error) {
      console.error("Error uploading selfie:", error);
      toast.error("Failed to upload selfie photo");
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Identity Verification
        </CardTitle>
        <CardDescription>
          Verify your identity to build trust with travel agents and unlock instant booking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your documents are securely stored and only used for verification purposes. 
            Verified accounts get priority support and access to instant booking.
          </AlertDescription>
        </Alert>

        {/* Progress Indicator */}
        {step !== 'list' && (
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center gap-2 ${step === 'select' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'select' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                1
              </div>
              <span className="text-sm font-medium hidden sm:inline">Select Type</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step === 'document' || step === 'selfie' ? 'bg-primary' : 'bg-border'}`} />
            <div className={`flex items-center gap-2 ${step === 'document' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'document' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">Upload ID</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step === 'selfie' ? 'bg-primary' : 'bg-border'}`} />
            <div className={`flex items-center gap-2 ${step === 'selfie' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'selfie' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                3
              </div>
              <span className="text-sm font-medium hidden sm:inline">Upload Selfie</span>
            </div>
          </div>
        )}

        {/* Step 1: List existing verifications */}
        {step === 'list' && (
          <>
            {verifications.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Your Verifications</h3>
                {verifications.map((verification, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(verification.status)}
                      <div>
                        <p className="font-medium capitalize">
                          {verification.verification_type.replace(/_/g, " ")}
                        </p>
                        <p className={`text-sm capitalize ${getStatusColor(verification.status)}`}>
                          {verification.status}
                        </p>
                        {(verification as any).metadata?.selfie_url && (
                          <p className="text-xs text-green-600">✓ Selfie uploaded</p>
                        )}
                      </div>
                    </div>
                    {verification.rejection_reason && (
                      <p className="text-sm text-red-600">{verification.rejection_reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <Button onClick={() => setStep('select')} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Start New Verification
            </Button>
          </>
        )}

        {/* Step 2: Select ID Type */}
        {step === 'select' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-type">Select ID Type</Label>
              <Select value={selectedIdType} onValueChange={setSelectedIdType}>
                <SelectTrigger id="verification-type">
                  <SelectValue placeholder="Choose document type" />
                </SelectTrigger>
                <SelectContent>
                  {verificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setStep('document')} 
                disabled={!selectedIdType}
                className="flex-1"
              >
                Next: Upload Document
              </Button>
              <Button variant="ghost" onClick={resetWizard}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Upload ID Document */}
        {step === 'document' && (
          <div className="space-y-4">
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                Upload a clear photo of your {selectedIdType.replace(/_/g, ' ')}. 
                Make sure all text is readable and the document is not expired.
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="document-upload" className="capitalize">
                Upload {selectedIdType.replace(/_/g, ' ')}
              </Label>
              <div className="mt-2">
                <input
                  id="document-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleDocumentUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <label htmlFor="document-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    className="w-full"
                    asChild
                  >
                    <span className="flex items-center gap-2 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Choose File"}
                    </span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Accepted formats: JPG, PNG, PDF. Max size: 10MB
              </p>
            </div>
            <Button variant="ghost" onClick={resetWizard} disabled={uploading}>
              Cancel
            </Button>
          </div>
        )}

        {/* Step 4: Upload Selfie */}
        {step === 'selfie' && (
          <div className="space-y-4">
            <Alert>
              <Camera className="h-4 w-4" />
              <AlertDescription>
                Now take a selfie holding your ID document next to your face. 
                Make sure both your face and the ID are clearly visible in the same photo.
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="selfie-upload">Upload Selfie Photo</Label>
              <div className="mt-2">
                <input
                  id="selfie-upload"
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleSelfieUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <label htmlFor="selfie-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    className="w-full"
                    asChild
                  >
                    <span className="flex items-center gap-2 cursor-pointer">
                      <Camera className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Take Selfie"}
                    </span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Hold your ID next to your face for verification
              </p>
            </div>
            <Button variant="ghost" onClick={resetWizard} disabled={uploading}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}