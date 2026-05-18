import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const newsroomPageShellClass = "max-w-5xl mx-auto px-5 sm:px-6 py-8 sm:py-10 md:py-20";
export const newsroomPageSectionClass = "pt-10 md:pt-12 border-t border-[#E5DFC6]";
export const newsroomSectionTitleClass = "font-secondary text-[24px] sm:text-[28px] md:text-[32px] leading-[1.08] text-[#0a2225]";
export const newsroomFieldClass = "mt-2 h-11 w-full rounded-sm border border-[#E5DFC6] bg-white px-3.5 text-[13px] text-[#0a2225] focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/20 focus:border-[#0c4d47] transition";
export const newsroomTextAreaClass = "mt-2 w-full rounded-sm border border-[#E5DFC6] bg-white px-3.5 py-3 text-[13px] text-[#0a2225] focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/20 focus:border-[#0c4d47] transition";
export const newsroomFieldLabelClass = "text-[9px] sm:text-[10px] uppercase tracking-[0.18em] sm:tracking-[0.22em] text-[#0a2225]/60";

type HeaderProps = {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  centered?: boolean;
  className?: string;
};

export function NewsroomPageHeader({ eyebrow, title, intro, centered = false, className }: HeaderProps) {
  return (
    <header className={cn(centered ? "text-center mx-auto max-w-3xl" : "max-w-3xl", className)}>
      <p className="mb-3 sm:mb-4 text-[9px] sm:text-[10px] uppercase tracking-[0.22em] sm:tracking-[0.28em] text-[#0c4d47]">
        {eyebrow}
      </p>
      <h1 className="font-secondary text-[28px] sm:text-[34px] md:text-[46px] leading-[1.02] text-[#0a2225]">
        {title}
      </h1>
      {intro ? (
        <div
          className={cn(
            "mt-4 sm:mt-5 text-[15px] sm:text-base leading-[1.7] text-[#0a2225]/68",
            centered && "mx-auto",
          )}
        >
          {intro}
        </div>
      ) : null}
    </header>
  );
}

type PickerOption = {
  label: string;
  value: string;
};

type MobilePickerProps = {
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
};

export function NewsroomMobilePicker({
  label,
  value,
  options,
  onChange,
  className,
  triggerClassName,
}: MobilePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);

  const activeLabel = useMemo(
    () => options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "",
    [options, value],
  );

  useEffect(() => {
    function handlePointer(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, top: r.bottom + 6, width: r.width });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <span className="sr-only">{label}</span>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-sm border border-[#E5DFC6] bg-white px-3 text-left text-[10px] uppercase tracking-[0.12em] text-[#0a2225] transition-colors hover:border-[#d6cfb7] focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/20",
          triggerClassName,
        )}
      >
        <span className="min-w-0 truncate font-sans leading-none">{activeLabel}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#0a2225]/55 transition-transform", open && "rotate-180")} />
      </button>

      {open && rect
        ? createPortal(
            <div
              style={{
                position: "fixed",
                left: rect.left,
                top: rect.top,
                width: rect.width,
                zIndex: 9999,
              }}
              className="overflow-hidden rounded-sm border border-[#E5DFC6] bg-white shadow-[0_20px_48px_-28px_rgba(10,34,37,0.45)]"
            >
              <div role="listbox" aria-label={label} className="py-1.5">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.12em] transition-colors",
                    active
                      ? "bg-[#F6F0E4] text-[#0c4d47]"
                      : "text-[#0a2225]/78 hover:bg-[#FAF6EC]",
                  )}
                >
                  <span className="min-w-0 font-sans leading-none">{option.label}</span>
                  {active ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
                </button>
              );
            })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}