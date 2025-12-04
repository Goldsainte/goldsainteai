import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Video, CheckCircle, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TikTokVerificationButtonProps {
  tiktokHandle: string;
  isVerified: boolean;
  followerCount?: number;
  onVerificationComplete: (verified: boolean, followers: number) => void;
}

export function TikTokVerificationButton({
  tiktokHandle,
  isVerified,
  followerCount,
  onVerificationComplete,
}: TikTokVerificationButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!tiktokHandle) {
      toast.error("Please enter your TikTok handle first");
      return;
    }

    setIsVerifying(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to verify your TikTok");
        return;
      }

      // Call TikTok OAuth start function
      const { data, error } = await supabase.functions.invoke("tiktok-oauth-start", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data?.authorizeUrl) {
        // Store the return URL for after OAuth
        sessionStorage.setItem("tiktok_verify_return", window.location.href);
        window.location.href = data.authorizeUrl;
      } else {
        throw new Error("No authorization URL received");
      }
    } catch (error) {
      console.error("TikTok verification error:", error);
      toast.error("Failed to start TikTok verification. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Format follower count
  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (isVerified && followerCount) {
    return (
      <div className="bg-[#FDF9F0] rounded-xl p-4 border border-[#C7A962]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C7A962] rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#0a2225]">@{tiktokHandle}</span>
              <span className="text-xs bg-[#C7A962] text-white px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>
            <p className="text-sm text-[#6B7280]">
              {formatFollowers(followerCount)} followers
            </p>
          </div>
          <Video className="w-5 h-5 text-[#0a2225]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-[#FDF9F0] rounded-xl p-4 border border-[#E5DFC6]">
        <div className="flex items-start gap-3">
          <Video className="w-5 h-5 text-[#C7A962] mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-[#0a2225] mb-1">Verify Your TikTok</h4>
            <p className="text-sm text-[#6B7280] mb-3">
              Connect your TikTok account to verify your follower count and unlock premium creator features.
            </p>
            <Button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || !tiktokHandle}
              className={cn(
                "bg-[#0a2225] hover:bg-[#0a2225]/90 text-white",
                (!tiktokHandle) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Connect TikTok
                  <ExternalLink className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {!tiktokHandle && (
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <AlertCircle className="w-3 h-3" />
          Enter your TikTok handle above to enable verification
        </div>
      )}

      <p className="text-xs text-[#6B7280]">
        Verified creators with 10K+ followers get priority matching and a verified badge.
      </p>
    </div>
  );
}
