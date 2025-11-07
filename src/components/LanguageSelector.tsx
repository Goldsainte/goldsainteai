import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'ko', name: '한국어' },
  { code: 'ar', name: 'العربية' },
];

interface LanguageSelectorProps {
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export const LanguageSelector = ({ 
  currentLanguage = 'en', 
  onLanguageChange,
  variant = "ghost",
  size = "sm"
}: LanguageSelectorProps) => {
  const currentLang = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

  const handleLanguageChange = (code: string) => {
    if (onLanguageChange) {
      onLanguageChange(code);
    }
    // Store in localStorage for persistence
    localStorage.setItem('appLanguage', code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2 text-[#BFAD72] hover:text-white transition-colors">
          <Globe className="h-4 w-4" />
          <span className="uppercase font-medium">{currentLang.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={currentLanguage === lang.code ? "bg-accent" : ""}
          >
            <span className="flex items-center justify-between w-full">
              <span>{lang.name}</span>
              {currentLanguage === lang.code && (
                <span className="text-xs text-muted-foreground">✓</span>
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
