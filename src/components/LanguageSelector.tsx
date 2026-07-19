// LanguageSelector — self-sufficient (2026-07-19): reads and switches the
// live i18n language directly, persists to localStorage ('appLanguage', the
// key src/i18n/config.ts boots from), and flips document direction for RTL.
// Mount it anywhere with <LanguageSelector /> — no props required.
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const LanguageSelector = ({
  variant = "ghost",
  size = "sm",
  className = "gap-2 text-[#BFAD72] hover:text-white transition-colors",
}: LanguageSelectorProps) => {
  const { i18n } = useTranslation();
  const current = (i18n.language || 'en').split('-')[0];
  const currentLang = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem('appLanguage', code);
    } catch {
      /* storage unavailable is fine */
    }
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} aria-label="Change language">
          <Globe className="h-4 w-4" />
          <span className="uppercase font-medium">{currentLang.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={current === lang.code ? "bg-accent" : ""}
          >
            <span className="flex items-center justify-between w-full">
              <span>{lang.name}</span>
              {current === lang.code && (
                <span className="text-xs text-muted-foreground">✓</span>
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
