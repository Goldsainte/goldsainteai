import { Helmet } from "react-helmet-async";
import { BASE_URL } from "./lib";

export default function EditorialPolicy() {
  return (
    <>
      <Helmet>
        <title>Editorial Policy | Goldsainte Newsroom</title>
        <meta name="description" content="Goldsainte editorial standards, sourcing practices, corrections policy, and disclosures." />
        <link rel="canonical" href={`${BASE_URL}/newsroom/editorial-policy`} />
      </Helmet>
      <div className="max-w-3xl mx-auto px-6 py-20 font-secondary">
        <h1 className="text-3xl md:text-4xl mb-6">Editorial Policy</h1>
        <p className="text-[#0a2225]/70 mb-12 leading-relaxed text-base">
          The Goldsainte Newsroom publishes original press releases, company news, and editorial commentary on the travel industry.
          Our work is guided by the standards below.
        </p>

        <Section title="Editorial Integrity">
          We publish accurate, sourced, and clearly attributed information. Opinion and analysis pieces are labelled and signed by their author. We do not pay sources, and we do not accept payment in exchange for editorial coverage.
        </Section>

        <Section title="Sources of Funding">
          Goldsainte is privately funded and generates revenue through marketplace transaction fees. The newsroom is editorially independent of business teams. We do not run paid sponsorships in editorial articles; promotional partnerships, where they exist, are clearly disclosed as such.
        </Section>

        <Section title="Sponsored Content Disclosure">
          If an article is sponsored, paid, or produced in partnership with a third party, it is labelled prominently at the top of the page. The Goldsainte Newsroom has published no sponsored content to date.
        </Section>

        <Section title="Corrections Policy">
          We correct material errors promptly. Substantive corrections are noted at the bottom of the affected article with the date and nature of the correction. To request a correction, email{" "}
          <a href="mailto:corrections@goldsainte.com" className="text-[#0c4d47] underline">corrections@goldsainte.com</a>.
        </Section>

        <Section title="Author Guidelines">
          All articles credit a named author. Authors disclose any personal or financial conflict of interest related to the subject matter. Articles citing data points include links to primary sources where possible.
        </Section>

        <Section title="Diversity Statement">
          We are committed to publishing voices and perspectives that reflect the diversity of travelers, creators, and agents we serve — across geography, race, gender, age, ability, and economic background.
        </Section>

        <Section title="Contact">
          For editorial questions:{" "}
          <a href="mailto:editor@goldsainte.com" className="text-[#0c4d47] underline">editor@goldsainte.com</a>.
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl md:text-2xl mb-3">{title}</h2>
      <p className="text-[#0a2225]/80 leading-relaxed font-sans text-base">{children}</p>
    </section>
  );
}