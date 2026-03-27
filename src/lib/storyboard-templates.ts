export interface StoryboardTemplate {
  id: string;
  name: string;
  description: string;
  fonts: { heading: string; body: string };
  colors: { bg: string; text: string; accent: string; muted: string };
  layout: "magazine" | "minimal" | "editorial" | "bold";
  coverStyle: "full-bleed" | "framed" | "split";
  cardStyle: "rounded" | "sharp" | "polaroid";
  fontImport: string; // Google Fonts import URL
}

export const STORYBOARD_TEMPLATES: StoryboardTemplate[] = [
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "Warm tones, serif elegance, magazine-style grid",
    fonts: { heading: "'Playfair Display', serif", body: "'Inter', sans-serif" },
    colors: { bg: "#FDF9F0", text: "#0a2225", accent: "#C7A962", muted: "#8D8D8D" },
    layout: "magazine",
    coverStyle: "full-bleed",
    cardStyle: "rounded",
    fontImport: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap",
  },
  {
    id: "arctic-minimal",
    name: "Arctic",
    description: "Clean whites, airy spacing, whisper-thin type",
    fonts: { heading: "'DM Sans', sans-serif", body: "'DM Sans', sans-serif" },
    colors: { bg: "#FAFAFA", text: "#1a1a1a", accent: "#4A90A4", muted: "#999999" },
    layout: "minimal",
    coverStyle: "framed",
    cardStyle: "rounded",
    fontImport: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap",
  },
  {
    id: "editorial-noir",
    name: "Editorial",
    description: "Bold serif headlines, alternating layouts, editorial feel",
    fonts: { heading: "'Cormorant Garamond', serif", body: "'Outfit', sans-serif" },
    colors: { bg: "#F5F1EB", text: "#1C1C1C", accent: "#9B6B3D", muted: "#7A7A7A" },
    layout: "editorial",
    coverStyle: "split",
    cardStyle: "sharp",
    fontImport: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@300;400;500&display=swap",
  },
  {
    id: "midnight-bold",
    name: "Midnight",
    description: "Dark canvas, high contrast, statement typography",
    fonts: { heading: "'Space Grotesk', sans-serif", body: "'Space Grotesk', sans-serif" },
    colors: { bg: "#0F0F0F", text: "#F5F5F5", accent: "#E8C547", muted: "#666666" },
    layout: "bold",
    coverStyle: "full-bleed",
    cardStyle: "sharp",
    fontImport: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
  },
  {
    id: "tropical-lush",
    name: "Tropical",
    description: "Vibrant greens, organic curves, paradise vibes",
    fonts: { heading: "'Libre Baskerville', serif", body: "'Nunito Sans', sans-serif" },
    colors: { bg: "#F0F7F2", text: "#1B3A2D", accent: "#2D8B5E", muted: "#7BA68C" },
    layout: "magazine",
    coverStyle: "full-bleed",
    cardStyle: "rounded",
    fontImport: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Nunito+Sans:wght@300;400;600&display=swap",
  },
  {
    id: "monochrome-film",
    name: "Monochrome",
    description: "Film-grain aesthetic, polaroid cards, timeless black & white",
    fonts: { heading: "'EB Garamond', serif", body: "'Source Sans 3', sans-serif" },
    colors: { bg: "#F2F0ED", text: "#2C2C2C", accent: "#5C5C5C", muted: "#A0A0A0" },
    layout: "editorial",
    coverStyle: "framed",
    cardStyle: "polaroid",
    fontImport: "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500&display=swap",
  },
];

export function getTemplate(id: string): StoryboardTemplate | undefined {
  return STORYBOARD_TEMPLATES.find((t) => t.id === id);
}
