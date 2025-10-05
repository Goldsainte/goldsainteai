import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VerificationStatus {
  verification_type: string;
  status: string;
  verified_at?: string;
  rejection_reason?: string;
}

export function CustomerVerificationUpload() {
  const [verificationType, setVerificationType] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [verifications, setVerifications] = useState<VerificationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const verificationTypes = [
    { value: "government_id", label: "Government ID" },
    { value: "passport", label: "Passport" },
    { value: "drivers_license", label: "Driver's License" },
    { value: "selfie", label: "Selfie Verification" },
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
        .select("verification_type, status, verified_at, rejection_reason")
        .eq("user_id", user.id);

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error("Error loading verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !verificationType) {
      toast.error("Please select a verification type and file");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${verificationType}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("verification-documents")
        .getPublicUrl(filePath);

      // Create verification record
      const { error: insertError } = await supabase
        .from("customer_verifications")
        .insert({
          user_id: user.id,
          verification_type: verificationType,
          document_url: publicUrl,
          status: "pending",
        });

      if (insertError) throw insertError;

      toast.success("Verification document uploaded successfully");
      loadVerifications();
      setVerificationType("");
    } catch (error) {
      console.error("Error uploading verification:", error);
      toast.error("Failed to upload verification document");
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

        {/* Current Verifications */}
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
                  </div>
                </div>
                {verification.rejection_reason && (
                  <p className="text-sm text-red-600">{verification.rejection_reason}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload New Verification */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="verification-type">Verification Type</Label>
            <Select value={verificationType} onValueChange={setVerificationType}>
              <SelectTrigger id="verification-type">
                <SelectValue placeholder="Select verification type" />
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

          <div>
            <Label htmlFor="file-upload">Upload Document</Label>
            <div className="mt-2">
              <input
                id="file-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={!verificationType || uploading}
                className="hidden"
              />
              <label htmlFor="file-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!verificationType || uploading}
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
        </div>
      </CardContent>
    </Card>
  );
}