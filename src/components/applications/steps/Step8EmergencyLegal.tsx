import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface Step8Props {
  formData: any;
  setFormData: (data: any) => void;
}

export const Step8EmergencyLegal = ({ formData, setFormData }: Step8Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Emergency Management & Legal Compliance</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h4 className="mb-3 text-base font-semibold">Emergency Support</h4>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="support24_7"
              checked={formData.support24_7 || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, support24_7: checked })
              }
            />
            <Label htmlFor="support24_7" className="text-sm cursor-pointer">
              I provide 24/7 client support
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="crisisTraining"
              checked={formData.travelCrisisManagementTraining || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, travelCrisisManagementTraining: checked })
              }
            />
            <Label htmlFor="crisisTraining" className="text-sm cursor-pointer">
              I have travel crisis management training
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="insuranceLicensed"
              checked={formData.travelInsuranceLicensed || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, travelInsuranceLicensed: checked })
              }
            />
            <Label htmlFor="insuranceLicensed" className="text-sm cursor-pointer">
              Licensed to sell travel insurance
            </Label>
          </div>

          <div>
            <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
            <Input
              id="emergencyPhone"
              type="tel"
              placeholder="24/7 emergency number"
              value={formData.emergencyContactPhone || ""}
              onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="afterHours">After-Hours Availability</Label>
            <Input
              id="afterHours"
              placeholder="e.g., Email only, Phone 8am-10pm, etc."
              value={formData.afterHoursAvailability || ""}
              onChange={(e) => setFormData({ ...formData, afterHoursAvailability: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="crisisExamples">Crisis Response Examples (Optional)</Label>
            <Textarea
              id="crisisExamples"
              placeholder="Describe any past situations where you helped clients during travel emergencies"
              value={formData.crisisResponseExamples || ""}
              onChange={(e) => setFormData({ ...formData, crisisResponseExamples: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <div className="md:col-span-2 border-t pt-4">
            <h4 className="mb-3 text-base font-semibold">Legal & Compliance</h4>
          </div>

          <div>
            <Label htmlFor="privacyPolicy">Privacy Policy URL</Label>
            <Input
              id="privacyPolicy"
              type="url"
              placeholder="https://youragency.com/privacy"
              value={formData.privacyPolicyUrl || ""}
              onChange={(e) => setFormData({ ...formData, privacyPolicyUrl: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="termsConditions">Terms & Conditions URL</Label>
            <Input
              id="termsConditions"
              type="url"
              placeholder="https://youragency.com/terms"
              value={formData.termsAndConditionsUrl || ""}
              onChange={(e) => setFormData({ ...formData, termsAndConditionsUrl: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="gdprCompliant"
              checked={formData.gdprCompliant || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, gdprCompliant: checked })
              }
            />
            <Label htmlFor="gdprCompliant" className="text-sm cursor-pointer">
              GDPR Compliant (if serving EU clients)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="ccpaCompliant"
              checked={formData.ccpaCompliant || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, ccpaCompliant: checked })
              }
            />
            <Label htmlFor="ccpaCompliant" className="text-sm cursor-pointer">
              CCPA Compliant (California clients)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="clientContracts"
              checked={formData.contractsWithClients || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, contractsWithClients: checked })
              }
            />
            <Label htmlFor="clientContracts" className="text-sm cursor-pointer">
              I use written contracts with clients
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="legalCounsel"
              checked={formData.legalCounselOnRetainer || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, legalCounselOnRetainer: checked })
              }
            />
            <Label htmlFor="legalCounsel" className="text-sm cursor-pointer">
              Legal counsel on retainer
            </Label>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="dataProtection">Client Data Protection Measures</Label>
            <Textarea
              id="dataProtection"
              placeholder="Describe how you protect client data (encryption, secure storage, etc.)"
              value={formData.clientDataProtectionMeasures || ""}
              onChange={(e) => setFormData({ ...formData, clientDataProtectionMeasures: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="legalIssues">Previous Legal Issues Disclosure</Label>
            <Textarea
              id="legalIssues"
              placeholder="Disclose any previous legal issues, complaints, or disputes (if applicable)"
              value={formData.previousLegalIssues || ""}
              onChange={(e) => setFormData({ ...formData, previousLegalIssues: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="regulatoryViolations">Regulatory Violations Disclosure</Label>
            <Textarea
              id="regulatoryViolations"
              placeholder="Disclose any regulatory violations or sanctions (if applicable)"
              value={formData.regulatoryViolations || ""}
              onChange={(e) => setFormData({ ...formData, regulatoryViolations: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};