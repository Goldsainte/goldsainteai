import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is a Promoted Vendor?",
    answer: "Promoted Vendors receive priority placement in agent and creator trip-planning tools, featured status in AI voice search results, and a promoted badge on their profile. This tier is designed to maximize your visibility to travelers, agents, and content creators actively building luxury travel experiences."
  },
  {
    question: "How do Sponsored Posts work?",
    answer: "Sponsored Posts allow you to promote your service directly in the Goldsainte social feed and trip-planning interface. You can partner with travel influencers, track engagement metrics, and measure ROI. Sponsored Posts are available as part of the Premium tier."
  },
  {
    question: "How does the AI Concierge feature vendors?",
    answer: "Our 'Hey Goldsainte' AI concierge uses voice recognition to help travelers book services. Promoted Vendors receive priority in AI search results, making your business more discoverable when travelers ask for transportation recommendations."
  },
  {
    question: "Can I collaborate with travel creators?",
    answer: "Yes! Promoted Vendors and Premium tier members can partner with travel influencers and content creators on the platform. Your service can be featured in their content and linked to creator-led travel packages."
  },
  {
    question: "How do I get paid?",
    answer: "We process payments weekly via direct deposit to your bank account. All completed bookings are paid out within 7 business days. You can track all earnings and upcoming payments in your vendor dashboard."
  },
  {
    question: "What commission does Goldsainte take?",
    answer: "Our standard commission is 15% of each booking. This covers payment processing, customer support, marketing, and platform maintenance. There are no hidden fees or additional charges beyond this transparent commission structure."
  },
  {
    question: "Can I set my own prices?",
    answer: "Absolutely! You have complete control over your pricing. Set base rates, add surcharges for peak times or special services, and adjust your pricing strategy anytime through your dashboard."
  },
  {
    question: "What markets are you in?",
    answer: "We currently operate in 50+ cities across North America, Europe, and Asia. We're rapidly expanding to new markets. If your city isn't listed yet, apply anyway – we prioritize expansion based on partner interest."
  },
  {
    question: "How long is the approval process?",
    answer: "Our verification process typically takes 3-5 business days. We review your business license, insurance, vehicle documentation, and conduct background checks. We'll communicate clearly throughout and let you know immediately if we need any additional information."
  },
  {
    question: "What insurance do I need?",
    answer: "You need commercial passenger transportation insurance with a minimum of $1 million liability coverage. This protects you, your passengers, and our platform. We can provide recommendations for insurance providers who specialize in luxury transportation if needed."
  },
  {
    question: "Can I cancel bookings?",
    answer: "Yes, but we encourage accepting all bookings to maintain a high reliability rating. If you must cancel, do so as early as possible through the app. Frequent cancellations may affect your visibility on the platform."
  },
  {
    question: "Do you provide customer support for my passengers?",
    answer: "Yes! We have a 24/7 customer support team that handles passenger inquiries, changes, and issues. This frees you to focus on driving. For any urgent on-trip issues, both you and passengers can reach our support team instantly."
  }
];

export const PartnersFAQ = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about partnering with Goldsainte
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
