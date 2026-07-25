import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  question: string;
  answer: string;
  category?: string;
}

interface TripFAQAccordionProps {
  listingType?: string;
  destination?: string;
  faqs: FAQ[];
}

const DEFAULT_FAQS: FAQ[] = [
  {
    question: "What's it like to travel on a Goldsainte Trip?",
    answer: "Goldsainte trips are curated group travel experiences led by creators and travel professionals you trust. You'll travel with like-minded explorers, enjoy handpicked accommodations, and experience destinations through the unique lens of your host.",
    category: "Traveling with Goldsainte",
  },
  {
    question: "How does a Goldsainte Trip actually work?",
    answer: "Your Host curates the experience and builds community, while our trusted Trip Operators handle all logistics—hotels, transportation, activities, and guides. Goldsainte provides the platform, payment protection, and support throughout your journey.",
    category: "Traveling with Goldsainte",
  },
  {
    question: "Can I book solo?",
    answer: "Absolutely! Many of our travelers are solo adventurers looking to connect with like-minded people. You'll be paired with a roommate unless you opt for a private room upgrade.",
    category: "Traveling with Goldsainte",
  },
  {
    question: "What if I need to cancel?",
    answer: "We understand plans change. Check the cancellation policy section for this specific trip. We highly recommend travel insurance to protect your investment.",
    category: "Traveling with Goldsainte",
  },
  {
    question: "What does 'or similar' mean next to accommodations?",
    answer: "We secure the best available accommodations that match the quality and style described. In rare cases, we may substitute with a similar property of equal or better quality.",
    category: "Accommodations",
  },
  {
    question: "Are flights included in the trip cost?",
    answer: "Flights are typically not included unless specifically noted. This allows you flexibility in booking from your preferred departure city and airline.",
    category: "General Travel Questions",
  },
  {
    question: "Do I need any vaccines?",
    answer: "Vaccine requirements vary by destination. We recommend consulting the CDC's travel health page and your healthcare provider for the most current guidance.",
    category: "General Travel Questions",
  },
  {
    question: "Can you accommodate my dietary needs?",
    answer: "We do our best to accommodate dietary requirements. Please note your needs during booking, and we'll communicate with our operators. Some cuisines may have limitations for certain diets.",
    category: "General Travel Questions",
  },
];

// Tour listings get tour-shaped questions — meeting points and what to
// bring, not vaccines and flight inclusions (founder catch, Jul 24).
// Truly listing-personalized FAQs (AI, per destination) are flagged post-launch.
const buildTourFaqs = (destination?: string): FAQ[] => {
  const place = destination || "the area";
  return [
    { question: "What's it like on a Goldsainte Tour?", answer: `A small-group experience in ${place}, designed and hosted by the local creator who built it — their spots, their pace, their stories.`, category: "About this tour" },
    { question: "How does booking work?", answer: "Reserve your spot with the deposit shown. Your host confirms the details in Messages, and any balance is due before the tour per the payment terms above.", category: "About this tour" },
    { question: "Can I book solo?", answer: "Absolutely — most tours welcome solo travelers, and small groups make it easy to meet people.", category: "About this tour" },
    { question: "Where do we meet?", answer: `The exact meeting point in ${place} is shared in Messages after you book.`, category: "Logistics" },
    { question: "What should I bring?", answer: "Comfortable shoes and weather-appropriate clothing are the usual essentials — your host will message anything specific to this tour.", category: "Logistics" },
    { question: "What if I need to cancel?", answer: "This tour follows the host's cancellation policy shown above — review it before booking.", category: "Logistics" },
  ];
};

export function TripFAQAccordion({ faqs, listingType, destination }: TripFAQAccordionProps) {
  const resolvedFaqs =
    faqs && faqs.length > 0
      ? faqs
      : listingType === "tour"
        ? buildTourFaqs(destination)
        : DEFAULT_FAQS;
  // Group FAQs by category
  const groupedFaqs = resolvedFaqs.reduce((acc, faq) => {
    const category = faq.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">
        Frequently Asked Questions
      </h2>

      <div className="mt-4 space-y-6">
        {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
          <div key={category}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#7A7151]">
              {category}
            </h3>
            <Accordion type="single" collapsible className="space-y-2">
              {categoryFaqs.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`${category}-${idx}`}
                  className="rounded-xl border border-[#E5DFC6] overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 text-left text-[14px] font-medium text-[#0a2225] hover:no-underline hover:bg-[#FDF9F0]/50">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-[#E5DFC6]/50 bg-[#FDF9F0]/30 px-4 py-4 text-[14px] leading-relaxed text-[#4a4a4a]">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  );
}
