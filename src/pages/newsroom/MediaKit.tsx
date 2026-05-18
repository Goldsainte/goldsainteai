import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import {
  BASE_URL,
  COMPANY_BOILERPLATE_LONG,
  COMPANY_BOILERPLATE_MEDIUM,
  COMPANY_BOILERPLATE_SHORT,
} from "./lib";

const COLORS = [
  { name: "Cream", hex: "#FDF9F0" },
  { name: "Ink", hex: "#0a2225" },
  { name: "Forest", hex: "#0c4d47" },
  { name: "Gold", hex: "#C7A962" },
];

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
}

export default function MediaKit() {
  return (
    <>
      <Helmet>
        <title>Media Kit | Goldsainte Newsroom</title>
        <meta name="description" content="Download Goldsainte logos, brand assets, founder headshots, and boilerplate." />
        <link rel="canonical" href={`${BASE_URL}/newsroom/media-kit`} />
      </Helmet>
      <div className="max-w-5xl mx-auto px-6 py-20 space-y-20">
        <header>
          <h1 className="font-secondary text-xl md:text-2xl md:text-3xl md:text-4xl mb-4">Media Kit</h1>
          <p className="text-[#0a2225]/70 max-w-2xl">
            Logos, headshots, product imagery, and approved boilerplate for editorial use.
            For custom requests, email{" "}
            <a className="text-[#0c4d47] underline" href="mailto:press@goldsainte.com">press@goldsainte.com</a>.
          </p>
          <a
            href="mailto:press@goldsainte.com?subject=Goldsainte%20Media%20Kit%20Request"
            className="mt-6 inline-block px-6 py-3 rounded-full bg-[#0c4d47] text-white text-sm tracking-wide hover:bg-[#0a3d39]"
          >
            Request full kit (ZIP)
          </a>
        </header>

        <section>
          <h2 className="font-secondary text-xl md:text-2xl md:text-3xl mb-6">Brand Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => copy(c.hex, c.name)}
                className="text-left border border-[#0a2225]/15 hover:border-[#0c4d47] transition"
              >
                <div className="aspect-square" style={{ background: c.hex }} />
                <div className="p-3">
                  <p className="font-secondary text-lg">{c.name}</p>
                  <p className="text-xs text-[#0a2225]/60 font-mono">{c.hex}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-secondary text-xl md:text-2xl md:text-3xl mb-6">Typography</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="border border-[#0a2225]/15 p-6">
              <p className="font-secondary text-xl md:text-2xl md:text-3xl mb-2">Serif Display</p>
              <p className="text-[#0a2225]/60">Used for headlines and editorial titles.</p>
            </div>
            <div className="border border-[#0a2225]/15 p-6">
              <p className="text-3xl mb-2">Sans Body</p>
              <p className="text-[#0a2225]/60">Used for body copy, UI, and metadata.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-secondary text-xl md:text-2xl md:text-3xl mb-6">Approved Boilerplate</h2>
          <div className="space-y-6">
            {[
              ["~30 words", COMPANY_BOILERPLATE_SHORT],
              ["~50 words", COMPANY_BOILERPLATE_MEDIUM],
              ["~100 words", COMPANY_BOILERPLATE_LONG],
            ].map(([label, text]) => (
              <div key={label} className="border border-[#0a2225]/15 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-[#C7A962]">{label}</span>
                  <button
                    onClick={() => copy(text, "Boilerplate")}
                    className="text-xs uppercase tracking-wider text-[#0c4d47] hover:underline"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-[#0a2225]/80">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-secondary text-xl md:text-2xl md:text-3xl mb-6">Logos & Headshots</h2>
          <p className="text-sm text-[#0a2225]/60 max-w-xl">
            High-resolution logo files (PNG/SVG, light & dark) and founder headshots are available on request.
            Email <a className="text-[#0c4d47] underline" href="mailto:press@goldsainte.com">press@goldsainte.com</a>.
          </p>
        </section>
      </div>
    </>
  );
}