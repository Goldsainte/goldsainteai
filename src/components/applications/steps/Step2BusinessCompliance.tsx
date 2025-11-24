import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step2Props {
  formData: any;
  setFormData: (data: any) => void;
}

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
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Business Structure & Compliance</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="dbaNames">DBA Names (Doing Business As)</Label>
            <Input
              id="dbaNames"
              placeholder="Enter any DBA names, comma-separated"
              value={formData.dbaNames || ""}
              onChange={(e) => setFormData({ ...formData, dbaNames: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <Label className="mb-2 block">Operating States *</Label>
            <div className="flex flex-wrap gap-3">
              {stateOptions.map((state) => (
                <div key={state} className="flex items-center space-x-2">
                  <Checkbox
                    id={`state-${state}`}
                    checked={(formData.operatingStates || []).includes(state)}
                    onCheckedChange={() => toggleState(state)}
                  />
                  <Label htmlFor={`state-${state}`} className="text-sm cursor-pointer">
                    {state}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Label className="mb-2 block">Seller of Travel Registration States</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Required in CA, FL, HI, WA for selling travel services
            </p>
            <div className="flex flex-wrap gap-3">
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
                  />
                  <Label htmlFor={`seller-${state}`} className="text-sm cursor-pointer">
                    {state}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="floridaReg">Florida Registration #</Label>
            <Input
              id="floridaReg"
              value={formData.floridaRegistrationNumber || ""}
              onChange={(e) => setFormData({ ...formData, floridaRegistrationNumber: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="californiaReg">California Registration #</Label>
            <Input
              id="californiaReg"
              value={formData.californiaRegistrationNumber || ""}
              onChange={(e) => setFormData({ ...formData, californiaRegistrationNumber: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="hawaiiReg">Hawaii Registration #</Label>
            <Input
              id="hawaiiReg"
              value={formData.hawaiiRegistrationNumber || ""}
              onChange={(e) => setFormData({ ...formData, hawaiiRegistrationNumber: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="washingtonReg">Washington Registration #</Label>
            <Input
              id="washingtonReg"
              value={formData.washingtonRegistrationNumber || ""}
              onChange={(e) => setFormData({ ...formData, washingtonRegistrationNumber: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="suretyBondAmount">Surety Bond Amount ($)</Label>
            <Input
              id="suretyBondAmount"
              type="number"
              placeholder="e.g., 50000"
              value={formData.suretyBondAmount || ""}
              onChange={(e) => setFormData({ ...formData, suretyBondAmount: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="suretyBondProvider">Surety Bond Provider</Label>
            <Input
              id="suretyBondProvider"
              value={formData.suretyBondProvider || ""}
              onChange={(e) => setFormData({ ...formData, suretyBondProvider: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="suretyBondExpiration">Bond Expiration Date</Label>
            <Input
              id="suretyBondExpiration"
              type="date"
              value={formData.suretyBondExpiration || ""}
              onChange={(e) => setFormData({ ...formData, suretyBondExpiration: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 space-y-4 border-t pt-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="backgroundCheck"
                checked={formData.backgroundCheckConsent || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, backgroundCheckConsent: checked })
                }
              />
              <Label htmlFor="backgroundCheck" className="text-sm cursor-pointer leading-tight">
                I consent to a background check as part of the vetting process *
              </Label>
            </div>

            <div>
              <Label htmlFor="criminalHistory">Criminal History Disclosure</Label>
              <Textarea
                id="criminalHistory"
                placeholder="Disclose any criminal history, if applicable. This does not automatically disqualify you."
                value={formData.criminalHistoryDisclosure || ""}
                onChange={(e) => setFormData({ ...formData, criminalHistoryDisclosure: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};