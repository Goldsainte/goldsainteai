import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step7Props {
  formData: any;
  setFormData: (data: any) => void;
}

const luxuryInputClasses = "mt-1.5 min-h-[48px] w-full max-w-full border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 focus:ring-offset-0 rounded-lg placeholder:text-sm box-border";

export const Step7Technology = ({ formData, setFormData }: Step7Props) => {
  const videoToolsOptions = ["Zoom", "Microsoft Teams", "Google Meet", "Skype"];
  const aiToolsOptions = ["ChatGPT", "Claude", "Midjourney", "Other AI Tools"];

  const toggleVideoTool = (tool: string) => {
    const current = formData.videoConferencingTools || [];
    if (current.includes(tool)) {
      setFormData({ 
        ...formData, 
        videoConferencingTools: current.filter((t: string) => t !== tool) 
      });
    } else {
      setFormData({ 
        ...formData, 
        videoConferencingTools: [...current, tool] 
      });
    }
  };

  const toggleAiTool = (tool: string) => {
    const current = formData.aiToolsExperience || [];
    if (current.includes(tool)) {
      setFormData({ 
        ...formData, 
        aiToolsExperience: current.filter((t: string) => t !== tool) 
      });
    } else {
      setFormData({ 
        ...formData, 
        aiToolsExperience: [...current, tool] 
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Technology & Tools</h3>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="crm" className="text-sm font-medium text-[#0a2225]">CRM Software</Label>
            <Input
              id="crm"
              placeholder="e.g., ClientBase, TravelWorks, Zoho"
              value={formData.crmSoftware || ""}
              onChange={(e) => setFormData({ ...formData, crmSoftware: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="bookingPlatform" className="text-sm font-medium text-[#0a2225]">Primary Booking Platform</Label>
            <Input
              id="bookingPlatform"
              placeholder="e.g., Travefy, Axus, Sabre"
              value={formData.bookingPlatform || ""}
              onChange={(e) => setFormData({ ...formData, bookingPlatform: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="accounting" className="text-sm font-medium text-[#0a2225]">Accounting Software</Label>
            <Input
              id="accounting"
              placeholder="e.g., QuickBooks, Xero, FreshBooks"
              value={formData.accountingSoftware || ""}
              onChange={(e) => setFormData({ ...formData, accountingSoftware: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="websitePlatform" className="text-sm font-medium text-[#0a2225]">Website Platform</Label>
            <Input
              id="websitePlatform"
              placeholder="e.g., WordPress, Wix, Custom"
              value={formData.websitePlatform || ""}
              onChange={(e) => setFormData({ ...formData, websitePlatform: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div className="flex items-center space-x-3 mt-6">
            <Checkbox
              id="ownBookingEngine"
              checked={formData.hasOwnBookingEngine || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, hasOwnBookingEngine: checked })
              }
              className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
            />
            <Label htmlFor="ownBookingEngine" className="text-sm cursor-pointer text-[#0a2225]">
              I have my own online booking engine on my website
            </Label>
          </div>

          <div>
            <Label htmlFor="techComfort" className="text-sm font-medium text-[#0a2225]">Tech Comfort Level (1-5)</Label>
            <Select
              value={formData.comfortableWithTechnology?.toString() || ""}
              onValueChange={(value) => 
                setFormData({ ...formData, comfortableWithTechnology: parseInt(value) })
              }
            >
              <SelectTrigger className={luxuryInputClasses}>
                <SelectValue placeholder="Rate your tech comfort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Not comfortable</SelectItem>
                <SelectItem value="2">2 - Basic</SelectItem>
                <SelectItem value="3">3 - Moderate</SelectItem>
                <SelectItem value="4">4 - Advanced</SelectItem>
                <SelectItem value="5">5 - Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 border-t border-[#E5DFC6] pt-6 mt-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-1 bg-[#C7A962]/60 rounded-full" />
              <h4 className="font-secondary text-lg text-[#0a2225]">Video Conferencing Tools</h4>
            </div>
            <div className="flex flex-wrap gap-4">
              {videoToolsOptions.map((tool) => (
                <div key={tool} className="flex items-center space-x-2">
                  <Checkbox
                    id={`video-${tool}`}
                    checked={(formData.videoConferencingTools || []).includes(tool)}
                    onCheckedChange={() => toggleVideoTool(tool)}
                    className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                  />
                  <Label htmlFor={`video-${tool}`} className="text-sm cursor-pointer text-[#0a2225]">
                    {tool}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 border-t border-[#E5DFC6] pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-6 w-1 bg-[#C7A962]/60 rounded-full" />
              <h4 className="font-secondary text-lg text-[#0a2225]">AI Tools Experience</h4>
            </div>
            <p className="text-sm text-[#6B7280] mb-4 ml-4">
              Do you use AI tools in your travel business?
            </p>
            <div className="flex flex-wrap gap-4">
              {aiToolsOptions.map((tool) => (
                <div key={tool} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ai-${tool}`}
                    checked={(formData.aiToolsExperience || []).includes(tool)}
                    onCheckedChange={() => toggleAiTool(tool)}
                    className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                  />
                  <Label htmlFor={`ai-${tool}`} className="text-sm cursor-pointer text-[#0a2225]">
                    {tool}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
