import { CheckCircle2, Shield, Award, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrustBadgesProps {
  identityVerified?: boolean;
  backgroundCheckStatus?: string;
  professionalLicenseVerified?: boolean;
  insuranceVerified?: boolean;
  trustScore?: number;
  size?: "sm" | "md" | "lg";
}

export const TrustBadges = ({
  identityVerified = false,
  backgroundCheckStatus = "not_started",
  professionalLicenseVerified = false,
  insuranceVerified = false,
  trustScore = 0,
  size = "md",
}: TrustBadgesProps) => {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5";
  const badgeSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";

  return (
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        {identityVerified && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className={`${badgeSize} bg-green-50 text-green-700 border-green-200`}>
                <CheckCircle2 className={`${iconSize} mr-1`} />
                Identity Verified
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Government-issued ID verified</p>
            </TooltipContent>
          </Tooltip>
        )}

        {backgroundCheckStatus === "approved" && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className={`${badgeSize} bg-[#F0F7F6] text-[#0c4d47] border-[#0c4d47]/20`}>
                <Shield className={`${iconSize} mr-1`} />
                Background Checked
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Professional background check completed</p>
            </TooltipContent>
          </Tooltip>
        )}

        {professionalLicenseVerified && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className={`${badgeSize} bg-purple-50 text-purple-700 border-purple-200`}>
                <Award className={`${iconSize} mr-1`} />
                Licensed
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Professional travel agent license verified</p>
            </TooltipContent>
          </Tooltip>
        )}

        {insuranceVerified && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className={`${badgeSize} bg-orange-50 text-orange-700 border-orange-200`}>
                <FileCheck className={`${iconSize} mr-1`} />
                Insured
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Professional liability insurance verified</p>
            </TooltipContent>
          </Tooltip>
        )}

        {trustScore >= 4.0 && (
          <Tooltip>
            <TooltipTrigger>
              <Badge className={`${badgeSize} bg-gradient-to-r from-yellow-400 to-yellow-600 text-white`}>
                ⭐ Trusted Agent
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Trust Score: {trustScore.toFixed(1)}/5.0</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};
