import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SearchPanel() {
  const [query, setQuery] = useState("");

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-4">Search</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {query ? (
          <p className="text-sm text-muted-foreground">Search results for "{query}"</p>
        ) : (
          <p className="text-sm text-muted-foreground">Recent searches will appear here</p>
        )}
      </div>
    </div>
  );
}
