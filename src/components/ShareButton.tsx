import { useState } from "react";
import { Share2, Check, Copy, X } from "lucide-react";

interface Props {
  url: string;
  title: string;
  description?: string;
  /** Visual variant. `icon` = 32px circular overlay (cards). `pill` = inline button with label. */
  variant?: "icon" | "pill";
  className?: string;
  label?: string;
}

export function ShareButton({ url, title, description, variant = "pill", className = "", label = "Share" }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const fullUrl = url.startsWith("http")
    ? url
    : `${typeof window !== "undefined" ? window.location.origin : "https://goldsainte.ai"}${url}`;
  const shareText = `${title}${description ? " — " + description : ""}`;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: fullUrl });
        return;
      } catch {
        /* fall through to modal on cancel/error */
      }
    }
    setOpen(true);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const baseLink =
    "flex items-center gap-2 rounded-lg border border-[#E5DFC6] bg-white px-3 py-2 text-sm text-[#0a2225] hover:bg-[#F6F0E4] transition-colors";

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Share"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/85 backdrop-blur shadow-sm ring-1 ring-black/5 transition hover:bg-white ${className}`}
        >
          <Share2 className="h-4 w-4 text-[#0a2225]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-sm font-medium text-[#0a2225] hover:bg-[#F6F0E4] transition-colors ${className}`}
        >
          <Share2 className="h-4 w-4" />
          {label}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#F7F3EA] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-secondary text-lg text-[#0a2225]">Share this</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-[#6B7280] hover:bg-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 truncate rounded-lg bg-white px-3 py-2 text-xs text-[#6B7280]">{fullUrl}</p>

            <div className="space-y-2">
              <button type="button" onClick={handleCopy} className={`${baseLink} w-full justify-between`}>
                <span className="flex items-center gap-2">
                  {copied ? (
                    <Check className="h-4 w-4 text-[#0c4d47]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy link"}
                </span>
              </button>
              <a
                className={baseLink}
                target="_blank"
                rel="noopener noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + fullUrl)}`}
                onClick={(e) => e.stopPropagation()}
              >
                WhatsApp
              </a>
              <a
                className={baseLink}
                href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText + "\n\n" + fullUrl)}`}
                onClick={(e) => e.stopPropagation()}
              >
                Email
              </a>
              <a
                className={baseLink}
                target="_blank"
                rel="noopener noreferrer"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`}
                onClick={(e) => e.stopPropagation()}
              >
                X (Twitter)
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}