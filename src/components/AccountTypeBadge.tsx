import { Badge } from "@/components/ui/badge";

interface AccountTypeBadgeProps {
  accountType: 'personal' | 'creator' | 'business';
  showBadge: boolean;
}

export const AccountTypeBadge = ({ accountType, showBadge }: AccountTypeBadgeProps) => {
  if (!showBadge || accountType === 'personal') return null;

  const badgeConfig = {
    creator: {
      label: 'Creator Account',
      className: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    business: {
      label: 'Business Account',
      className: 'bg-blue-50 text-blue-700 border-blue-200'
    }
  };

  const config = badgeConfig[accountType];
  if (!config) return null;

  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
};
