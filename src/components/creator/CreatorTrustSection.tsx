import { Award, Users, Briefcase, BadgeCheck, ChevronDown } from "lucide-react";
import { useState } from "react";

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
  const [showVerifiedInfo, setShowVerifiedInfo] = useState(false);

  const stats = [
    yearsExperience && {
      icon: Briefcase,
      value: `${yearsExperience}+`,
      label: "Years Experience",
    },
    (tripsCompleted ?? 0) > 0 && {
      icon: Award,
      value: tripsCompleted,
      label: "Trips Planned",
    },
    (clientsServed ?? 0) > 0 && {
      icon: Users,
      value: clientsServed,
      label: "Clients Served",
    },
  ].filter(Boolean) as { icon: any; value: string | number; label: string }[];

  const hasCerts = certifications && certifications.length > 0;
  const hasContent = stats.length > 0 || hasCerts || isVerified;

  if (!hasContent) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
        Trust & Credibility
      </h2>

      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-[#E5DFC6] bg-white p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F0E0]">
                <stat.icon className="h-5 w-5 text-[#0c4d47]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#0a2225]">{stat.value}</p>
                <p className="text-xs text-[#6B7280]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasCerts && (
        <div className="flex flex-wrap gap-2 mb-4">
          {certifications!.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#C7B892]/15 border border-[#C7B892]/30 px-3 py-1.5 text-xs font-medium text-[#0a2225]"
            >
              <Award className="h-3 w-3 text-[#C7A962]" />
              {cert}
            </span>
          ))}
        </div>
      )}

      {isVerified && (
        <div className="rounded-xl border border-[#E5DFC6] bg-white p-4">
          <button
            onClick={() => setShowVerifiedInfo(!showVerifiedInfo)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-[#C7B892]" />
              <span className="text-sm font-medium text-[#0a2225]">
                Verified Partner
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-[#6B7280] transition-transform ${
                showVerifiedInfo ? "rotate-180" : ""
              }`}
            />
          </button>
          {showVerifiedInfo && (
            <p className="mt-3 text-sm text-[#6B7280] leading-relaxed">
              This creator has been vetted and verified by Goldsainte. Their identity, 
              credentials, and track record have been reviewed to ensure quality and 
              trustworthiness for your travel planning experience.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
