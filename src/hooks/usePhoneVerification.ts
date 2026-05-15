import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VerificationState {
  isLoading: boolean;
  error: string | null;
  codeSent: boolean;
  verified: boolean;
}

export function usePhoneVerification() {
  const [state, setState] = useState<VerificationState>({
    isLoading: false,
    error: null,
    codeSent: false,
    verified: false,
  });

  const formatToE164 = useCallback((countryCode: string, phoneNumber: string): string => {
    // Remove all non-digit characters from phone number
    const digits = phoneNumber.replace(/\D/g, '');
    // Ensure country code starts with +
    const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
    return `${code}${digits}`;
  }, []);

  const sendVerificationCode = useCallback(async (phone: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to verify your phone');
      }

      const { data, error } = await supabase.functions.invoke('send-phone-verification', {
        body: { phone },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to send code');

      setState(prev => ({ ...prev, isLoading: false, codeSent: true }));
      toast({
        title: 'Code Sent',
        description: 'Check your phone for the verification code',
      });
      return { success: true };
    } catch (err: any) {
      const message = err.message || 'Failed to send verification code';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    }
  }, []);

  const checkVerificationCode = useCallback(async (phone: string, code: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to verify your phone');
      }

      const { data, error } = await supabase.functions.invoke('check-phone-verification', {
        body: { phone, code },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (!data?.verified) throw new Error(data?.error || 'Invalid code');

      // Also link this phone to the auth account so the user can sign in with it.
      // Best-effort: don't fail the verification if linking errors out.
      try {
        const { error: linkError } = await supabase.auth.updateUser({ phone });
        if (linkError) {
          console.warn('Phone verified but auth link failed:', linkError.message);
        }
      } catch (linkErr) {
        console.warn('Phone verified but auth link threw:', linkErr);
      }

      setState(prev => ({ ...prev, isLoading: false, verified: true }));
      toast({
        title: 'Phone Verified',
        description: 'Your phone number has been verified successfully',
      });
      return { verified: true };
    } catch (err: any) {
      const message = err.message || 'Verification failed';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      toast({
        title: 'Verification Failed',
        description: message,
        variant: 'destructive',
      });
      return { verified: false, error: message };
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      codeSent: false,
      verified: false,
    });
  }, []);

  return {
    ...state,
    sendVerificationCode,
    checkVerificationCode,
    formatToE164,
    reset,
  };
}
