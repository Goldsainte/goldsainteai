import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step2Props {
  formData: any;
  setFormData: (data: any) => void;
}

const luxuryInputClasses = "mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg";

export const Step2BusinessCompliance = ({ formData, setFormData }: Step2Props) => {
  const stateOptions = ["CA", "FL", "HI", "WA", "NY", "TX", "IL", "Other"];
  
  const toggleState = (state: string) => {
    const current = formData.operatingStates || [];
    if (current.includes(state)) {
      setFormData({ 
        ...formData, 
        operatingStates: current.filter((s: string) => s !== state) 
      });
    } else {
      setFormData({ 
        ...formData, 
        operatingStates: [...current, state] 
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Business Structure & Compliance</h3>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="dbaNames" className="text-sm font-medium text-[#0a2225]">DBA Names (Doing Business As)</Label>
            <Input
              id="dbaNames"
              placeholder="Enter any DBA names, comma-separated"
              value={formData.dbaNames || ""}
              onChange={(e) => setFormData({ ...formData, dbaNames: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div className="md:col-span-2">
            <Label className="mb-3 block text-sm font-medium text-[#0a2225]">Operating States *</Label>
            <div className="flex flex-wrap gap-4">
              {stateOptions.map((state) => (
                <div key={state} className="flex items-center space-x-2">
                  <Checkbox
                    id={`state-${state}`}
                    checked={(formData.operatingStates || []).includes(state)}
                    onCheckedChange={() => toggleState(state)}
                    className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                  />
                  <Label htmlFor={`state-${state}`} className="text-sm cursor-pointer text-[#0a2225]">
                    {state}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Label className="mb-2 block text-sm font-medium text-[#0a2225]">Seller of Travel Registration States</Label>
            <p className="text-xs text-[#6B7280] mb-3">
              Required in CA, FL, HI, WA for selling travel services
            </p>
            <div className="flex flex-wrap gap-4">
              {["CA", "FL", "HI", "WA"].map((state) => (
                <div key={state} className="flex items-center space-x-2">
                  <Checkbox
                    id={`seller-${state}`}
                    checked={(formData.sellerOfTravelStates || []).includes(state)}
                    onCheckedChange={() => {
                      const current = formData.sellerOfTravelStates || [];
                      if (current.includes(state)) {
                        setFormData({ 
                          ...formData, 
                          sellerOfTravelStates: current.filter((s: string) => s !== state) 
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          sellerOfTravelStates: [...current, state] 
                        });
                      }
                    }}
                    className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                  />
                  <Label htmlFor={`seller-${state}`} className="text-sm cursor-pointer text-[#0a2225]">
                    {state}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="floridaReg" className="text-sm font-medium text-[#0a2225]">Florida Registration #</Label>
            <Input
              id="floridaReg"
              value={formData.floridaRegistrationNumber || ""}
              onChange={(e) => setFormData({ ...formData, floridaRegistrationNumber: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="californiaReg" className="text-sm font-medium text-[#0a2225]">California Registration #</Label>
            <Input
              id="californiaReg"
              value={formData.californiaRegistrationNumber || ""}
              onChange={(e) => setFormData({ ...formData, californiaRegistrationNumber: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="hawaiiReg" className="text-sm font-medium text-[#0a2225]">Hawaii Registration #</Label>
            <Input
              id="hawaiiReg"
              value={formData.hawaiiRegistrationNumber || ""}
              onChange={(e) => setFormData({ ...formData, hawaiiRegistrationNumber: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="washingtonReg" className="text-sm font-medium text-[#0a2225]">Washington Registration #</Label>
            <Input
              id="washingtonReg"
              value={formData.washingtonRegistrationNumber || ""}
              onChange={(e) => setFormData({ ...formData, washingtonRegistrationNumber: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="suretyBondAmount" className="text-sm font-medium text-[#0a2225]">Surety Bond Amount ($)</Label>
            <Input
              id="suretyBondAmount"
              type="number"
              placeholder="e.g., 50000"
              value={formData.suretyBondAmount || ""}
              onChange={(e) => setFormData({ ...formData, suretyBondAmount: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="suretyBondProvider" className="text-sm font-medium text-[#0a2225]">Surety Bond Provider</Label>
            <Input
              id="suretyBondProvider"
              value={formData.suretyBondProvider || ""}
              onChange={(e) => setFormData({ ...formData, suretyBondProvider: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="suretyBondExpiration" className="text-sm font-medium text-[#0a2225]">Bond Expiration Date</Label>
            <Input
              id="suretyBondExpiration"
              type="date"
              value={formData.suretyBondExpiration || ""}
              onChange={(e) => setFormData({ ...formData, suretyBondExpiration: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div className="md:col-span-2 space-y-5 border-t border-[#E5DFC6] pt-6 mt-2">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="backgroundCheck"
                checked={formData.backgroundCheckConsent || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, backgroundCheckConsent: checked })
                }
                className="mt-0.5 border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
              />
              <Label htmlFor="backgroundCheck" className="text-sm cursor-pointer leading-relaxed text-[#0a2225]">
                I consent to a background check as part of the vetting process *
              </Label>
            </div>

            <div>
              <Label htmlFor="criminalHistory" className="text-sm font-medium text-[#0a2225]">Criminal History Disclosure</Label>
              <Textarea
                id="criminalHistory"
                placeholder="Disclose any criminal history, if applicable. This does not automatically disqualify you."
                value={formData.criminalHistoryDisclosure || ""}
                onChange={(e) => setFormData({ ...formData, criminalHistoryDisclosure: e.target.value })}
                className="mt-1.5 min-h-[100px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
