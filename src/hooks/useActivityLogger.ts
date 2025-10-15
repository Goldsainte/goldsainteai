import { supabase } from "@/integrations/supabase/client";

export interface ActivityLogParams {
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
}

export const useActivityLogger = () => {
  const logActivity = async (params: ActivityLogParams) => {
    try {
      const { error } = await supabase.functions.invoke('log-activity', {
        body: params,
      });

      if (error) {
        console.error('Failed to log activity:', error);
      }
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  return { logActivity };
};
