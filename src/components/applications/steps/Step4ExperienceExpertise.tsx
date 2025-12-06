import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step4Props {
  formData: any;
  setFormData: (data: any) => void;
}

const luxuryInputClasses = "mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg placeholder:text-sm";

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
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Travel Experience & Expertise</h3>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="countriesVisited" className="text-sm font-medium text-[#0a2225]">Countries Visited Count</Label>
            <Input
              id="countriesVisited"
              type="number"
              placeholder="How many countries have you personally visited?"
              value={formData.countriesVisitedCount || ""}
              onChange={(e) => setFormData({ ...formData, countriesVisitedCount: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="famTrips" className="text-sm font-medium text-[#0a2225]">FAM Trips (Last 12 Months)</Label>
            <Input
              id="famTrips"
              type="number"
              placeholder="Familiarization trips"
              value={formData.famTripsTakenLastYear || ""}
              onChange={(e) => setFormData({ ...formData, famTripsTakenLastYear: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div className="md:col-span-2">
            <Label className="mb-3 block text-sm font-medium text-[#0a2225]">Continents Visited</Label>
            <div className="flex flex-wrap gap-4">
              {continentOptions.map((continent) => (
                <div key={continent} className="flex items-center space-x-2">
                  <Checkbox
                    id={`continent-${continent}`}
                    checked={(formData.continentsVisited || []).includes(continent)}
                    onCheckedChange={() => toggleContinent(continent)}
                    className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                  />
                  <Label htmlFor={`continent-${continent}`} className="text-sm cursor-pointer text-[#0a2225]">
                    {continent}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="destCertifications" className="text-sm font-medium text-[#0a2225]">Destination Expert Certifications</Label>
            <Input
              id="destCertifications"
              placeholder="e.g., Sandals Specialist, Jamaica Tourist Board Certified, etc. (comma-separated)"
              value={(formData.destinationExpertCertifications || []).join(", ")}
              onChange={(e) => setFormData({ 
                ...formData, 
                destinationExpertCertifications: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
              })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="cruiseExp" className="text-sm font-medium text-[#0a2225]">Cruise Experience Level</Label>
            <Select
              value={formData.cruiseExperienceLevel || ""}
              onValueChange={(value) => 
                setFormData({ ...formData, cruiseExperienceLevel: value })
              }
            >
              <SelectTrigger className={luxuryInputClasses}>
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
            <Label htmlFor="allInclusiveExp" className="text-sm font-medium text-[#0a2225]">All-Inclusive Experience</Label>
            <Select
              value={formData.allInclusiveExperience || ""}
              onValueChange={(value) => 
                setFormData({ ...formData, allInclusiveExperience: value })
              }
            >
              <SelectTrigger className={luxuryInputClasses}>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="some">Some Experience</SelectItem>
                <SelectItem value="extensive">Extensive Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="accessibility"
                checked={formData.accessibilityTravelExperience || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, accessibilityTravelExperience: checked })
                }
                className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
              />
              <Label htmlFor="accessibility" className="text-sm cursor-pointer text-[#0a2225]">
                Accessibility / Special Needs Travel Experience
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="multigenerational"
                checked={formData.multigenerationalTravelExperience || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, multigenerationalTravelExperience: checked })
                }
                className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
              />
              <Label htmlFor="multigenerational" className="text-sm cursor-pointer text-[#0a2225]">
                Multi-Generational Travel Experience
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="soloTravel"
                checked={formData.soloTravelBookingExperience || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, soloTravelBookingExperience: checked })
                }
                className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
              />
              <Label htmlFor="soloTravel" className="text-sm cursor-pointer text-[#0a2225]">
                Solo Travel Booking Experience
              </Label>
            </div>
          </div>

          <div className="md:col-span-2 border-t border-[#E5DFC6] pt-6 mt-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-6 w-1 bg-[#C7A962]/60 rounded-full" />
              <h4 className="font-secondary text-lg text-[#0a2225]">Languages</h4>
            </div>
            <Label className="mb-3 block text-sm font-medium text-[#0a2225]">Languages Spoken</Label>
            <div className="flex flex-wrap gap-4">
              {languageOptions.map((language) => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lang-${language}`}
                    checked={(formData.languagesSpoken || []).includes(language)}
                    onCheckedChange={() => toggleLanguage(language)}
                    className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                  />
                  <Label htmlFor={`lang-${language}`} className="text-sm cursor-pointer text-[#0a2225]">
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
