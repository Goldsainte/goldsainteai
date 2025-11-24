import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step4Props {
  formData: any;
  setFormData: (data: any) => void;
}

export const Step4ExperienceExpertise = ({ formData, setFormData }: Step4Props) => {
  const continentOptions = ["North America", "South America", "Europe", "Asia", "Africa", "Australia", "Antarctica"];
  
  const toggleContinent = (continent: string) => {
    const current = formData.continentsVisited || [];
    if (current.includes(continent)) {
      setFormData({ 
        ...formData, 
        continentsVisited: current.filter((c: string) => c !== continent) 
      });
    } else {
      setFormData({ 
        ...formData, 
        continentsVisited: [...current, continent] 
      });
    }
  };

  const languageOptions = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Japanese", "Mandarin", "Arabic", "Other"];
  
  const toggleLanguage = (language: string) => {
    const current = formData.languagesSpoken || [];
    if (current.includes(language)) {
      setFormData({ 
        ...formData, 
        languagesSpoken: current.filter((l: string) => l !== language) 
      });
    } else {
      setFormData({ 
        ...formData, 
        languagesSpoken: [...current, language] 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Travel Experience & Expertise</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="countriesVisited">Countries Visited Count</Label>
            <Input
              id="countriesVisited"
              type="number"
              placeholder="How many countries have you personally visited?"
              value={formData.countriesVisitedCount || ""}
              onChange={(e) => setFormData({ ...formData, countriesVisitedCount: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="famTrips">FAM Trips (Last 12 Months)</Label>
            <Input
              id="famTrips"
              type="number"
              placeholder="Familiarization trips"
              value={formData.famTripsTakenLastYear || ""}
              onChange={(e) => setFormData({ ...formData, famTripsTakenLastYear: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <Label className="mb-2 block">Continents Visited</Label>
            <div className="flex flex-wrap gap-3">
              {continentOptions.map((continent) => (
                <div key={continent} className="flex items-center space-x-2">
                  <Checkbox
                    id={`continent-${continent}`}
                    checked={(formData.continentsVisited || []).includes(continent)}
                    onCheckedChange={() => toggleContinent(continent)}
                  />
                  <Label htmlFor={`continent-${continent}`} className="text-sm cursor-pointer">
                    {continent}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="destCertifications">Destination Expert Certifications</Label>
            <Input
              id="destCertifications"
              placeholder="e.g., Sandals Specialist, Jamaica Tourist Board Certified, etc. (comma-separated)"
              value={(formData.destinationExpertCertifications || []).join(", ")}
              onChange={(e) => setFormData({ 
                ...formData, 
                destinationExpertCertifications: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
              })}
            />
          </div>

          <div>
            <Label htmlFor="cruiseExp">Cruise Experience Level</Label>
            <Select
              value={formData.cruiseExperienceLevel || ""}
              onValueChange={(value) => 
                setFormData({ ...formData, cruiseExperienceLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="experienced">Experienced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="allInclusiveExp">All-Inclusive Experience</Label>
            <Select
              value={formData.allInclusiveExperience || ""}
              onValueChange={(value) => 
                setFormData({ ...formData, allInclusiveExperience: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="some">Some Experience</SelectItem>
                <SelectItem value="extensive">Extensive Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="accessibility"
                checked={formData.accessibilityTravelExperience || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, accessibilityTravelExperience: checked })
                }
              />
              <Label htmlFor="accessibility" className="text-sm cursor-pointer">
                Accessibility / Special Needs Travel Experience
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="multigenerational"
                checked={formData.multigenerationalTravelExperience || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, multigenerationalTravelExperience: checked })
                }
              />
              <Label htmlFor="multigenerational" className="text-sm cursor-pointer">
                Multi-Generational Travel Experience
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="soloTravel"
                checked={formData.soloTravelBookingExperience || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, soloTravelBookingExperience: checked })
                }
              />
              <Label htmlFor="soloTravel" className="text-sm cursor-pointer">
                Solo Travel Booking Experience
              </Label>
            </div>
          </div>

          <div className="md:col-span-2 border-t pt-4">
            <h4 className="mb-3 text-base font-semibold">Languages</h4>
            <Label className="mb-2 block">Languages Spoken</Label>
            <div className="flex flex-wrap gap-3">
              {languageOptions.map((language) => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lang-${language}`}
                    checked={(formData.languagesSpoken || []).includes(language)}
                    onCheckedChange={() => toggleLanguage(language)}
                  />
                  <Label htmlFor={`lang-${language}`} className="text-sm cursor-pointer">
                    {language}
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