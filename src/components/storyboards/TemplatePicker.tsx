import { STORYBOARD_TEMPLATES, type StoryboardTemplate } from "@/lib/storyboard-templates";

interface TemplatePickerProps {
  onSelect: (template: StoryboardTemplate) => void;
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ backgroundColor: "#FDF9F0" }}
    >
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: "#0a2225" }}
          >
            Choose a style
          </h1>
          <p className="text-sm md:text-base" style={{ color: "#6B7280" }}>
            Pick an aesthetic for your storyboard. You can customise it later.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STORYBOARD_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="group text-left rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{ borderColor: "#E5DFC6", backgroundColor: "#fff" }}
            >
              {/* Preview swatch */}
              <div
                className="h-28 md:h-36 relative overflow-hidden"
                style={{ backgroundColor: t.colors.bg }}
              >
                {/* Decorative layout preview */}
                <div className="absolute inset-3 flex flex-col gap-1.5">
                  <div
                    className="h-2.5 rounded-full w-3/5"
                    style={{ backgroundColor: t.colors.text, opacity: 0.7 }}
                  />
                  <div
                    className="h-1.5 rounded-full w-2/5"
                    style={{ backgroundColor: t.colors.muted, opacity: 0.5 }}
                  />
                  <div className="flex-1 mt-2 flex gap-1.5">
                    {t.layout === "magazine" && (
                      <>
                        <div className="flex-1 rounded-lg" style={{ backgroundColor: t.colors.accent, opacity: 0.25 }} />
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="flex-1 rounded-lg" style={{ backgroundColor: t.colors.accent, opacity: 0.15 }} />
                          <div className="flex-1 rounded-lg" style={{ backgroundColor: t.colors.accent, opacity: 0.2 }} />
                        </div>
                      </>
                    )}
                    {t.layout === "minimal" && (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="w-3/5 h-3/4 rounded-lg" style={{ backgroundColor: t.colors.accent, opacity: 0.2 }} />
                      </div>
                    )}
                    {t.layout === "editorial" && (
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="h-1/2 rounded-lg" style={{ backgroundColor: t.colors.accent, opacity: 0.2 }} />
                        <div className="flex gap-1.5 flex-1">
                          <div className="flex-1 rounded-lg" style={{ backgroundColor: t.colors.accent, opacity: 0.15 }} />
                          <div className="flex-1 rounded-lg" style={{ backgroundColor: t.colors.accent, opacity: 0.15 }} />
                        </div>
                      </div>
                    )}
                    {t.layout === "bold" && (
                      <div className="flex-1 grid grid-cols-2 gap-1.5">
                        <div className="rounded-lg" style={{ backgroundColor: t.colors.accent, opacity: 0.3 }} />
                        <div className="rounded-lg" style={{ backgroundColor: t.colors.accent, opacity: 0.25 }} />
                        <div className="rounded-lg" style={{ backgroundColor: t.colors.accent, opacity: 0.2 }} />
                        <div className="rounded-lg" style={{ backgroundColor: t.colors.accent, opacity: 0.35 }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#0a2225" }}
                  >
                    {t.name}
                  </span>
                  <div className="flex gap-1">
                    {[t.colors.bg, t.colors.accent, t.colors.text].map((c, i) => (
                      <span
                        key={i}
                        className="h-3 w-3 rounded-full border"
                        style={{ backgroundColor: c, borderColor: "#E5DFC6" }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[11px]" style={{ color: "#8D8D8D" }}>
                  {t.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
