import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const SERIF = "'Cormorant Garamond', Georgia, serif";

type Status = "processing" | "success" | "error";

interface EditorialLoaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  status?: Status;
}

/**
 * Shared editorial loading / status screen used for the OAuth and identity
 * callback pages. Matches the luxury aesthetic (cream bg, serif italic display,
 * gold eyebrow, hairline ink rule). Renders between the global Header/Footer.
 */
export function EditorialLoader({
  eyebrow,
  title,
  subtitle,
  status = "processing",
}: EditorialLoaderProps) {
  return (
    <div className="bg-[#f7f3ea] text-[#0a2225] flex-1 py-24 px-6 selection:bg-[#c9a84c]/30">
      <section className="w-full max-w-xl mx-auto text-center">
        <div className="flex justify-center mb-10">
          <div className="w-px h-16 bg-[#0a2225]" />
        </div>
        <span className="block uppercase tracking-[0.3em] text-[9px] font-bold mb-8 text-[#c9a84c]">
          {eyebrow}
        </span>
        <h1
          className="text-5xl md:text-6xl italic mb-10 tracking-tight leading-[0.95]"
          style={{ fontFamily: SERIF }}
        >
          {title}
        </h1>
        <div className="flex justify-center mb-6">
          {status === "processing" && (
            <Loader2 className="h-5 w-5 animate-spin text-[#0c4d47]" strokeWidth={1.5} />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-5 w-5 text-[#0c4d47]" strokeWidth={1.5} />
          )}
          {status === "error" && (
            <AlertCircle className="h-5 w-5 text-[#0a2225]" strokeWidth={1.5} />
          )}
        </div>
        {subtitle && (
          <p className="text-base leading-relaxed max-w-sm mx-auto text-[#0a2225]/70 font-light">
            {subtitle}
          </p>
        )}
      </section>
    </div>
  );
}