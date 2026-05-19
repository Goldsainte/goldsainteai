import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Shield, Users, ExternalLink, CheckCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalComplianceAcceptanceProps {
  tosAccepted: boolean;
  onTosChange: (accepted: boolean) => void;
  privacyAccepted: boolean;
  onPrivacyChange: (accepted: boolean) => void;
  creatorAgreementAccepted: boolean;
  onCreatorAgreementChange: (accepted: boolean) => void;
  transparencyAccepted: boolean;
  onTransparencyChange: (accepted: boolean) => void;
}

const CURRENT_VERSIONS = {
  tos: "1.0",
  privacy: "1.0",
  creatorAgreement: "1.0",
  transparency: "1.0",
};

export function LegalComplianceAcceptance({
  tosAccepted,
  onTosChange,
  privacyAccepted,
  onPrivacyChange,
  creatorAgreementAccepted,
  onCreatorAgreementChange,
  transparencyAccepted,
  onTransparencyChange,
}: LegalComplianceAcceptanceProps) {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const documents = [
    {
      id: "tos",
      title: "Terms of Service",
      description: "Your agreement to use the Goldsainte platform",
      icon: FileText,
      accepted: tosAccepted,
      onChange: onTosChange,
      link: "/legal/terms",
      summary: [
        "Platform usage rights and responsibilities",
        "Account creation and security requirements",
        "Intellectual property and content ownership",
        "Dispute resolution procedures",
        "Termination conditions",
      ],
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      description: "How we collect, use, and protect your data",
      icon: Shield,
      accepted: privacyAccepted,
      onChange: onPrivacyChange,
      link: "/privacy-cookies",
      summary: [
        "Personal information we collect",
        "How we use your data",
        "Third-party sharing practices",
        "Your rights and choices",
        "Data retention and security",
      ],
    },
    {
      id: "creator",
      title: "Creator Partnership Agreement",
      description: "Specific terms for creators on Goldsainte",
      icon: Users,
      accepted: creatorAgreementAccepted,
      onChange: onCreatorAgreementChange,
      link: "/legal/creator-agreement",
      summary: [
        "Commission structure and payout terms",
        "Content guidelines and brand representation",
        "Exclusivity and non-compete clauses",
        "Traveler safety and liability",
        "Performance expectations and metrics",
      ],
    },
    {
      id: "transparency",
      title: "Transparency Agreement",
      description: "Our commitment to honest communication and disclosures",
      icon: Eye,
      accepted: transparencyAccepted,
      onChange: onTransparencyChange,
      link: "/transparency-agreement",
      summary: [
        "All communications must stay on-platform",
        "Sponsored content disclosure requirements",
        "AI limitations and recommendations",
        "Pricing and fee transparency",
        "Review authenticity standards",
      ],
    },
  ];

  const allAccepted = tosAccepted && privacyAccepted && creatorAgreementAccepted && transparencyAccepted;

  return (
    <div className="space-y-6">
      <div className="bg-[#FDF9F0] rounded-2xl p-4 border border-[#E5DFC6]">
        <p className="text-sm text-[#6B7280]">
          Please review and accept all agreements to complete your creator registration. 
          These documents outline your rights, responsibilities, and our commitment to you.
        </p>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={cn(
              "rounded-2xl border-2 transition-all",
              doc.accepted
                ? "border-[#C7A962] bg-[#C7A962]/5"
                : "border-[#E5DFC6] bg-white"
            )}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    doc.accepted ? "bg-[#C7A962]" : "bg-[#FDF9F0]"
                  )}
                >
                  <doc.icon
                    className={cn(
                      "w-6 h-6",
                      doc.accepted ? "text-white" : "text-[#C7A962]"
                    )}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-[#0a2225]">{doc.title}</h3>
                    {doc.accepted && (
                      <CheckCircle className="w-5 h-5 text-[#C7A962]" />
                    )}
                  </div>
                  <p className="text-sm text-[#6B7280] mb-3">{doc.description}</p>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedDoc(expandedDoc === doc.id ? null : doc.id)
                      }
                      className="text-xs border-[#E5DFC6] hover:border-[#C7A962]"
                    >
                      {expandedDoc === doc.id ? "Hide Summary" : "View Summary"}
                    </Button>
                    <a
                      href={doc.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(doc.link, '_blank', 'noopener,noreferrer');
                      }}
                      className="text-xs text-[#C7A962] hover:underline flex items-center gap-1"
                    >
                      Full Document <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {expandedDoc === doc.id && (
                <div className="mt-4 ml-16 pl-4 border-l-2 border-[#E5DFC6]">
                  <ul className="space-y-2">
                    {doc.summary.map((item, index) => (
                      <li
                        key={index}
                        className="text-sm text-[#6B7280] flex items-start gap-2"
                      >
                        <span className="text-[#C7A962] mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 ml-16">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={doc.accepted}
                    onCheckedChange={(checked) => doc.onChange(checked as boolean)}
                    className="mt-0.5 border-[#C7A962] data-[state=checked]:bg-[#C7A962] data-[state=checked]:border-[#C7A962]"
                  />
                  <span className="text-sm text-[#0a2225]">
                    I have read and agree to the {doc.title}{" "}
                    <span className="text-[#6B7280]">(v{CURRENT_VERSIONS[doc.id as keyof typeof CURRENT_VERSIONS]})</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {allAccepted && (
        <div className="bg-gradient-to-br from-[#0a2225] to-[#1a3a3f] rounded-2xl p-6 text-white text-center">
          <CheckCircle className="w-10 h-10 text-[#C7A962] mx-auto mb-3" />
          <h3 className="font-secondary text-lg mb-2">All Agreements Accepted</h3>
          <p className="text-sm text-white/80">
            You're ready to launch your creator profile
          </p>
        </div>
      )}
    </div>
  );
}
