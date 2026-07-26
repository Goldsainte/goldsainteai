import { supabase } from "@/integrations/supabase/client";

export interface ActivityLogParams {
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
}

export const useActivityLogger = () => {
  /**
   * @param accessToken Pass the token from the auth response when logging an
   * event that happens AT sign-in/sign-up. The log-activity function
   * authenticates the caller with auth.getUser(); immediately after
   * signInWithPassword resolves, functions.invoke can still send the anon key
   * because the new session hasn't propagated to the client yet — the function
   * then answers 401 and the browser reports the opaque
   * "Edge Function returned a non-2xx status code" (seen live Jul 26).
   * Handing the token over explicitly removes the race.
   */
  const logActivity = async (params: ActivityLogParams, accessToken?: string) => {
    try {
      const { error } = await supabase.functions.invoke('log-activity', {
        body: params,
        ...(accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : {}),
      });

      if (error) {
        // Activity logging is best-effort telemetry — never surface it to the
        // user or block the action that triggered it.
        console.warn('Activity log skipped:', error);
      }
    } catch (err) {
      console.warn('Activity log skipped:', err);
    }
  };

  return { logActivity };
};
