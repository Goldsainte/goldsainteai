import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface Step5Props {
  formData: any;
  setFormData: (data: any) => void;
}

const luxuryInputClasses = "mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg placeholder:text-sm";

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
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Client Focus & Sales Metrics</h3>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="annualSales" className="text-sm font-medium text-[#0a2225]">Annual Sales Volume</Label>
            <Input
              id="annualSales"
              placeholder="e.g., $500k-$1M"
              value={formData.annualSalesVolume || ""}
              onChange={(e) => setFormData({ ...formData, annualSalesVolume: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="activeClients" className="text-sm font-medium text-[#0a2225]">Number of Active Clients</Label>
            <Input
              id="activeClients"
              type="number"
              placeholder="How many active clients do you serve?"
              value={formData.numberOfActiveClients || ""}
              onChange={(e) => setFormData({ ...formData, numberOfActiveClients: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="repeatClients" className="text-sm font-medium text-[#0a2225]">Repeat Clients (%)</Label>
            <Input
              id="repeatClients"
              type="number"
              min="0"
              max="100"
              placeholder="Percentage of repeat customers"
              value={formData.percentageRepeatClients || ""}
              onChange={(e) => setFormData({ ...formData, percentageRepeatClients: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="referralBusiness" className="text-sm font-medium text-[#0a2225]">Referral Business (%)</Label>
            <Input
              id="referralBusiness"
              type="number"
              min="0"
              max="100"
              placeholder="Percentage from referrals"
              value={formData.percentageReferralBusiness || ""}
              onChange={(e) => setFormData({ ...formData, percentageReferralBusiness: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="bookingVolume" className="text-sm font-medium text-[#0a2225]">Bookings (Last 12 Months)</Label>
            <Input
              id="bookingVolume"
              type="number"
              placeholder="Total number of bookings"
              value={formData.bookingVolumeLast12Months || ""}
              onChange={(e) => setFormData({ ...formData, bookingVolumeLast12Months: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="avgCommission" className="text-sm font-medium text-[#0a2225]">Average Commission (%)</Label>
            <Input
              id="avgCommission"
              type="number"
              step="0.1"
              placeholder="e.g., 10, 12.5, 15"
              value={formData.averageCommissionPercentage || ""}
              onChange={(e) => setFormData({ ...formData, averageCommissionPercentage: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="clientDemo" className="text-sm font-medium text-[#0a2225]">Client Demographics</Label>
            <Input
              id="clientDemo"
              placeholder="e.g., High-net-worth couples, Families, Corporate executives (comma-separated)"
              value={(formData.clientDemographics || []).join(", ")}
              onChange={(e) => setFormData({ 
                ...formData, 
                clientDemographics: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
              })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="clientAgeRange" className="text-sm font-medium text-[#0a2225]">Average Client Age Range</Label>
            <Input
              id="clientAgeRange"
              placeholder="e.g., 35-55, 45-65"
              value={formData.averageClientAgeRange || ""}
              onChange={(e) => setFormData({ ...formData, averageClientAgeRange: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div className="md:col-span-2 border-t border-[#E5DFC6] pt-6 mt-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-6 w-1 bg-[#C7A962]/60 rounded-full" />
              <h4 className="font-secondary text-lg text-[#0a2225]">Technology & Platforms</h4>
            </div>
            
            <div className="mb-5">
              <Label className="mb-3 block text-sm font-medium text-[#0a2225]">GDS Access (Global Distribution Systems)</Label>
              <div className="flex flex-wrap gap-4">
                {gdsOptions.map((gds) => (
                  <div key={gds} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gds-${gds}`}
                      checked={(formData.gdsAccess || []).includes(gds)}
                      onCheckedChange={() => toggleGds(gds)}
                      className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                    />
                    <Label htmlFor={`gds-${gds}`} className="text-sm cursor-pointer text-[#0a2225]">
                      {gds}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="bookingPlatforms" className="text-sm font-medium text-[#0a2225]">Booking Platforms</Label>
                <Input
                  id="bookingPlatforms"
                  placeholder="e.g., ClientBase, Travefy, Axus (comma-separated)"
                  value={(formData.preferredBookingPlatforms || []).join(", ")}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    preferredBookingPlatforms: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
                  })}
                  className={luxuryInputClasses}
                />
              </div>

              <div>
                <Label htmlFor="suppliers" className="text-sm font-medium text-[#0a2225]">Preferred Suppliers</Label>
                <Input
                  id="suppliers"
                  placeholder="Tour operators, cruise lines, etc. (comma-separated)"
                  value={(formData.preferredSuppliers || []).join(", ")}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    preferredSuppliers: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
                  })}
                  className={luxuryInputClasses}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="consortiums" className="text-sm font-medium text-[#0a2225]">Consortium Memberships</Label>
                <Input
                  id="consortiums"
                  placeholder="e.g., Virtuoso, Signature, CCRA (comma-separated)"
                  value={(formData.consortiumMemberships || []).join(", ")}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    consortiumMemberships: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
                  })}
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
