import { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Sentry from '@sentry/react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { loadSessionFromServer, pushSessionToServer, SessionSyncError, SESSION_SYNC_ENABLED } from '@/lib/auth/session-service';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username?: string, firstName?: string, lastName?: string, phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLogger();
  const { toast } = useToast();
  const navigate = useNavigate();
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour in milliseconds
  const sessionBootstrapFailures = useRef(0);
  const MAX_SESSION_FAILURES = 3;
  const sessionSetByListener = useRef(false);
  const authBootstrapResolved = useRef(false);

  const handleSessionSyncFailure = async (error: unknown) => {
    if (!SESSION_SYNC_ENABLED) {
      setIsLoading(false);
      return;
    }
    sessionBootstrapFailures.current += 1;
    Sentry.captureException(error, {
      level: 'warning',
      tags: { scope: 'session_sync', phase: 'bootstrap' },
      extra: { failures: sessionBootstrapFailures.current },
    });

    if (sessionBootstrapFailures.current >= MAX_SESSION_FAILURES) {
      await supabase.auth.signOut().catch(() => undefined);
      setSession(null);
      setUser(null);
      setIsLoading(false);
      toast({
        title: 'Session expired',
        description: 'We were unable to restore your session. Please sign in again.',
        variant: 'destructive',
      });
      sessionBootstrapFailures.current = 0;
    }
  };

  const resetSessionFailureCount = () => {
    sessionBootstrapFailures.current = 0;
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        // Ignore the eager INITIAL_SESSION event until we've explicitly
        // restored from storage. This avoids a refresh race where auth briefly
        // looks signed out and routing falls back to the account-type chooser.
        if (event === 'INITIAL_SESSION' && !authBootstrapResolved.current) {
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        sessionSetByListener.current = true;
        setIsLoading(false);
        resetSessionFailureCount();
        void pushSessionToServer(event, session).catch((error: unknown) => {
          Sentry.captureException(error, {
            level: 'warning',
            tags: { scope: 'session_sync', phase: 'push', event },
          });
        });
      }
    );

    const bootstrapSession = async () => {
      try {
        if (sessionSetByListener.current) {
          authBootstrapResolved.current = true;
          setIsLoading(false);
          return;
        }
        const serverSession = await loadSessionFromServer();
        if (!isMounted) return;

        if (serverSession) {
          const { data: hydrated, error: setSessionError } = await supabase.auth.setSession({
            access_token: serverSession.access_token,
            refresh_token: serverSession.refresh_token,
          });

          if (setSessionError) {
            setSession(null);
            setUser(null);
          } else {
            setSession(hydrated.session);
            setUser(hydrated.session?.user ?? null);
          }
          authBootstrapResolved.current = true;
          setIsLoading(false);
          resetSessionFailureCount();
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error) {
          setSession(null);
          setUser(null);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
        authBootstrapResolved.current = true;
        resetSessionFailureCount();
        setIsLoading(false);
      } catch (error) {
        if (!isMounted) return;
        authBootstrapResolved.current = true;
        if (error instanceof SessionSyncError) {
          await handleSessionSyncFailure(error);
        } else {
          Sentry.captureException(error, {
            level: 'error',
            tags: { scope: 'session_sync', phase: 'bootstrap' },
          });
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    void bootstrapSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Auto sign-out after inactivity
  useEffect(() => {
    if (!user) return;

    const resetInactivityTimer = () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = setTimeout(() => {
        signOut();
        toast({
          title: "Signed out due to inactivity",
          description: "You've been signed out after 1 hour of inactivity.",
          variant: "destructive",
        });
      }, INACTIVITY_LIMIT);
    };

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Initial timer setup
    resetInactivityTimer();

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [user, INACTIVITY_LIMIT]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      // Log successful sign in
      if (data.user) {
        await logActivity({
          action: 'user_login',
          entity_type: 'auth',
          entity_id: data.user.id,
          details: { email, timestamp: new Date().toISOString() }
        });
      }

      try {
        await pushSessionToServer('SIGNED_IN', data.session ?? null);
      } catch (error) {
        Sentry.captureException(error, {
          level: 'warning',
          tags: { scope: 'session_sync', phase: 'signin' },
        });
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      
      // Do not navigate here; let calling page handle post-login redirect
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username?: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
    accountType?: string
  ) => {
    try {
      // ===================================================================
      // CRITICAL: Block agent/brand from using this function
      // ===================================================================
      if (accountType === 'agent' || accountType === 'brand') {
        throw new Error(
          `${accountType} accounts require application approval. Please use the application form at /apply/agent or /brand/onboarding`
        );
      }

      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username || email.split('@')[0],
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            account_type: accountType || 'traveler',
          }
        }
      });
      
      if (error) throw error;
      
      // Log successful sign up
      if (data.user) {
        await logActivity({
          action: 'user_signup',
          entity_type: 'auth',
          entity_id: data.user.id,
          details: { 
            email, 
            username: username || email.split('@')[0],
            account_type: accountType || 'traveler',
            timestamp: new Date().toISOString() 
          }
        });
        
        setUser(data.user);
        setSession(data.session);
      }

      try {
        await pushSessionToServer('SIGNED_IN', data.session ?? null);
      } catch (error) {
        Sentry.captureException(error, {
          level: 'warning',
          tags: { scope: 'session_sync', phase: 'signup' },
        });
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    const currentUserId = user?.id;
    
    // Log sign out before clearing user data
    if (currentUserId) {
      await logActivity({
        action: 'user_logout',
        entity_type: 'auth',
        entity_id: currentUserId,
        details: { timestamp: new Date().toISOString() }
      });
    }
    
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Sign out error:', signOutError);
    }
    try {
      await pushSessionToServer('SIGNED_OUT', null);
    } catch (error) {
      Sentry.captureException(error, {
        level: 'warning',
        tags: { scope: 'session_sync', phase: 'signout' },
      });
    }
    setUser(null);
    setSession(null);
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signUp, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
