import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        <h3 className="mb-4 text-lg font-semibold">Banking Information</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          For commission payments. Your information is encrypted and secure.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              value={formData.bankName || ""}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="accountHolderName">Account Holder Name *</Label>
            <Input
              id="accountHolderName"
              placeholder="Full name on account"
              value={formData.accountHolderName || ""}
              onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="accountType">Account Type *</Label>
            <Select
              value={formData.accountType || ""}
              onValueChange={(value) => setFormData({ ...formData, accountType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="routingNumber">Routing Number *</Label>
            <Input
              id="routingNumber"
              placeholder="9 digits"
              value={formData.routingNumber || ""}
              onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
              maxLength={9}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              type="password"
              placeholder="Will be encrypted"
              value={formData.accountNumber || ""}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Only the last 4 digits will be stored for verification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
