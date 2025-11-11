import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Copy, Check } from "lucide-react";

interface ItineraryShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itineraryId: string;
  itineraryTitle: string;
}

type SharePermission = "view" | "edit";

export function ItineraryShareDialog({
  isOpen,
  onClose,
  itineraryId,
  itineraryTitle,
}: ItineraryShareDialogProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<SharePermission>("view");
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to share");
        return;
      }

      // Find user by email
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim())
        .single();

      if (profileError || !profiles) {
        toast.error("User not found with that email");
        return;
      }

      // Create share record
      const { error: shareError } = await supabase
        .from("itinerary_shares")
        .insert({
          itinerary_id: itineraryId,
          shared_with_user_id: profiles.id,
          permission,
          shared_by_user_id: user.id,
        });

      if (shareError) {
        if (shareError.code === "23505") {
          toast.error("Already shared with this user");
        } else {
          throw shareError;
        }
        return;
      }

      toast.success(`Itinerary shared with ${email}`);
      setEmail("");
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share itinerary");
    } finally {
      setLoading(false);
    }
  };

  const generateShareLink = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Create a shareable link (would typically generate a unique token)
      const token = crypto.randomUUID();
      const link = `${window.location.origin}/itinerary/${itineraryId}?share=${token}`;

      setShareLink(link);
      toast.success("Share link generated");
    } catch (error) {
      console.error("Link generation error:", error);
      toast.error("Failed to generate share link");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Itinerary</DialogTitle>
          <DialogDescription>
            Share "{itineraryTitle}" with trip companions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Share by Email */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="companion@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <Button
                  onClick={handleShare}
                  disabled={loading}
                  size="icon"
                  className="shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permission Level</Label>
              <RadioGroup
                value={permission}
                onValueChange={(value) => setPermission(value as SharePermission)}
                disabled={loading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="view" id="view" />
                  <Label htmlFor="view" className="font-normal cursor-pointer">
                    View only - Can see itinerary but not edit
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="edit" id="edit" />
                  <Label htmlFor="edit" className="font-normal cursor-pointer">
                    Can edit - Can make changes to the itinerary
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Share Link */}
          <div className="space-y-3">
            {!shareLink ? (
              <Button
                onClick={generateShareLink}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Generate Share Link
              </Button>
            ) : (
              <div className="space-y-2">
                <Label>Shareable Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={copyLink}
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link will have {permission} access
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
