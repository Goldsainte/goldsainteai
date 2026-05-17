import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSearchParams } from "react-router-dom";

interface VerificationStatus {
  id: string;
  status: string;
  verified_at?: string;
  rejection_reason?: string;
}

export function CustomerVerificationUpload() {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadVerificationStatus();
    
    // Check for return from Stripe
    const status = searchParams.get("status");
    if (status === "complete") {
      toast.success("Verification submitted! We'll notify you once it's reviewed.");
      loadVerificationStatus();
    }
  }, [searchParams]);

  const loadVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || "");
      setUserId(user.id);

      // Check if user is already verified in profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_verified")
        .eq("id", user.id)
        .single();

      // Get most recent verification record
      const { data, error } = await supabase
        .from("customer_verifications")
        .select("id, status, verified_at, rejection_reason")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // If profile shows verified but no record, create synthetic status
      if (profile?.is_verified && !data) {
        setVerificationStatus({
          id: "profile",
          status: "approved",
          verified_at: new Date().toISOString(),
        });
      } else if (data) {
        setVerificationStatus({
          id: data.id,
          status: data.status,
          verified_at: data.verified_at || undefined,
          rejection_reason: data.rejection_reason || undefined,
        });
      } else {
        setVerificationStatus(null);
      }
    } catch (error) {
      console.error("Error loading verification status:", error);
    } finally {
      setLoading(false);
    }
  };

  const startVerification = async () => {
    if (!userEmail || !userId) {
      toast.error("Please sign in to verify your identity");
      return;
    }

    setStarting(true);
    try {
      // Return travelers to their Settings tab on the profile hub so they land
      // back exactly where they launched verification from.
      const returnUrl = `${window.location.origin}/traveler?tab=settings&verification=complete`;

      const { data, error } = await supabase.functions.invoke("create-identity-verification", {
        body: {
          email: userEmail,
          applicationType: "traveler",
          userId: userId,
          returnUrl,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Identity verification
        window.location.href = data.url;
      } else {
        throw new Error("No verification URL returned");
      }
    } catch (error: any) {
      console.error("Error starting verification:", error);
      toast.error(error.message || "Failed to start verification. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "rejected":
        return <XCircle className="h-6 w-6 text-red-600" />;
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-600" />;
      default:
        return <Clock className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Verified";
      case "rejected":
        return "Verification Failed";
      case "pending":
        return "Verification Pending";
      default:
        return "Unknown Status";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Identity Verification
        </CardTitle>
        <CardDescription>
          Verify your identity to build trust with travel agents and unlock premium features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Already verified */}
        {verificationStatus?.status === "approved" && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-700 mb-2">Identity Verified</h3>
            <p className="text-muted-foreground">
              Your identity has been verified. You now have access to all premium features.
            </p>
            {verificationStatus.verified_at && (
              <p className="text-sm text-muted-foreground mt-2">
                Verified on {new Date(verificationStatus.verified_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Pending verification */}
        {verificationStatus?.status === "pending" && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-yellow-700 mb-2">Verification In Progress</h3>
            <p className="text-muted-foreground mb-4">
              Your verification is being processed. This usually takes just a few minutes.
            </p>
            <Button variant="outline" onClick={loadVerificationStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status
            </Button>
          </div>
        )}

        {/* Rejected - allow retry */}
        {verificationStatus?.status === "rejected" && (
          <div className="space-y-6">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Verification unsuccessful.</strong>{" "}
                {verificationStatus.rejection_reason || "Please try again with a valid government ID."}
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                You can try verifying again with a different document or better lighting.
              </p>
              <Button onClick={startVerification} disabled={starting} size="lg">
                {starting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Not yet started */}
        {!verificationStatus && (
          <div className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Secure verification powered by Stripe.</strong> Your documents are encrypted 
                and only used for verification. Verified users get priority support and access to 
                instant booking with trusted agents.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-4">What you'll need:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>A valid government-issued ID (passport, driver's license, or national ID)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Good lighting to capture a clear photo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>A device with a camera for the selfie verification</span>
                </li>
              </ul>
            </div>

            <div className="text-center pt-4">
              <Button onClick={startVerification} disabled={starting} size="lg" className="min-w-[200px]">
                {starting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Starting Verification...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Verify with Stripe
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                You'll be redirected to Stripe's secure verification page
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
