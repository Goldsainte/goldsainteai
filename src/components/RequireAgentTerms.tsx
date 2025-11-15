import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AgentTermsAcceptanceModal } from './AgentTermsAcceptanceModal';
import { Loader2 } from 'lucide-react';

interface RequireAgentTermsProps {
  children: React.ReactNode;
}

export const RequireAgentTerms = ({ children }: RequireAgentTermsProps) => {
  const [loading, setLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkTermsAcceptance();
  }, []);

  const checkTermsAcceptance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const isAdmin = roles?.some(r => r.role === 'admin');
      
      // Admins bypass all checks
      if (isAdmin) {
        setTermsAccepted(true);
        setLoading(false);
        return;
      }

      // For non-admins, check agent record
      const { data: agent } = await supabase
        .from('travel_agents')
        .select('id, terms_accepted')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!agent) {
        navigate('/');
        return;
      }

      setAgentId(agent.id);
      setTermsAccepted(agent.terms_accepted || false);
    } catch (error) {
      console.error('Error checking terms:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!termsAccepted && agentId) {
    return (
      <AgentTermsAcceptanceModal
        open={true}
        agentId={agentId}
        onAccepted={() => {
          setTermsAccepted(true);
        }}
      />
    );
  }

  return <>{children}</>;
};
