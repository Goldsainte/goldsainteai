import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46', country: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+41', country: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+852', country: 'HK', flag: '🇭🇰', name: 'Hong Kong' },
];

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CountryCodeSelect({ value, onChange, disabled }: CountryCodeSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[100px] rounded-xl">
        <SelectValue>
          {COUNTRY_CODES.find(c => c.code === value)?.flag || '🌍'} {value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {COUNTRY_CODES.map((country) => (
          <SelectItem 
            key={`${country.country}-${country.code}`} 
            value={country.code}
          >
            <span className="flex items-center gap-2">
              <span>{country.flag}</span>
              <span>{country.code}</span>
              <span className="text-muted-foreground text-xs">{country.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
