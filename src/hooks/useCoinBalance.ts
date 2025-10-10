import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCoinBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_coin_balance')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No balance record, create one
          const { data: newBalance } = await supabase
            .from('user_coin_balance')
            .insert({ user_id: user.id, balance: 0 })
            .select('balance')
            .single();
          
          setBalance(newBalance?.balance || 0);
        }
      } else {
        setBalance(data?.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching coin balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  return { balance, loading, refetch: fetchBalance };
};
