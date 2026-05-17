import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export function SimpleHelpArticle({ eyebrow, title, children }: Props) {
  return (
    <main className="flex-1 bg-[#FDF9F0]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 md:py-16">
        <Link to="/help" className="inline-flex items-center gap-1.5 text-sm text-[#0c4d47] hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Help Center
        </Link>
        <p className="text-xs uppercase tracking-[0.2em] text-[#C7A962] font-medium mb-3">{eyebrow}</p>
        <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225] mb-6">{title}</h1>
        <div className="prose prose-sm max-w-none text-[#4A4A4A] space-y-4 leading-relaxed">
          {children}
        </div>
      </div>
    </main>
  );
}