import { Calendar, MapPin, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const SearchBar = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Where to?"
              className="pl-10 h-11 border-border"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              className="pl-10 h-11 border-border"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              className="pl-10 h-11 border-border"
            />
          </div>

          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="2 guests"
              className="pl-10 h-11 border-border"
            />
          </div>
        </div>

        <Button className="w-full mt-4 h-11 bg-primary text-primary-foreground hover:bg-primary/90">
          <Search className="h-4 w-4 mr-2" />
          Search properties
        </Button>
      </div>
    </div>
  );
};
