import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step3Props {
  formData: any;
  setFormData: (data: any) => void;
}

const luxuryInputClasses = "mt-1.5 min-h-[48px] w-full max-w-full border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 focus:ring-offset-0 rounded-lg placeholder:text-sm box-border";

export const Step3ProfessionalCredentials = ({ formData, setFormData }: Step3Props) => {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Professional Credentials & Memberships</h3>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="iatanId" className="text-sm font-medium text-[#0a2225]">IATAN ID Number</Label>
            <Input
              id="iatanId"
              placeholder="International Airlines Travel Agent Network"
              value={formData.iatanIdNumber || ""}
              onChange={(e) => setFormData({ ...formData, iatanIdNumber: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div className="flex items-center space-x-3 mt-6">
            <Checkbox
              id="astaVta"
              checked={formData.astaVerifiedTravelAdvisor || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, astaVerifiedTravelAdvisor: checked })
              }
              className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
            />
            <Label htmlFor="astaVta" className="text-sm cursor-pointer text-[#0a2225]">
              ASTA Verified Travel Advisor
            </Label>
          </div>

          <div>
            <Label htmlFor="astaMembership" className="text-sm font-medium text-[#0a2225]">ASTA Membership Number</Label>
            <Input
              id="astaMembership"
              value={formData.astaMembershipNumber || ""}
              onChange={(e) => setFormData({ ...formData, astaMembershipNumber: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div className="flex items-center space-x-3 mt-6">
            <Checkbox
              id="travelInstituteCta"
              checked={formData.travelInstituteCta || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, travelInstituteCta: checked })
              }
              className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
            />
            <Label htmlFor="travelInstituteCta" className="text-sm cursor-pointer text-[#0a2225]">
              Travel Institute CTA (Certified Travel Associate)
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="travelInstituteCtc"
              checked={formData.travelInstituteCtc || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, travelInstituteCtc: checked })
              }
              className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
            />
            <Label htmlFor="travelInstituteCtc" className="text-sm cursor-pointer text-[#0a2225]">
              Travel Institute CTC (Certified Travel Counselor)
            </Label>
          </div>

          <div>
            <Label htmlFor="cliaCertLevel" className="text-sm font-medium text-[#0a2225]">CLIA Certification Level</Label>
            <Select
              value={formData.cliaCertificationLevel || ""}
              onValueChange={(value) => 
                setFormData({ ...formData, cliaCertificationLevel: value })
              }
            >
              <SelectTrigger className={luxuryInputClasses}>
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

          <div className="md:col-span-2 border-t border-[#E5DFC6] pt-6 mt-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-6 w-1 bg-[#C7A962]/60 rounded-full" />
              <h4 className="font-secondary text-lg text-[#0a2225]">Host Agency Affiliation</h4>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="hostAgency" className="text-sm font-medium text-[#0a2225]">Host Agency Name</Label>
                <Input
                  id="hostAgency"
                  placeholder="e.g., Travel Leaders, Virtuoso, etc."
                  value={formData.hostAgencyName || ""}
                  onChange={(e) => setFormData({ ...formData, hostAgencyName: e.target.value })}
                  className={luxuryInputClasses}
                />
              </div>

              <div>
                <Label htmlFor="hostAffiliation" className="text-sm font-medium text-[#0a2225]">Affiliation Type</Label>
                <Select
                  value={formData.hostAgencyAffiliation || ""}
                  onValueChange={(value) => 
                    setFormData({ ...formData, hostAgencyAffiliation: value })
                  }
                >
                  <SelectTrigger className={luxuryInputClasses}>
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
                <Label htmlFor="yearsWithHost" className="text-sm font-medium text-[#0a2225]">Years with Host Agency</Label>
                <Input
                  id="yearsWithHost"
                  type="number"
                  value={formData.yearsWithHostAgency || ""}
                  onChange={(e) => setFormData({ ...formData, yearsWithHostAgency: e.target.value })}
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
