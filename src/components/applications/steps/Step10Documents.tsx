import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface Step10Props {
  formData: any;
  setFormData: (data: any) => void;
}

const luxuryInputClasses = "mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg placeholder:text-sm";

export const Step10Documents = ({ formData, setFormData }: Step10Props) => {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Document Uploads</h3>
        </div>
        <p className="mb-6 text-sm text-[#6B7280] ml-4">
          Please upload the required documents. All documents must be clear and legible.
        </p>
        <div className="space-y-5">
          <div>
            <Label htmlFor="businessLicenseFile" className="text-sm font-medium text-[#0a2225]">Business License *</Label>
            <div className="mt-1.5 border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] bg-[#FDF9F0]/50 rounded-xl p-4 transition-colors cursor-pointer">
              <Input
                id="businessLicenseFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, businessLicenseFile: file });
                  }
                }}
              />
              {formData.businessLicenseFile && (
                <p className="mt-2 text-xs text-[#0c4d47]">✓ {formData.businessLicenseFile.name}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="insuranceCertificateFile" className="text-sm font-medium text-[#0a2225]">E&O Insurance Certificate</Label>
            <div className="mt-1.5 border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] bg-[#FDF9F0]/50 rounded-xl p-4 transition-colors cursor-pointer">
              <Input
                id="insuranceCertificateFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, insuranceCertificateFile: file });
                  }
                }}
              />
              {formData.insuranceCertificateFile && (
                <p className="mt-2 text-xs text-[#0c4d47]">✓ {formData.insuranceCertificateFile.name}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="governmentIdFile" className="text-sm font-medium text-[#0a2225]">Government-Issued ID</Label>
            <div className="mt-1.5 border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] bg-[#FDF9F0]/50 rounded-xl p-4 transition-colors cursor-pointer">
              <Input
                id="governmentIdFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, governmentIdFile: file });
                  }
                }}
              />
              {formData.governmentIdFile && (
                <p className="mt-2 text-xs text-[#0c4d47]">✓ {formData.governmentIdFile.name}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="professionalHeadshotFile" className="text-sm font-medium text-[#0a2225]">Professional Headshot</Label>
            <div className="mt-1.5 border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] bg-[#FDF9F0]/50 rounded-xl p-4 transition-colors cursor-pointer">
              <Input
                id="professionalHeadshotFile"
                type="file"
                accept=".jpg,.jpeg,.png"
                className="cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, professionalHeadshotFile: file });
                  }
                }}
              />
              {formData.professionalHeadshotFile && (
                <p className="mt-2 text-xs text-[#0c4d47]">✓ {formData.professionalHeadshotFile.name}</p>
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
