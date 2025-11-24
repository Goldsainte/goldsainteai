import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step7Props {
  formData: any;
  setFormData: (data: any) => void;
}

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
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Technology & Tools</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="crm">CRM Software</Label>
            <Input
              id="crm"
              placeholder="e.g., ClientBase, TravelWorks, Zoho"
              value={formData.crmSoftware || ""}
              onChange={(e) => setFormData({ ...formData, crmSoftware: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="bookingPlatform">Primary Booking Platform</Label>
            <Input
              id="bookingPlatform"
              placeholder="e.g., Travefy, Axus, Sabre"
              value={formData.bookingPlatform || ""}
              onChange={(e) => setFormData({ ...formData, bookingPlatform: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="accounting">Accounting Software</Label>
            <Input
              id="accounting"
              placeholder="e.g., QuickBooks, Xero, FreshBooks"
              value={formData.accountingSoftware || ""}
              onChange={(e) => setFormData({ ...formData, accountingSoftware: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="websitePlatform">Website Platform</Label>
            <Input
              id="websitePlatform"
              placeholder="e.g., WordPress, Wix, Custom"
              value={formData.websitePlatform || ""}
              onChange={(e) => setFormData({ ...formData, websitePlatform: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2 mt-6">
            <Checkbox
              id="ownBookingEngine"
              checked={formData.hasOwnBookingEngine || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, hasOwnBookingEngine: checked })
              }
            />
            <Label htmlFor="ownBookingEngine" className="text-sm cursor-pointer">
              I have my own online booking engine on my website
            </Label>
          </div>

          <div>
            <Label htmlFor="techComfort">Tech Comfort Level (1-5)</Label>
            <Select
              value={formData.comfortableWithTechnology?.toString() || ""}
              onValueChange={(value) => 
                setFormData({ ...formData, comfortableWithTechnology: parseInt(value) })
              }
            >
              <SelectTrigger>
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

          <div className="md:col-span-2 border-t pt-4">
            <h4 className="mb-3 text-base font-semibold">Video Conferencing Tools</h4>
            <div className="flex flex-wrap gap-3">
              {videoToolsOptions.map((tool) => (
                <div key={tool} className="flex items-center space-x-2">
                  <Checkbox
                    id={`video-${tool}`}
                    checked={(formData.videoConferencingTools || []).includes(tool)}
                    onCheckedChange={() => toggleVideoTool(tool)}
                  />
                  <Label htmlFor={`video-${tool}`} className="text-sm cursor-pointer">
                    {tool}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 border-t pt-4">
            <h4 className="mb-3 text-base font-semibold">AI Tools Experience</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Do you use AI tools in your travel business?
            </p>
            <div className="flex flex-wrap gap-3">
              {aiToolsOptions.map((tool) => (
                <div key={tool} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ai-${tool}`}
                    checked={(formData.aiToolsExperience || []).includes(tool)}
                    onCheckedChange={() => toggleAiTool(tool)}
                  />
                  <Label htmlFor={`ai-${tool}`} className="text-sm cursor-pointer">
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