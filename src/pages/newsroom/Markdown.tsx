import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

export default function Markdown({ source }: { source: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(source || "", { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [source]);
  return (
    <div
      className="prose prose-lg max-w-none font-serif text-[#0a2225] leading-relaxed
        prose-headings:font-serif prose-headings:text-[#0a2225]
        prose-a:text-[#0c4d47] prose-a:underline-offset-4
        prose-blockquote:border-l-[#0c4d47] prose-blockquote:text-[#0a2225]/80
        prose-img:rounded"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}