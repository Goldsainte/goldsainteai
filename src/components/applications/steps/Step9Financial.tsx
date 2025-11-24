import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, CheckCircle2 } from "lucide-react";

interface Step9Props {
  formData: any;
  setFormData: (data: any) => void;
}

export const Step9Financial = ({ formData, setFormData }: Step9Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Financial Information</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="annualRevenue">Annual Revenue</Label>
            <Select
              value={formData.annualRevenue || ""}
              onValueChange={(value) => setFormData({ ...formData, annualRevenue: value })}
            >
              <SelectTrigger>
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

      <div className="border-t pt-4">
        <h3 className="mb-4 text-lg font-semibold">Errors & Omissions Insurance</h3>
        
        <div className="mb-4 flex items-center space-x-2">
          <Checkbox
            id="errorsOmissionsInsurance"
            checked={formData.errorsOmissionsInsurance || false}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, errorsOmissionsInsurance: checked })
            }
          />
          <Label htmlFor="errorsOmissionsInsurance" className="cursor-pointer">
            I have Errors & Omissions Insurance
          </Label>
        </div>

        {formData.errorsOmissionsInsurance && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="insuranceProvider">Insurance Provider *</Label>
              <Input
                id="insuranceProvider"
                value={formData.insuranceProvider || ""}
                onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                required={formData.errorsOmissionsInsurance}
              />
            </div>

            <div>
              <Label htmlFor="insurancePolicyNumber">Policy Number *</Label>
              <Input
                id="insurancePolicyNumber"
                value={formData.insurancePolicyNumber || ""}
                onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                required={formData.errorsOmissionsInsurance}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="insuranceCoverage">Coverage Amount *</Label>
              <Input
                id="insuranceCoverage"
                placeholder="e.g., $1,000,000"
                value={formData.insuranceCoverage || ""}
                onChange={(e) => setFormData({ ...formData, insuranceCoverage: e.target.value })}
                required={formData.errorsOmissionsInsurance}
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="mb-2 text-lg font-semibold text-[#0a2225]">
          Commission Payment Setup
        </h3>
        <p className="mb-4 text-sm text-[#8D8D8D]">
          You'll connect your bank account securely through Stripe after approval
        </p>
        
        <div className="rounded-lg bg-[#f7f3ea] p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-[#0c4d47] flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-[#0a2225] mb-2">
                Secure Payment via Stripe Connect
              </h4>
              <p className="text-sm text-[#4a4a4a] mb-3">
                After your application is approved, you'll securely connect your bank account
                through Stripe. This ensures:
              </p>
              <ul className="space-y-1.5 text-sm text-[#4a4a4a]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4d47] flex-shrink-0" />
                  Your banking details are never stored by Goldsainte
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4d47] flex-shrink-0" />
                  Bank-level security & PCI compliance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4d47] flex-shrink-0" />
                  Fast, automatic commission deposits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4d47] flex-shrink-0" />
                  Transparent payout tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4d47] flex-shrink-0" />
                  Automatic tax form generation (1099-K)
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-blue-900">
            <strong>Note:</strong> You don't need to provide banking information now.
            Once approved, you'll receive an email with a secure link to connect your
            bank account through Stripe in 2-3 minutes.
          </p>
        </div>
      </div>
    </div>
  );
};
