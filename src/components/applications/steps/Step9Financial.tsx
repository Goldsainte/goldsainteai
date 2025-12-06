import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, CheckCircle2 } from "lucide-react";

interface Step9Props {
  formData: any;
  setFormData: (data: any) => void;
}

const luxuryInputClasses = "mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 focus:ring-offset-0 rounded-lg placeholder:text-sm";

export const Step9Financial = ({ formData, setFormData }: Step9Props) => {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Financial Information</h3>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="annualRevenue" className="text-sm font-medium text-[#0a2225]">Annual Revenue</Label>
            <Select
              value={formData.annualRevenue || ""}
              onValueChange={(value) => setFormData({ ...formData, annualRevenue: value })}
            >
              <SelectTrigger className={luxuryInputClasses}>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under_100k">Under $100,000</SelectItem>
                <SelectItem value="100k_250k">$100,000 - $250,000</SelectItem>
                <SelectItem value="250k_500k">$250,000 - $500,000</SelectItem>
                <SelectItem value="500k_1m">$500,000 - $1M</SelectItem>
                <SelectItem value="1m_5m">$1M - $5M</SelectItem>
                <SelectItem value="over_5m">Over $5M</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E5DFC6] pt-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-6 w-1 bg-[#C7A962]/60 rounded-full" />
          <h4 className="font-secondary text-lg text-[#0a2225]">Errors & Omissions Insurance</h4>
        </div>
        
        <div className="mb-5 flex items-center space-x-3">
          <Checkbox
            id="errorsOmissionsInsurance"
            checked={formData.errorsOmissionsInsurance || false}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, errorsOmissionsInsurance: checked })
            }
            className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
          />
          <Label htmlFor="errorsOmissionsInsurance" className="cursor-pointer text-[#0a2225]">
            I have Errors & Omissions Insurance
          </Label>
        </div>

        {formData.errorsOmissionsInsurance && (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="insuranceProvider" className="text-sm font-medium text-[#0a2225]">Insurance Provider *</Label>
              <Input
                id="insuranceProvider"
                value={formData.insuranceProvider || ""}
                onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                required={formData.errorsOmissionsInsurance}
                className={luxuryInputClasses}
              />
            </div>

            <div>
              <Label htmlFor="insurancePolicyNumber" className="text-sm font-medium text-[#0a2225]">Policy Number *</Label>
              <Input
                id="insurancePolicyNumber"
                value={formData.insurancePolicyNumber || ""}
                onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                required={formData.errorsOmissionsInsurance}
                className={luxuryInputClasses}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="insuranceCoverage" className="text-sm font-medium text-[#0a2225]">Coverage Amount *</Label>
              <Input
                id="insuranceCoverage"
                placeholder="e.g., $1,000,000"
                value={formData.insuranceCoverage || ""}
                onChange={(e) => setFormData({ ...formData, insuranceCoverage: e.target.value })}
                required={formData.errorsOmissionsInsurance}
                className={luxuryInputClasses}
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#E5DFC6] pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-6 w-1 bg-[#C7A962]/60 rounded-full" />
          <h4 className="font-secondary text-lg text-[#0a2225]">Commission Payment Setup</h4>
        </div>
        <p className="mb-5 text-sm text-[#6B7280] ml-4">
          You'll connect your bank account securely through Stripe after approval
        </p>
        
        <div className="rounded-xl bg-[#FDF9F0] border border-[#E5DFC6] p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white border border-[#C7A962]/30 flex items-center justify-center">
              <Shield className="h-6 w-6 text-[#C7A962]" />
            </div>
            <div>
              <h4 className="font-secondary text-lg text-[#0a2225] mb-2">
                Secure Payment via Stripe Connect
              </h4>
              <p className="text-sm text-[#6B7280] mb-4">
                After your application is approved, you'll securely connect your bank account
                through Stripe. This ensures:
              </p>
              <ul className="space-y-2 text-sm text-[#4a4a4a]">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4d47] flex-shrink-0" />
                  Your banking details are never stored by <em className="font-secondary">Goldsainte</em>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4d47] flex-shrink-0" />
                  Bank-level security & PCI compliance
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4d47] flex-shrink-0" />
                  Fast, automatic commission deposits
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4d47] flex-shrink-0" />
                  Transparent payout tracking
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4d47] flex-shrink-0" />
                  Automatic tax form generation (1099-K)
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#C7A962]/30 bg-[#FDF9F0]/50 p-4">
          <p className="text-xs text-[#6B7280]">
            <strong className="text-[#0a2225]">Note:</strong> You don't need to provide banking information now.
            Once approved, you'll receive an email with a secure link to connect your
            bank account through Stripe in 2-3 minutes.
          </p>
        </div>
      </div>
    </div>
  );
};
