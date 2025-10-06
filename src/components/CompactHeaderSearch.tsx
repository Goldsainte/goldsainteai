import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const CompactHeaderSearch = () => {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      className="flex items-center gap-2 px-3 h-10 rounded-full border-border shadow-sm hover:shadow-md transition-all bg-background w-full max-w-[280px] md:max-w-3xl"
      aria-label="Open search"
      onClick={() => navigate('/search?type=hotels')}
    >
      <Search className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">Search</span>
    </Button>
  );
};
