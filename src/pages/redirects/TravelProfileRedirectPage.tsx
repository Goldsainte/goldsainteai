import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function TravelProfileRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        navigate("/auth", { replace: true });
        return;
      }
      
      navigate(`/creator/${user.id}`, { replace: true });
    }

    checkAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Redirecting to your profile...</div>
    </div>
  );
}
