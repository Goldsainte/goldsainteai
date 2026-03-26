interface CreatorTrustSectionProps {
  yearsExperience?: number | null;
  tripsCompleted?: number | null;
  clientsServed?: number | null;
  certifications?: string[] | null;
  isVerified?: boolean;
}

export function CreatorTrustSection({
  yearsExperience,
  tripsCompleted,
  clientsServed,
  certifications,
  isVerified = true,
}: CreatorTrustSectionProps) {
  const stats = [
    yearsExperience && { value: `${yearsExperience}+`, label: "Years Experience" },
    (tripsCompleted ?? 0) > 0 && { value: tripsCompleted, label: "Trips Planned" },
    (clientsServed ?? 0) > 0 && { value: clientsServed, label: "Clients Served" },
  ].filter(Boolean) as { value: string | number; label: string }[];

  const hasCerts = certifications && certifications.length > 0;
  const hasContent = stats.length > 0 || hasCerts || isVerified;

  if (!hasContent) return null;

  return (
    <section>
      <h2 className="font-secondary text-xl text-[#0a2225] mb-5">
        Credentials
      </h2>

      {/* Stats — serif numbers, no icon circles */}
      {stats.length > 0 && (
        <div className="flex flex-wrap gap-8 mb-6">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-secondary text-2xl text-[#0a2225]">{stat.value}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Verified line */}
      {isVerified && (
        <p className="text-sm text-[#6B7280] mb-4">
          <span className="text-[#C7A962]">—</span>{" "}
          Vetted and verified by Goldsainte. Identity, credentials, and track record reviewed.
        </p>
      )}

      {/* Certification pills — refined, no icons */}
      {hasCerts && (
        <div className="flex flex-wrap gap-2">
          {certifications!.map((cert) => (
            <span
              key={cert}
              className="rounded-full border border-[#E5DFC6] bg-white px-3.5 py-1.5 text-xs font-medium text-[#0a2225]"
            >
              {cert}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
