import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";

export const SimpleHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 md:h-14 items-center px-3 md:px-4">
        <SidebarTrigger className="mr-2 md:mr-4" />
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 md:gap-2">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="rounded-full h-11 w-11"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost"
                onClick={signOut}
                className="rounded-full h-11 px-3 md:px-4"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="rounded-full h-11 px-3 md:px-4 text-sm md:text-base"
                onClick={() => navigate('/auth')}
              >
                Log in
              </Button>
              <Button 
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-3 md:px-4 text-sm md:text-base"
                onClick={() => navigate('/auth')}
              >
                <span className="hidden sm:inline">Sign up for free</span>
                <span className="sm:hidden">Sign up</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
