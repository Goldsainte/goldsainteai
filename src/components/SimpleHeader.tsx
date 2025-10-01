import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";
import logomark from "@/assets/logomark-seal-gold.png";

export const SimpleHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center px-4 py-2 min-h-20">
        <SidebarTrigger className="mr-4" />
        <a href="/" className="flex flex-col gap-0.5 leading-tight">
          <div className="flex items-center gap-2">
            <img src={logomark} alt="Goldsainte logo" className="h-8 w-8" />
            <span className="font-chiffon text-lg font-bold">Goldsainte.Ai</span>
          </div>
          <p className="text-sm font-medium">
            The first travel platform to combine AI precision with human passion — one platform, infinite possibilities.
          </p>
        </a>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="rounded-full"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost"
                onClick={signOut}
                className="rounded-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="rounded-full"
                onClick={() => navigate('/auth')}
              >
                Log in
              </Button>
              <Button 
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate('/auth')}
              >
                Sign up for free
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
