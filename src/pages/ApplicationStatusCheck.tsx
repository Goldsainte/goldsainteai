import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Clock, XCircle } from "lucide-react";

export default function ApplicationStatusCheck() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{
    id: string;
    type: 'agent' | 'brand';
    status: string;
    stripe_verification_status?: string;
    created_at: string;
    rejection_reason?: string;
    user_id?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async (emailOverride?: string) => {
    const targetEmail = (emailOverride ?? email).trim();
    if (!targetEmail) return;
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      // Check agent applications
      const { data: agentApp } = await supabase
        .from('agent_applications')
        .select('id, email, first_name, last_name, status, stripe_verification_status, created_at, rejection_reason, user_id')
        .eq('email', targetEmail)
        .order('created_at', { ascending: false })
        .maybeSingle() as any;

      // Check brand applications
      const { data: brandApp } = await supabase
        .from('brand_applications')
        .select('id, brand_name, primary_contact_email, status, stripe_verification_status, created_at, rejection_reason, user_id')
        .eq('primary_contact_email', targetEmail)
        .order('created_at', { ascending: false })
        .maybeSingle() as any;

      const application = agentApp || brandApp;

      if (application) {
        setStatus({
          ...application,
          type: agentApp ? 'agent' : 'brand',
        });
      } else {
        setError("No application found for this email address.");
      }
    } catch (err: any) {
      console.error(err);
      setError("An error occurred while checking your application status.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load when navigated here with ?email=<address> (e.g. from the
  // post-signin routing path).
  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) {
      setEmail(qEmail);
      void checkStatus(qEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'pending_verification':
        return <Badge variant="outline" className="bg-[#FDF9F0]"><Clock className="mr-1 h-3 w-3" />Awaiting Verification</Badge>;
      case 'verified':
        return <Badge variant="outline" className="bg-green-50"><CheckCircle className="mr-1 h-3 w-3" />Account Active</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50"><CheckCircle className="mr-1 h-3 w-3" />Account Active</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check Application Status</CardTitle>
            <CardDescription>
              Enter your email to view the status of your Goldsainte application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkStatus()}
              />
              <Button onClick={() => checkStatus()} disabled={loading || !email}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check Status"}
              </Button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {status && (
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {status.type === 'agent' ? 'Agent Application' : 'Brand Application'}
                    </CardTitle>
                    {getStatusBadge(status.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <strong>Submitted:</strong>{' '}
                    {new Date(status.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  
                  {status.stripe_verification_status && (
                    <div>
                      <strong>Identity Verification:</strong>{' '}
                      <Badge variant="secondary">{status.stripe_verification_status}</Badge>
                    </div>
                  )}

                  {status.status === 'rejected' && status.rejection_reason && (
                    <div className="rounded-lg bg-red-50 p-3">
                      <strong className="text-red-900">Reason:</strong>
                      <p className="text-red-700">{status.rejection_reason}</p>
                    </div>
                  )}

                  {(status.status === 'verified' || status.status === 'approved') && status.user_id && (
                    <div className="rounded-lg bg-green-50 p-3">
                      <p className="text-green-900">
                        ✅ Your account is active. Sign in with the email and password you used to apply.
                      </p>
                    </div>
                  )}

                  {status.status === 'pending_verification' && (
                    <div className="rounded-lg bg-[#F0F7F6] p-3">
                      <p className="text-blue-900">
                        Complete identity verification to activate your account.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
