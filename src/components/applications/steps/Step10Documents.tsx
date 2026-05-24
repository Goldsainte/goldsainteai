import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Step10Props {
  formData: any;
  setFormData: (data: any) => void;
}

const luxuryInputClasses = "mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 focus:ring-offset-0 rounded-lg placeholder:text-sm";

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is 50MB.`;
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const extOk = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'heif'].includes(ext);
  if (file.type && !ALLOWED_TYPES.includes(file.type) && !extOk) {
    return `Unsupported file: ${file.name}. Please use PDF, JPG, PNG, or HEIC.`;
  }
  if (!file.type && !extOk) {
    return `Could not detect file type for ${file.name}. Please use PDF, JPG, PNG, or HEIC.`;
  }
  return null;
}

export const Step10Documents = ({ formData, setFormData }: Step10Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePick = (fieldKey: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setErrors((prev) => ({ ...prev, [fieldKey]: err }));
      // clear the input so user can re-pick
      e.target.value = '';
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setFormData({ ...formData, [fieldKey]: file });
  };

  const submitError: string | undefined = formData.__documentUploadError;

  return (
    <div className="space-y-8">
      {submitError && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-medium mb-1">We couldn't upload your documents</p>
            <p>{submitError}</p>
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Document Uploads</h3>
        </div>
        <p className="mb-6 text-sm text-[#6B7280] ml-4">
          Please upload your business license and proof of insurance. Accepted formats: PDF, JPG, PNG, or HEIC (iPhone photos). Max 50MB each. Your identity will be verified separately through Stripe Identity in the final step — no government ID or headshot needed here.
        </p>
        <div className="space-y-5">
          <div>
            <Label htmlFor="businessLicenseFile" className="text-sm font-medium text-[#0a2225]">Business License *</Label>
            <div className="mt-1.5 border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] bg-[#FDF9F0]/50 rounded-xl p-4 transition-colors cursor-pointer">
              <Input
                id="businessLicenseFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/*"
                className="cursor-pointer"
                onChange={handlePick('businessLicenseFile')}
              />
              {formData.businessLicenseFile && (
                <p className="mt-2 text-xs text-[#0c4d47]">✓ {formData.businessLicenseFile.name}</p>
              )}
              {errors.businessLicenseFile && (
                <p className="mt-2 text-xs text-red-600">{errors.businessLicenseFile}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="insuranceCertificateFile" className="text-sm font-medium text-[#0a2225]">E&O Insurance Certificate</Label>
            <div className="mt-1.5 border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] bg-[#FDF9F0]/50 rounded-xl p-4 transition-colors cursor-pointer">
              <Input
                id="insuranceCertificateFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/*"
                className="cursor-pointer"
                onChange={handlePick('insuranceCertificateFile')}
              />
              {formData.insuranceCertificateFile && (
                <p className="mt-2 text-xs text-[#0c4d47]">✓ {formData.insuranceCertificateFile.name}</p>
              )}
              {errors.insuranceCertificateFile && (
                <p className="mt-2 text-xs text-red-600">{errors.insuranceCertificateFile}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E5DFC6] pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-1 bg-[#C7A962]/60 rounded-full" />
          <h4 className="font-secondary text-lg text-[#0a2225]">Professional References</h4>
        </div>
        <div className="space-y-5">
          <div className="rounded-xl border border-[#E5DFC6] bg-white p-5">
            <h4 className="mb-4 font-secondary text-base text-[#0a2225]">Reference 1</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="reference1Name" className="text-sm font-medium text-[#0a2225]">Name</Label>
                <Input
                  id="reference1Name"
                  value={formData.reference1Name || ""}
                  onChange={(e) => setFormData({ ...formData, reference1Name: e.target.value })}
                  className={luxuryInputClasses}
                />
              </div>
              <div>
                <Label htmlFor="reference1Company" className="text-sm font-medium text-[#0a2225]">Company</Label>
                <Input
                  id="reference1Company"
                  value={formData.reference1Company || ""}
                  onChange={(e) => setFormData({ ...formData, reference1Company: e.target.value })}
                  className={luxuryInputClasses}
                />
              </div>
              <div>
                <Label htmlFor="reference1Email" className="text-sm font-medium text-[#0a2225]">Email</Label>
                <Input
                  id="reference1Email"
                  type="email"
                  value={formData.reference1Email || ""}
                  onChange={(e) => setFormData({ ...formData, reference1Email: e.target.value })}
                  className={luxuryInputClasses}
                />
              </div>
              <div>
                <Label htmlFor="reference1Phone" className="text-sm font-medium text-[#0a2225]">Phone</Label>
                <Input
                  id="reference1Phone"
                  type="tel"
                  value={formData.reference1Phone || ""}
                  onChange={(e) => setFormData({ ...formData, reference1Phone: e.target.value })}
                  className={luxuryInputClasses}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5DFC6] bg-white p-5">
            <h4 className="mb-4 font-secondary text-base text-[#0a2225]">Reference 2</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="reference2Name" className="text-sm font-medium text-[#0a2225]">Name</Label>
                <Input
                  id="reference2Name"
                  value={formData.reference2Name || ""}
                  onChange={(e) => setFormData({ ...formData, reference2Name: e.target.value })}
                  className={luxuryInputClasses}
                />
              </div>
              <div>
                <Label htmlFor="reference2Company" className="text-sm font-medium text-[#0a2225]">Company</Label>
                <Input
                  id="reference2Company"
                  value={formData.reference2Company || ""}
                  onChange={(e) => setFormData({ ...formData, reference2Company: e.target.value })}
                  className={luxuryInputClasses}
                />
              </div>
              <div>
                <Label htmlFor="reference2Email" className="text-sm font-medium text-[#0a2225]">Email</Label>
                <Input
                  id="reference2Email"
                  type="email"
                  value={formData.reference2Email || ""}
                  onChange={(e) => setFormData({ ...formData, reference2Email: e.target.value })}
                  className={luxuryInputClasses}
                />
              </div>
              <div>
                <Label htmlFor="reference2Phone" className="text-sm font-medium text-[#0a2225]">Phone</Label>
                <Input
                  id="reference2Phone"
                  type="tel"
                  value={formData.reference2Phone || ""}
                  onChange={(e) => setFormData({ ...formData, reference2Phone: e.target.value })}
                  className={luxuryInputClasses}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
