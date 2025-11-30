import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TripFAQsProps {
  faqs: Array<{ question: string; answer: string }>;
}

export function TripFAQs({ faqs }: TripFAQsProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">
        Frequently Asked Questions
      </h2>

      <Accordion type="single" collapsible className="mt-4 space-y-2">
        {faqs.map((faq, idx) => (
          <AccordionItem
            key={idx}
            value={`faq-${idx}`}
            className="border-b border-[#E5DFC6]/50 last:border-b-0"
          >
            <AccordionTrigger className="py-3 text-left text-[15px] font-medium text-[#0a2225] hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-[14px] leading-relaxed text-[#4a4a4a]">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
