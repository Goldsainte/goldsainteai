import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "@/pages/NotFound";

export default function UsernameRedirect() {
  const { username } = useParams();
  const [state, setState] = useState<{ loading: boolean; to?: string; missing?: boolean }>({ loading: true });

  useEffect(() => {
    if (!username) return;
    const handle = username.replace(/^@/, "").toLowerCase();
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, account_type, role")
        .eq("username", handle)
        .maybeSingle();
      if (!data) {
        setState({ loading: false, missing: true });
        return;
      }
      const kind = (data.account_type || data.role || "").toLowerCase();
      let to = `/travel-profile/${data.id}`;
      if (kind === "agent") to = `/agents/${data.id}`;
      else if (kind === "creator") to = `/creators/${data.id}`;
      setState({ loading: false, to });
    })();
  }, [username]);

  if (state.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-[#6B7280]">
        Loading…
      </div>
    );
  }
  if (state.missing) return <NotFound />;
  return <Navigate to={state.to!} replace />;
}