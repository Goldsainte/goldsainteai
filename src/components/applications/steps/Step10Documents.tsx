import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Step10Props {
  formData: any;
  setFormData: (data: any) => void;
}

export const Step10Documents = ({ formData, setFormData }: Step10Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Document Uploads</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Please upload the required documents. All documents must be clear and legible.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="businessLicenseFile">Business License *</Label>
            <Input
              id="businessLicenseFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, businessLicenseFile: file });
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="insuranceCertificateFile">E&O Insurance Certificate</Label>
            <Input
              id="insuranceCertificateFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, insuranceCertificateFile: file });
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="governmentIdFile">Government-Issued ID</Label>
            <Input
              id="governmentIdFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, governmentIdFile: file });
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="professionalHeadshotFile">Professional Headshot</Label>
            <Input
              id="professionalHeadshotFile"
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, professionalHeadshotFile: file });
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="mb-4 text-lg font-semibold">Professional References</h3>
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-sm font-semibold">Reference 1</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="reference1Name">Name</Label>
                <Input
                  id="reference1Name"
                  value={formData.reference1Name || ""}
                  onChange={(e) => setFormData({ ...formData, reference1Name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference1Company">Company</Label>
                <Input
                  id="reference1Company"
                  value={formData.reference1Company || ""}
                  onChange={(e) => setFormData({ ...formData, reference1Company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference1Email">Email</Label>
                <Input
                  id="reference1Email"
                  type="email"
                  value={formData.reference1Email || ""}
                  onChange={(e) => setFormData({ ...formData, reference1Email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference1Phone">Phone</Label>
                <Input
                  id="reference1Phone"
                  type="tel"
                  value={formData.reference1Phone || ""}
                  onChange={(e) => setFormData({ ...formData, reference1Phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-sm font-semibold">Reference 2</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="reference2Name">Name</Label>
                <Input
                  id="reference2Name"
                  value={formData.reference2Name || ""}
                  onChange={(e) => setFormData({ ...formData, reference2Name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference2Company">Company</Label>
                <Input
                  id="reference2Company"
                  value={formData.reference2Company || ""}
                  onChange={(e) => setFormData({ ...formData, reference2Company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference2Email">Email</Label>
                <Input
                  id="reference2Email"
                  type="email"
                  value={formData.reference2Email || ""}
                  onChange={(e) => setFormData({ ...formData, reference2Email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference2Phone">Phone</Label>
                <Input
                  id="reference2Phone"
                  type="tel"
                  value={formData.reference2Phone || ""}
                  onChange={(e) => setFormData({ ...formData, reference2Phone: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
