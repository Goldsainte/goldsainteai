import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Sparkles, Briefcase } from "lucide-react";

interface AccountTypeSelectorProps {
  currentType: 'personal' | 'creator' | 'business';
  onTypeChange: (type: 'personal' | 'creator' | 'business') => void;
  showBadgeToggle: boolean;
  onShowBadgeChange: (show: boolean) => void;
}

export const AccountTypeSelector = ({
  currentType,
  onTypeChange,
  showBadgeToggle,
  onShowBadgeChange
}: AccountTypeSelectorProps) => {
  const accountTypes = [
    {
      value: 'personal' as const,
      label: 'Personal Account',
      icon: Users,
      description: 'For individual use with basic features',
      features: ['Post photos and videos', 'Follow and interact', 'Private or public profile']
    },
    {
      value: 'creator' as const,
      label: 'Creator Account',
      icon: Sparkles,
      description: 'For content creators, influencers, and public figures',
      features: ['All personal features', 'Analytics dashboard', 'Sponsored content labels', 'Contact buttons', 'Monetization tools']
    },
    {
      value: 'business' as const,
      label: 'Business Account',
      icon: Briefcase,
      description: 'For brands, businesses, and storefronts',
      features: ['All creator features', 'Shopping profile', 'Business location', 'Enhanced contact options', 'Gold verification badge (after verification)']
    }
  ];

  return (
    <div className="space-y-6">
      <RadioGroup value={currentType} onValueChange={(value) => onTypeChange(value as any)}>
        {accountTypes.map((type) => (
          <Card key={type.value} className={currentType === type.value ? 'border-primary' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <RadioGroupItem value={type.value} id={type.value} />
                <div className="flex-1">
                  <Label htmlFor={type.value} className="flex items-center gap-2 cursor-pointer">
                    <type.icon className="h-5 w-5" />
                    <span className="font-semibold">{type.label}</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    {type.features.map((feature, idx) => (
                      <li key={idx}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </RadioGroup>

      {/* Show/Hide Badge Toggle */}
      {currentType !== 'personal' && (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label>Show account type on profile</Label>
            <p className="text-sm text-muted-foreground">Display your account type badge below your bio</p>
          </div>
          <Checkbox checked={showBadgeToggle} onCheckedChange={(checked) => (onShowBadgeChange)(checked === true)} />
        </div>
      )}
    </div>
  );
};
