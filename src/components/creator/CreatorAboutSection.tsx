interface CreatorAboutSectionProps {
  bio: string | null | undefined;
  certifications: string[] | null;
}

/* About = the story layer. Specialty chips, member-since, and response time
   all live in the hero — repeating them here read as filler (the "small
   startup" tell). This section now renders only content the hero doesn't
   have: the creator's own words and any certifications. No content → no
   section, Airbnb-style. */
export function CreatorAboutSection({ bio, certifications }: CreatorAboutSectionProps) {
  const hasCerts = certifications && certifications.length > 0;

  if (!bio && !hasCerts) return null;

  return (
    <div className="max-w-2xl">
      {/* Travel philosophy */}
      {bio && (
        <p className="font-primary text-lg md:text-xl italic text-[#4a4a4a] leading-relaxed mb-6">
          "{bio}"
        </p>
      )}

      {/* Certifications */}
      {hasCerts && (
        <div className="flex flex-wrap gap-2">
          {certifications!.map((cert) => (
            <span
              key={cert}
              className="rounded-full bg-[#FDF9F0] border border-[#E5DFC6] px-3.5 py-1.5 text-xs text-[#6B7280]"
            >
              {cert}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
