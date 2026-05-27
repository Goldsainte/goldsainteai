import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { getEdgeFunctionUrl, SUPABASE_PUBLISHABLE_KEY } from '@/lib/backendConfig';

type State = 'loading' | 'valid' | 'already' | 'invalid' | 'submitting' | 'done' | 'error';

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    (async () => {
      try {
        const res = await fetch(
          `${getEdgeFunctionUrl('handle-email-unsubscribe')}?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) { setState('invalid'); return; }
        if (data.valid === false && data.reason === 'already_unsubscribed') setState('already');
        else if (data.valid) setState('valid');
        else setState('invalid');
      } catch { setState('error'); }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState('submitting');
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
      if (error) { setState('error'); return; }
      if (data?.success) setState('done');
      else if (data?.reason === 'already_unsubscribed') setState('already');
      else setState('error');
    } catch { setState('error'); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-background">
      <Helmet><title>Unsubscribe — Goldsainte</title><meta name="robots" content="noindex" /></Helmet>
      <div className="max-w-lg w-full text-center">
        <h1 className="font-serif text-4xl mb-4 text-foreground">Email preferences</h1>
        {state === 'loading' && <p className="text-muted-foreground">Verifying your link…</p>}
        {state === 'invalid' && <p className="text-muted-foreground">This unsubscribe link is invalid or has expired.</p>}
        {state === 'already' && <p className="text-muted-foreground">You have already unsubscribed from these emails.</p>}
        {state === 'valid' && (
          <>
            <p className="text-muted-foreground mb-8">Confirm that you would like to stop receiving non-essential emails from Goldsainte. You will continue to receive transactional messages tied to active bookings and account security.</p>
            <Button onClick={confirm} size="lg">Confirm unsubscribe</Button>
          </>
        )}
        {state === 'submitting' && <p className="text-muted-foreground">Processing…</p>}
        {state === 'done' && <p className="text-muted-foreground">You have been unsubscribed. We're sorry to see you go.</p>}
        {state === 'error' && <p className="text-muted-foreground">Something went wrong. Please try again later.</p>}
      </div>
    </main>
  );
}