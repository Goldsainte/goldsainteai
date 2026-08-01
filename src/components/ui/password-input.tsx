/* PasswordInput (31 Jul) — the base Input with a show/hide password toggle.
 * Requested launch morning: email-and-password signups had no way to see
 * what they typed, and a typo'd password at signup becomes a "wrong
 * password" support ticket on day one.
 *
 * Used by: sign-in, signup (Auth.tsx) and both reset-password fields.
 *
 * Implementation notes:
 *  - The toggle is a real button with aria-label + aria-pressed, tabbable,
 *    so keyboard and screen-reader users get it too.
 *  - type="button" so it can never submit the surrounding form.
 *  - Right padding is pinned at BOTH breakpoints (pr-12 sm:pr-12) — the base
 *    Input's `px-3 sm:px-4` overrides unpinned caller padding above mobile
 *    (backlog 5.2, third bite was the admin search on 30 Jul); without the
 *    sm: pin, typed text would slide under the eye icon on desktop. */
import { forwardRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-12 sm:pr-12", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={0}
          aria-label={visible ? t('auth.pwHide') : t('auth.pwShow')}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          disabled={props.disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#6B7280] transition-colors hover:text-[#0a2225] focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50 disabled:opacity-40"
        >
          {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
