import luxuryVilla from "@/assets/luxury-destinations.webp";

export const WhyGoldsainte = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={luxuryVilla}
          alt="Luxury travel destination at dusk"
          className="w-full h-full object-cover"
        loading="lazy"/>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/60" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-secondary text-5xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-wide">
            Where Technology Meets Timeless Travel
          </h2>
          <p className="text-xl md:text-2xl text-white/90 leading-relaxed font-light">
            Goldsainte connects discerning explorers with expert agents and creators who know every hidden gem. 
            Experience travel that's curated by humans, powered by AI, and designed for those who seek the extraordinary.
          </p>
        </div>
      </div>
    </section>
  );
};
