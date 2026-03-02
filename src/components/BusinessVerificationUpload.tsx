import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface BusinessVerificationUploadProps {
  onSuccess?: () => void;
}

export const BusinessVerificationUpload = ({ onSuccess }: BusinessVerificationUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [businessInfo, setBusinessInfo] = useState({
    business_name: '',
    registration_number: '',
    tax_id: '',
    business_address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    }
  });
  const [documents, setDocuments] = useState({
    registration: null as File | null,
    license: null as File | null,
  });

  const handleFileChange = (type: 'registration' | 'license', file: File | null) => {
    if (file && file.size > 50 * 1024 * 1024) {
      toast.error('File must be less than 50MB');
      return;
    }
    setDocuments(prev => ({ ...prev, [type]: file }));
  };

  const uploadDocument = async (file: File, path: string) => {
    const { error: uploadError } = await supabase.storage
      .from('travel-videos')
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('travel-videos')
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!businessInfo.business_name || !documents.registration) {
      toast.error('Please fill in business name and upload registration document');
      return;
    }

    setUploading(true);
    try {
      // Upload documents
      const registrationUrl = documents.registration
        ? await uploadDocument(
            documents.registration,
            `business-verification/${user.id}/registration-${Date.now()}.${documents.registration.name.split('.').pop()}`
          )
        : null;

      const licenseUrl = documents.license
        ? await uploadDocument(
            documents.license,
            `business-verification/${user.id}/license-${Date.now()}.${documents.license.name.split('.').pop()}`
          )
        : null;

      // Create verification request
      const { error } = await supabase
        .from('business_verifications')
        .insert({
          user_id: user.id,
          business_name: businessInfo.business_name,
          registration_number: businessInfo.registration_number || null,
          tax_id: businessInfo.tax_id || null,
          business_address: businessInfo.business_address,
          registration_document_url: registrationUrl,
          business_license_url: licenseUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Business verification submitted! We\'ll review your documents shortly.');
      setVerificationStatus('pending');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('Failed to submit verification');
    } finally {
      setUploading(false);
    }
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      text: 'Verification Pending',
      description: 'Your documents are being reviewed by our team.'
    },
    approved: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      text: 'Business Verified',
      description: 'Your business has been verified! You now have the gold verification badge.'
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      text: 'Verification Rejected',
      description: 'Your verification was not approved. Please review the reason and resubmit.'
    }
  };

  if (verificationStatus && verificationStatus !== null) {
    const config = statusConfig[verificationStatus];
    const Icon = config.icon;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            {config.text}
          </CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Verification</CardTitle>
        <CardDescription>
          Upload your business documents to get verified and receive a gold verification badge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name *</Label>
          <Input
            id="business_name"
            value={businessInfo.business_name}
            onChange={(e) => setBusinessInfo({ ...businessInfo, business_name: e.target.value })}
            placeholder="Your Business Inc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="registration_number">Registration Number</Label>
            <Input
              id="registration_number"
              value={businessInfo.registration_number}
              onChange={(e) => setBusinessInfo({ ...businessInfo, registration_number: e.target.value })}
              placeholder="123456789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_id">Tax ID</Label>
            <Input
              id="tax_id"
              value={businessInfo.tax_id}
              onChange={(e) => setBusinessInfo({ ...businessInfo, tax_id: e.target.value })}
              placeholder="XX-XXXXXXX"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Business Address</Label>
          <Input
            placeholder="Street Address"
            value={businessInfo.business_address.street}
            onChange={(e) => setBusinessInfo({
              ...businessInfo,
              business_address: { ...businessInfo.business_address, street: e.target.value }
            })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="City"
              value={businessInfo.business_address.city}
              onChange={(e) => setBusinessInfo({
                ...businessInfo,
                business_address: { ...businessInfo.business_address, city: e.target.value }
              })}
            />
            <Input
              placeholder="State"
              value={businessInfo.business_address.state}
              onChange={(e) => setBusinessInfo({
                ...businessInfo,
                business_address: { ...businessInfo.business_address, state: e.target.value }
              })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Postal Code"
              value={businessInfo.business_address.postal_code}
              onChange={(e) => setBusinessInfo({
                ...businessInfo,
                business_address: { ...businessInfo.business_address, postal_code: e.target.value }
              })}
            />
            <Input
              placeholder="Country"
              value={businessInfo.business_address.country}
              onChange={(e) => setBusinessInfo({
                ...businessInfo,
                business_address: { ...businessInfo.business_address, country: e.target.value }
              })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="registration_doc">Business Registration Document *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="registration_doc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('registration', e.target.files?.[0] || null)}
              />
              {documents.registration && (
                <FileText className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_doc">Business License (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="license_doc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('license', e.target.files?.[0] || null)}
              />
              {documents.license && (
                <FileText className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Submit for Verification
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
