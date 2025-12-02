import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface Step8Props {
  formData: any;
  setFormData: (data: any) => void;
}

const luxuryInputClasses = "mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg";
const luxuryTextareaClasses = "mt-1.5 min-h-[80px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg";

export const Step8EmergencyLegal = ({ formData, setFormData }: Step8Props) => {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Emergency Management & Legal Compliance</h3>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-1 bg-[#C7A962]/60 rounded-full" />
              <h4 className="font-secondary text-lg text-[#0a2225]">Emergency Support</h4>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="support24_7"
              checked={formData.support24_7 || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, support24_7: checked })
              }
              className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
            />
            <Label htmlFor="support24_7" className="text-sm cursor-pointer text-[#0a2225]">
              I provide 24/7 client support
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="crisisTraining"
              checked={formData.travelCrisisManagementTraining || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, travelCrisisManagementTraining: checked })
              }
              className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
            />
            <Label htmlFor="crisisTraining" className="text-sm cursor-pointer text-[#0a2225]">
              I have travel crisis management training
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="insuranceLicensed"
              checked={formData.travelInsuranceLicensed || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, travelInsuranceLicensed: checked })
              }
              className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
            />
            <Label htmlFor="insuranceLicensed" className="text-sm cursor-pointer text-[#0a2225]">
              Licensed to sell travel insurance
            </Label>
          </div>

          <div>
            <Label htmlFor="emergencyPhone" className="text-sm font-medium text-[#0a2225]">Emergency Contact Phone</Label>
            <Input
              id="emergencyPhone"
              type="tel"
              placeholder="24/7 emergency number"
              value={formData.emergencyContactPhone || ""}
              onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="afterHours" className="text-sm font-medium text-[#0a2225]">After-Hours Availability</Label>
            <Input
              id="afterHours"
              placeholder="e.g., Email only, Phone 8am-10pm, etc."
              value={formData.afterHoursAvailability || ""}
              onChange={(e) => setFormData({ ...formData, afterHoursAvailability: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="crisisExamples" className="text-sm font-medium text-[#0a2225]">Crisis Response Examples (Optional)</Label>
            <Textarea
              id="crisisExamples"
              placeholder="Describe any past situations where you helped clients during travel emergencies"
              value={formData.crisisResponseExamples || ""}
              onChange={(e) => setFormData({ ...formData, crisisResponseExamples: e.target.value })}
              className="mt-1.5 min-h-[100px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>

          <div className="md:col-span-2 border-t border-[#E5DFC6] pt-6 mt-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-6 w-1 bg-[#C7A962]/60 rounded-full" />
              <h4 className="font-secondary text-lg text-[#0a2225]">Legal & Compliance</h4>
            </div>
          </div>

          <div>
            <Label htmlFor="privacyPolicy" className="text-sm font-medium text-[#0a2225]">Privacy Policy URL</Label>
            <Input
              id="privacyPolicy"
              type="url"
              placeholder="https://youragency.com/privacy"
              value={formData.privacyPolicyUrl || ""}
              onChange={(e) => setFormData({ ...formData, privacyPolicyUrl: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="termsConditions" className="text-sm font-medium text-[#0a2225]">Terms & Conditions URL</Label>
            <Input
              id="termsConditions"
              type="url"
              placeholder="https://youragency.com/terms"
              value={formData.termsAndConditionsUrl || ""}
              onChange={(e) => setFormData({ ...formData, termsAndConditionsUrl: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="gdprCompliant"
              checked={formData.gdprCompliant || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, gdprCompliant: checked })
              }
              className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
            />
            <Label htmlFor="gdprCompliant" className="text-sm cursor-pointer text-[#0a2225]">
              GDPR Compliant (if serving EU clients)
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="ccpaCompliant"
              checked={formData.ccpaCompliant || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, ccpaCompliant: checked })
              }
              className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
            />
            <Label htmlFor="ccpaCompliant" className="text-sm cursor-pointer text-[#0a2225]">
              CCPA Compliant (California clients)
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="clientContracts"
              checked={formData.contractsWithClients || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, contractsWithClients: checked })
              }
              className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
            />
            <Label htmlFor="clientContracts" className="text-sm cursor-pointer text-[#0a2225]">
              I use written contracts with clients
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="legalCounsel"
              checked={formData.legalCounselOnRetainer || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, legalCounselOnRetainer: checked })
              }
              className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
            />
            <Label htmlFor="legalCounsel" className="text-sm cursor-pointer text-[#0a2225]">
              Legal counsel on retainer
            </Label>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="dataProtection" className="text-sm font-medium text-[#0a2225]">Client Data Protection Measures</Label>
            <Textarea
              id="dataProtection"
              placeholder="Describe how you protect client data (encryption, secure storage, etc.)"
              value={formData.clientDataProtectionMeasures || ""}
              onChange={(e) => setFormData({ ...formData, clientDataProtectionMeasures: e.target.value })}
              className={luxuryTextareaClasses}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="legalIssues" className="text-sm font-medium text-[#0a2225]">Previous Legal Issues Disclosure</Label>
            <Textarea
              id="legalIssues"
              placeholder="Disclose any previous legal issues, complaints, or disputes (if applicable)"
              value={formData.previousLegalIssues || ""}
              onChange={(e) => setFormData({ ...formData, previousLegalIssues: e.target.value })}
              className={luxuryTextareaClasses}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="regulatoryViolations" className="text-sm font-medium text-[#0a2225]">Regulatory Violations Disclosure</Label>
            <Textarea
              id="regulatoryViolations"
              placeholder="Disclose any regulatory violations or sanctions (if applicable)"
              value={formData.regulatoryViolations || ""}
              onChange={(e) => setFormData({ ...formData, regulatoryViolations: e.target.value })}
              className={luxuryTextareaClasses}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
