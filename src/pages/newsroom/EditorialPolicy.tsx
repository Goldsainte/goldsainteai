import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { BASE_URL } from "./lib";

export default function EditorialPolicy() {
  return (
    <>
      <Helmet>
        <title>Editorial Philosophy | Goldsainte Newsroom</title>
        <meta
          name="description"
          content="The Goldsainte editorial philosophy: what we publish, our standards, our perspective on the future of travel."
        />
        <link rel="canonical" href={`${BASE_URL}/newsroom/editorial-policy`} />
      </Helmet>

      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28">
        {/* Hero */}
        <header className="mb-20 md:mb-24 animate-fade-in">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-5">
            Editorial Philosophy
          </p>
          <h1 className="font-secondary text-2xl md:text-3xl leading-[1.2] mb-6">
            The Goldsainte Newsroom exists to explore the future of modern
            travel through thoughtful storytelling, company news, industry
            insight, and curated editorial perspectives.
          </h1>
          <p className="text-base text-[#0a2225]/70 leading-relaxed">
            Our editorial approach is guided by clarity, trust, design, and the
            belief that extraordinary travel begins long before a booking is
            made.
          </p>
        </header>

        <Divider />

        <Section eyebrow="01" title="What We Publish">
          <p>The newsroom publishes:</p>
          <ul className="mt-4 space-y-2 text-[#0a2225]/80">
            {[
              "Official company announcements",
              "Product and platform updates",
              "Travel industry commentary",
              "Creator and destination features",
              "Marketplace insights",
              "Founder perspectives and interviews",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-[#C7A962] mt-2 text-[8px]">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[#0a2225]/70">
            All editorial content is reviewed internally for accuracy, tone, and
            brand alignment prior to publication.
          </p>
        </Section>

        <Divider />

        <Section eyebrow="02" title="Editorial Standards">
          <p>
            We aim to publish information that is accurate, clearly sourced, and
            transparently presented.
          </p>
          <p>
            Opinion-based articles, commentary, and founder perspectives are
            identified as such. Promotional partnerships or sponsored
            collaborations, where applicable, are disclosed clearly within the
            content.
          </p>
          <p>
            Goldsainte does not accept payment in exchange for editorial
            coverage.
          </p>
        </Section>

        {/* Pull quote */}
        <figure className="my-24 md:my-28 text-center animate-fade-in">
          <blockquote className="font-secondary text-2xl md:text-3xl leading-[1.25] text-[#0a2225]">
            <span className="text-[#C7A962] mr-1">“</span>
            Extraordinary travel begins with perspective.
            <span className="text-[#C7A962] ml-1">”</span>
          </blockquote>
          <div className="mt-6 mx-auto w-10 h-px bg-[#C7A962]" />
        </figure>

        <Section eyebrow="03" title="Our Perspective">
          <p>
            Goldsainte believes the future of travel is more personal, more
            curated, and more human.
          </p>
          <p>
            We believe travelers increasingly value trusted expertise,
            creator-driven discovery, thoughtful planning, and elevated
            experiences over transactional booking platforms alone.
          </p>
          <p className="text-[#0a2225]/65 italic">
            The newsroom reflects that perspective.
          </p>
        </Section>

        <Divider />

        <Section eyebrow="04" title="Corrections & Updates">
          <p>
            If a material error is identified, we will update the affected
            article and provide clarification where appropriate.
          </p>
          <p>
            Editorial questions or correction requests may be directed to{" "}
            <a
              href="mailto:editor@goldsainte.ai"
              className="text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225] transition-colors"
            >
              editor@goldsainte.ai
            </a>
            .
          </p>
        </Section>

        <Divider />

        <Section eyebrow="05" title="Media & Press Contact">
          <p>
            For press inquiries, interviews, speaking opportunities, or
            editorial requests:
          </p>
          <p>
            <a
              href="mailto:press@goldsainte.ai"
              className="text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225] transition-colors"
            >
              press@goldsainte.ai
            </a>
          </p>
        </Section>

        {/* Footer CTA */}
        <div className="mt-24 md:mt-28 pt-12 border-t border-[#E5DFC6] text-center animate-fade-in">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-4">
            Continue Reading
          </p>
          <h3 className="font-secondary text-2xl md:text-3xl leading-tight mb-6">
            Explore the Goldsainte Newsroom.
          </h3>
          <Link
            to="/newsroom"
            className="inline-block text-xs uppercase tracking-[0.25em] text-white bg-[#0c4d47] px-7 py-4 rounded-full hover:bg-[#0a3d39] transition-colors"
          >
            Visit the Newsroom →
          </Link>
        </div>
      </div>
    </>
  );
}

function Divider() {
  return <div className="my-16 md:my-20 h-px bg-[#E5DFC6]" />;
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-in">
      {eyebrow && (
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#0a2225]/40 mb-4">
          {eyebrow}
        </p>
      )}
      <h2 className="font-secondary text-xl md:text-2xl leading-tight mb-6 text-[#0a2225]">
        {title}
      </h2>
      <div className="space-y-5 text-base text-[#0a2225]/80 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
