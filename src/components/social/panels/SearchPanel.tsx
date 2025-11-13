import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export default function SearchPanel() {
  const [q, setQ] = useState("");

  // hook into your real search API here
  // const { data, isLoading } = useSearchUsersAndTags(q);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <h2 className="text-2xl font-bold">Search</h2>
        <p className="text-sm text-muted-foreground">
          Find people, tags, and places
        </p>
        <div className="mt-4">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="h-10"
          />
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto p-2">
        {/* Replace with results list */}
        <div className="p-4 text-sm text-muted-foreground">
          {q ? "Searching…" : "Recent searches will appear here"}
        </div>
      </div>
    </div>
  );
}
