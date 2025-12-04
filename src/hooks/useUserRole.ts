import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isBrand, setIsBrand] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsAgent(false);
        setIsCreator(false);
        setIsBrand(false);
        setLoading(false);
        return;
      }

      try {
        // Check user_roles table
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) throw rolesError;

        const roles = rolesData?.map(r => r.role) || [];
        setIsAdmin(roles.includes('admin'));
        setIsAgent(roles.includes('agent'));
        setIsBrand(roles.includes('brand'));

        // Check profile account_type for creator status
        const { data: profileData } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();
        
        if (profileData?.account_type === 'creator') {
          setIsCreator(true);
        }
      } catch (error) {
        console.error('Error checking user roles:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRoles();
  }, [user]);

  return { 
    isAdmin, 
    isAgent, 
    isCreator,
    isBrand,
    loading,
    hasAgentAccess: isAdmin || isAgent,
    hasCreatorAccess: isAdmin || isCreator,
  };
};
