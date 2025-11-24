import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step3Props {
  formData: any;
  setFormData: (data: any) => void;
}

export const Step3ProfessionalCredentials = ({ formData, setFormData }: Step3Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Professional Credentials & Memberships</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="iatanId">IATAN ID Number</Label>
            <Input
              id="iatanId"
              placeholder="International Airlines Travel Agent Network"
              value={formData.iatanIdNumber || ""}
              onChange={(e) => setFormData({ ...formData, iatanIdNumber: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2 mt-6">
            <Checkbox
              id="astaVta"
              checked={formData.astaVerifiedTravelAdvisor || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, astaVerifiedTravelAdvisor: checked })
              }
            />
            <Label htmlFor="astaVta" className="text-sm cursor-pointer">
              ASTA Verified Travel Advisor
            </Label>
          </div>

          <div>
            <Label htmlFor="astaMembership">ASTA Membership Number</Label>
            <Input
              id="astaMembership"
              value={formData.astaMembershipNumber || ""}
              onChange={(e) => setFormData({ ...formData, astaMembershipNumber: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2 mt-6">
            <Checkbox
              id="travelInstituteCta"
              checked={formData.travelInstituteCta || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, travelInstituteCta: checked })
              }
            />
            <Label htmlFor="travelInstituteCta" className="text-sm cursor-pointer">
              Travel Institute CTA (Certified Travel Associate)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="travelInstituteCtc"
              checked={formData.travelInstituteCtc || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, travelInstituteCtc: checked })
              }
            />
            <Label htmlFor="travelInstituteCtc" className="text-sm cursor-pointer">
              Travel Institute CTC (Certified Travel Counselor)
            </Label>
          </div>

          <div>
            <Label htmlFor="cliaCertLevel">CLIA Certification Level</Label>
            <Select
              value={formData.cliaCertificationLevel || ""}
              onValueChange={(value) => 
                setFormData({ ...formData, cliaCertificationLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="acc">ACC (Accredited Cruise Counselor)</SelectItem>
                <SelectItem value="mcc">MCC (Master Cruise Counselor)</SelectItem>
                <SelectItem value="ecc">ECC (Elite Cruise Counselor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 border-t pt-4">
            <h4 className="mb-3 text-base font-semibold">Host Agency Affiliation</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="hostAgency">Host Agency Name</Label>
                <Input
                  id="hostAgency"
                  placeholder="e.g., Travel Leaders, Virtuoso, etc."
                  value={formData.hostAgencyName || ""}
                  onChange={(e) => setFormData({ ...formData, hostAgencyName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="hostAffiliation">Affiliation Type</Label>
                <Select
                  value={formData.hostAgencyAffiliation || ""}
                  onValueChange={(value) => 
                    setFormData({ ...formData, hostAgencyAffiliation: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independent">Independent</SelectItem>
                    <SelectItem value="franchised">Franchised</SelectItem>
                    <SelectItem value="hosted">Hosted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="yearsWithHost">Years with Host Agency</Label>
                <Input
                  id="yearsWithHost"
                  type="number"
                  value={formData.yearsWithHostAgency || ""}
                  onChange={(e) => setFormData({ ...formData, yearsWithHostAgency: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};