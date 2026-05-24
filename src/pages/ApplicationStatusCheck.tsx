import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Clock, XCircle } from "lucide-react";

export default function ApplicationStatusCheck() {
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
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

  const checkStatus = async () => {
    if (!user?.email) return;
    const targetEmail = user.email.toLowerCase().trim();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      // RLS restricts these queries to the signed-in user's own rows
      // (matches on JWT email claim or user_id = auth.uid()).
      const { data: agentApp } = await supabase
        .from('agent_applications')
        .select('id, email, first_name, last_name, status, stripe_verification_status, created_at, rejection_reason, user_id')
        .or(`email.eq.${targetEmail},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as any;

      const { data: brandApp } = await supabase
        .from('brand_applications')
        .select('id, brand_name, primary_contact_email, status, stripe_verification_status, created_at, rejection_reason, user_id')
        .or(`primary_contact_email.eq.${targetEmail},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as any;

      const application = agentApp || brandApp;

      if (application) {
        setStatus({
          ...application,
          type: agentApp ? 'agent' : 'brand',
        });
      } else {
        setError("We couldn't find an application linked to your account.");
      }
    } catch (err: any) {
      console.error(err);
      setError("An error occurred while checking your application status.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load as soon as we have an authenticated session. The ?email query
  // param is accepted but only honored when it matches the signed-in user.
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    void checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

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

  // Build a sign-in redirect that brings the user back here after auth, with
  // the prefilled email (if provided) so the Auth page can pre-populate.
  const redirectEmail = searchParams.get('email');
  const signInHref = `/auth?redirect=${encodeURIComponent('/application/status')}${
    redirectEmail ? `&email=${encodeURIComponent(redirectEmail)}` : ''
  }`;

  if (!authLoading && !user) {
    return (
      <div className="bg-[#f7f3ea] flex-1 py-16 px-6">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Check Application Status</CardTitle>
              <CardDescription>
                Sign in with the email you used to apply to view your application status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to={signInHref}>Sign in to view status</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f3ea] flex-1 py-12 px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Application Status</CardTitle>
            <CardDescription>
              Signed in as {user?.email}. Showing the application linked to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(loading || authLoading) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your application…
              </div>
            )}
            <div>
              <Button variant="outline" onClick={() => checkStatus()} disabled={loading}>
                Refresh
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
