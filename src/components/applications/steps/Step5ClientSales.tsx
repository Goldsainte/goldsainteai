import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface Step5Props {
  formData: any;
  setFormData: (data: any) => void;
}

export const Step5ClientSales = ({ formData, setFormData }: Step5Props) => {
  const gdsOptions = ["Sabre", "Amadeus", "Apollo", "Worldspan", "Galileo"];
  
  const toggleGds = (gds: string) => {
    const current = formData.gdsAccess || [];
    if (current.includes(gds)) {
      setFormData({ 
        ...formData, 
        gdsAccess: current.filter((g: string) => g !== gds) 
      });
    } else {
      setFormData({ 
        ...formData, 
        gdsAccess: [...current, gds] 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Client Focus & Sales Metrics</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="annualSales">Annual Sales Volume</Label>
            <Input
              id="annualSales"
              placeholder="e.g., $500k-$1M"
              value={formData.annualSalesVolume || ""}
              onChange={(e) => setFormData({ ...formData, annualSalesVolume: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="activeClients">Number of Active Clients</Label>
            <Input
              id="activeClients"
              type="number"
              placeholder="How many active clients do you serve?"
              value={formData.numberOfActiveClients || ""}
              onChange={(e) => setFormData({ ...formData, numberOfActiveClients: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="repeatClients">Repeat Clients (%)</Label>
            <Input
              id="repeatClients"
              type="number"
              min="0"
              max="100"
              placeholder="Percentage of repeat customers"
              value={formData.percentageRepeatClients || ""}
              onChange={(e) => setFormData({ ...formData, percentageRepeatClients: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="referralBusiness">Referral Business (%)</Label>
            <Input
              id="referralBusiness"
              type="number"
              min="0"
              max="100"
              placeholder="Percentage from referrals"
              value={formData.percentageReferralBusiness || ""}
              onChange={(e) => setFormData({ ...formData, percentageReferralBusiness: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="bookingVolume">Bookings (Last 12 Months)</Label>
            <Input
              id="bookingVolume"
              type="number"
              placeholder="Total number of bookings"
              value={formData.bookingVolumeLast12Months || ""}
              onChange={(e) => setFormData({ ...formData, bookingVolumeLast12Months: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="avgCommission">Average Commission (%)</Label>
            <Input
              id="avgCommission"
              type="number"
              step="0.1"
              placeholder="e.g., 10, 12.5, 15"
              value={formData.averageCommissionPercentage || ""}
              onChange={(e) => setFormData({ ...formData, averageCommissionPercentage: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="clientDemo">Client Demographics</Label>
            <Input
              id="clientDemo"
              placeholder="e.g., High-net-worth couples, Families, Corporate executives (comma-separated)"
              value={(formData.clientDemographics || []).join(", ")}
              onChange={(e) => setFormData({ 
                ...formData, 
                clientDemographics: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
              })}
            />
          </div>

          <div>
            <Label htmlFor="clientAgeRange">Average Client Age Range</Label>
            <Input
              id="clientAgeRange"
              placeholder="e.g., 35-55, 45-65"
              value={formData.averageClientAgeRange || ""}
              onChange={(e) => setFormData({ ...formData, averageClientAgeRange: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 border-t pt-4">
            <h4 className="mb-3 text-base font-semibold">Technology & Platforms</h4>
            
            <div className="mb-4">
              <Label className="mb-2 block">GDS Access (Global Distribution Systems)</Label>
              <div className="flex flex-wrap gap-3">
                {gdsOptions.map((gds) => (
                  <div key={gds} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gds-${gds}`}
                      checked={(formData.gdsAccess || []).includes(gds)}
                      onCheckedChange={() => toggleGds(gds)}
                    />
                    <Label htmlFor={`gds-${gds}`} className="text-sm cursor-pointer">
                      {gds}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="bookingPlatforms">Booking Platforms</Label>
                <Input
                  id="bookingPlatforms"
                  placeholder="e.g., ClientBase, Travefy, Axus (comma-separated)"
                  value={(formData.preferredBookingPlatforms || []).join(", ")}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    preferredBookingPlatforms: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
                  })}
                />
              </div>

              <div>
                <Label htmlFor="suppliers">Preferred Suppliers</Label>
                <Input
                  id="suppliers"
                  placeholder="Tour operators, cruise lines, etc. (comma-separated)"
                  value={(formData.preferredSuppliers || []).join(", ")}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    preferredSuppliers: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
                  })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="consortiums">Consortium Memberships</Label>
                <Input
                  id="consortiums"
                  placeholder="e.g., Virtuoso, Signature, CCRA (comma-separated)"
                  value={(formData.consortiumMemberships || []).join(", ")}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    consortiumMemberships: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};