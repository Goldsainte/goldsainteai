import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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
    <div className="bg-[#FDF9F0] text-[#0a2225] flex-1 py-24 px-6">
      <section className="w-full max-w-2xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-5">
          {eyebrow}
        </p>
        <h1 className="font-secondary text-3xl sm:text-4xl md:text-5xl leading-[1.08] tracking-tight text-[#0a2225] mb-8">
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
          <p className="text-base text-[#0a2225]/70 leading-relaxed max-w-md mx-auto">
            {subtitle}
          </p>
        )}
      </section>
    </div>
  );
}