import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

export default function Markdown({ source, variant = "editorial" }: { source: string; variant?: "editorial" | "feature" }) {
  const html = useMemo(() => {
    const raw = marked.parse(source || "", { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [source]);
  if (variant === "editorial") {
    return (
      <div
        className="prose-editorial"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <div
      className="newsroom-prose max-w-none text-[#0a2225]
        font-sans text-[17px] leading-[1.75]
        [&_p]:mb-6 [&_p]:text-[#0a2225]/85
        [&_h2]:font-secondary [&_h2]:text-[#0a2225] [&_h2]:text-2xl md:[&_h2]:text-[28px]
        [&_h2]:leading-tight [&_h2]:mt-16 [&_h2]:mb-6 [&_h2]:tracking-tight
        [&_h3]:font-secondary [&_h3]:text-xl [&_h3]:mt-12 [&_h3]:mb-4
        [&_a]:text-[#0c4d47] [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-[#0a2225]
        [&_ul]:my-6 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul>li]:list-disc [&_ul>li]:marker:text-[#C7A962]
        [&_em]:text-[#0a2225]/70
        [&_blockquote]:my-14 [&_blockquote]:px-2 md:[&_blockquote]:px-6
        [&_blockquote]:border-0 [&_blockquote]:text-center
        [&_blockquote_p]:font-secondary [&_blockquote_p]:not-italic
        [&_blockquote_p]:text-2xl md:[&_blockquote_p]:text-[30px]
        [&_blockquote_p]:leading-[1.25] [&_blockquote_p]:text-[#0a2225]
        [&_blockquote_p]:before:content-['\u201C'] [&_blockquote_p]:before:text-[#C7A962] [&_blockquote_p]:before:mr-1
        [&_blockquote_p]:after:content-['\u201D'] [&_blockquote_p]:after:text-[#C7A962] [&_blockquote_p]:after:ml-1
        [&_img]:my-12 [&_img]:w-screen [&_img]:max-w-[100vw]
        [&_img]:relative [&_img]:left-1/2 [&_img]:right-1/2 [&_img]:-mx-[50vw]
        [&_img]:aspect-[16/9] [&_img]:object-cover
      "
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}