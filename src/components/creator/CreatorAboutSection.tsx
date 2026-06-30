interface CreatorAboutSectionProps {
  bio: string | null | undefined;
  specialties: string[];
  certifications: string[] | null;
  memberSince: string | null; // ISO date string
  responseTimeText: string | null;
}

export function CreatorAboutSection({
  bio,
  specialties,
  certifications,
  memberSince,
  responseTimeText,
}: CreatorAboutSectionProps) {
  const memberYear = memberSince
    ? new Date(memberSince).getFullYear()
    : null;

  const hasCerts = certifications && certifications.length > 0;
  const hasContent = bio || specialties.length > 0 || hasCerts;

  if (!hasContent) return null;

  return (
    <div className="max-w-2xl">
      {/* Travel philosophy */}
      {bio && (
        <p className="font-primary text-lg md:text-xl italic text-[#4a4a4a] leading-relaxed mb-6">
          "{bio}"
        </p>
      )}

      {/* Specialties pills */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {specialties.map((s) => (
            <span
              key={s}
              className="rounded-full border border-[#E5DFC6] bg-white px-3.5 py-1.5 text-xs font-medium text-[#0a2225]"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Certifications */}
      {hasCerts && (
        <div className="flex flex-wrap gap-2 mb-5">
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

      {/* Meta line */}
      <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
        {memberYear && <span>Member since {memberYear}</span>}
        {responseTimeText && (
          <>
            <span className="text-[#E5DFC6]">·</span>
            <span>{responseTimeText}</span>
          </>
        )}
      </div>
    </div>
  );
}
