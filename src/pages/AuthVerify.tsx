import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowRight } from 'lucide-react';
import logomark from '@/assets/logomark-gold.png';

/**
 * /auth/verify — passwordless confirmation landing (click-to-complete).
 *
 * Email link:
 *   https://goldsainte.ai/auth/verify?token=<hash>&type=<type>&redirect_to=...
 *
 * We deliberately DO NOT verify on load. Email security scanners (Outlook
 * SafeLinks, Gmail, corporate proxies) GET-prefetch links and would consume the
 * single-use token, leaving the real human with an "expired link". A scanner
 * fetches the page but does not click a button — so the token is only spent when
 * the user actually clicks "Continue".
 */
const AuthVerify = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Dead-link recovery (31 Jul): the error copy said "request a new one" but
  // offered no way to do it. Real cause discovered launch morning: an auth
  // email-hook timeout voided the token server-side while the email still
  // delivered — a valid-looking link that could never work. The hook is fixed
  // (respond-first, file 303); this is the self-service path for any dead
  // link: expired, scanner-eaten, or superseded.
  const [resendEmail, setResendEmail] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleResend = async () => {
    const target = resendEmail.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) return;
    setResendState('sending');
    try {
      if (type === 'recovery') {
        await supabase.auth.resetPasswordForEmail(target, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      } else {
        await supabase.auth.resend({ type: 'signup', email: target });
      }
    } catch (e) {
      console.error('[AuthVerify] resend failed', e);
    }
    // Always show the same neutral confirmation — never reveal whether an
    // email is registered (account-enumeration hygiene).
    setResendState('sent');
  };

  const tokenHash = searchParams.get('token') ?? searchParams.get('token_hash') ?? '';
  const type = (searchParams.get('type') ?? 'signup') as any;
  const redirectTo = searchParams.get('redirect_to');

  // The flow (action=ask/open) lives inside redirect_to — use it to tailor copy.
  const action = (() => {
    if (!redirectTo) return null;
    try {
      return new URL(redirectTo, window.location.origin).searchParams.get('action');
    } catch {
      return null;
    }
  })();

  const isConversation = action === 'ask' || action === 'open';
  const headline =
    type === 'recovery' ? t('auth.vResetHeadline')
    : isConversation ? t('auth.vOpenConversation')
    : t('auth.confirmEmail');
  const subline =
    type === 'recovery' ? t('auth.vResetSub')
    : isConversation ? t('auth.vConvSub')
    : t('auth.vConfirmSub');
  const ctaLabel =
    type === 'recovery' ? t('auth.vCtaReset')
    : isConversation ? t('auth.vCtaOpen')
    : t('auth.vCtaConfirm');

  const handleContinue = async () => {
    setError(null);

    if (!tokenHash) {
      setError(t('auth.vIncomplete'));
      return;
    }

    setVerifying(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (verifyError) {
      console.error('[AuthVerify] verifyOtp error', verifyError.message);
      setError(t('auth.vExpired'));
      setVerifying(false);
      return;
    }

    if (type === 'recovery') {
      navigate('/reset-password', { replace: true });
      return;
    }

    // Honour redirect_to when it's a relative/same-origin path; else /auth/callback.
    let destination = '/auth/callback';
    if (redirectTo) {
      try {
        const url = new URL(redirectTo, window.location.origin);
        if (url.origin === window.location.origin) destination = url.pathname + url.search;
      } catch {
        if (redirectTo.startsWith('/')) destination = redirectTo;
      }
    }
    navigate(destination, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF9F0] px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-[#E5DFC6] bg-white p-8 sm:p-10 text-center shadow-[0_24px_70px_-30px_rgba(10,34,37,0.4)]">
        <img src={logomark} alt="Goldsainte" className="mx-auto h-12 w-auto" />

        {/* Gold accent divider */}
        <div className="mx-auto mt-5 h-px w-12 bg-gradient-to-r from-transparent via-[#C7A962] to-transparent" />

        <h1 className="mt-5 font-secondary text-[26px] sm:text-[28px] leading-tight text-[#0a2225]">
          {headline}
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#6B7280]">{subline}</p>

        {error ? (
          <div className="mt-7 space-y-4">
            <p className="text-sm text-red-600" role="alert">{error}</p>

            {resendState === 'sent' ? (
              <p className="text-sm text-[#0c4d47]">
                {t('auth.vSentSafe')}
              </p>
            ) : (
              <div className="space-y-2 text-left">
                <label htmlFor="resend-email" className="text-xs font-medium text-[#0a2225]">
                  {t('auth.vResendLabel')}
                </label>
                <div className="flex gap-2">
                  <input
                    id="resend-email"
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleResend()}
                    placeholder={t('auth.emailPh', "you@example.com")}
                    className="h-11 flex-1 rounded-xl border border-[#E5DFC6] bg-white px-4 text-sm text-[#0a2225] outline-none focus:border-[#C7A962]"
                  />
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendState === 'sending'}
                    className="h-11 shrink-0 rounded-xl bg-[#0c4d47] px-4 text-sm font-medium text-[#E5DFC6] transition-colors hover:bg-[#073331] disabled:opacity-50"
                  >
                    {resendState === 'sending' ? t('auth.sending') : t('auth.vSendNew')}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/marketplace', { replace: true })}
              className="inline-flex items-center justify-center rounded-full border border-[#0c4d47] px-6 py-3 text-sm font-medium text-[#0c4d47] hover:bg-[#0c4d47]/5 transition-colors"
            >
              {t('auth.browseTrips', "Browse trips")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleContinue}
            disabled={verifying}
            className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-6 py-3.5 text-sm font-medium text-[#f7f3ea] hover:bg-[#0a2225] transition-colors disabled:opacity-60"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('auth.vSigningYouIn')}
              </>
            ) : (
              <>
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthVerify;
