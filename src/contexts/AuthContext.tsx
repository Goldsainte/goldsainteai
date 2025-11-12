import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';

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

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Then check for existing session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Auth session error:', error);
          // SECURITY: Supabase manages auth tokens securely in httpOnly cookies
          // Never manually store auth tokens in localStorage
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Fatal auth error:', error);
        // SECURITY: Clear UI preferences only, not auth tokens (handled by Supabase)
        // Preserve non-sensitive localStorage like language, theme, tour state
        setSession(null);
        setUser(null);
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
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

  const signUp = async (email: string, password: string, username?: string, firstName?: string, lastName?: string, phone?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/onboarding`;
      
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
          details: { email, username: username || email.split('@')[0], timestamp: new Date().toISOString() }
        });
        
        setUser(data.user);
        setSession(data.session);
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
    
    await supabase.auth.signOut();
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
