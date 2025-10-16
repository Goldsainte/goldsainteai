import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { format } from "date-fns";

interface SearchHistory {
  id: string;
  search_type: string;
  search_params: any;
  created_at: string;
}

interface ActivitySectionProps {
  searchHistory: SearchHistory[];
}

export function ActivitySection({ searchHistory }: ActivitySectionProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  if (searchHistory.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No search history</h3>
          <p className="text-muted-foreground text-center">
            Your recent searches will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {searchHistory.map((search) => (
        <Card key={search.id} className="hover:shadow-md transition-shadow">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Search className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {search.search_type.charAt(0).toUpperCase() + search.search_type.slice(1)} Search
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(search.created_at)}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Search Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
