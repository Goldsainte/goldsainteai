import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface PeopleTagSelectorProps {
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
}

export const PeopleTagSelector = ({
  selectedUserIds,
  onSelectionChange,
}: PeopleTagSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Strip leading @ and whitespace for search
    const sanitizedQuery = searchQuery.trim().replace(/^@+/, '');
    
    if (sanitizedQuery.length < 2) {
      setProfiles([]);
      return;
    }

    const searchProfiles = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .ilike("username", `%${sanitizedQuery}%`)
          .limit(10);

        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error("Error searching profiles:", error);
        toast({
          title: "Error",
          description: "Failed to search for users",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchProfiles, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, toast]);

  const handleSelectProfile = (profile: Profile) => {
    if (selectedUserIds.includes(profile.id)) return;

    const newSelected = [...selectedProfiles, profile];
    setSelectedProfiles(newSelected);
    onSelectionChange([...selectedUserIds, profile.id]);
    setSearchQuery("");
    setProfiles([]);
  };

  const handleRemoveProfile = (userId: string) => {
    const newSelected = selectedProfiles.filter((p) => p.id !== userId);
    setSelectedProfiles(newSelected);
    onSelectionChange(newSelected.map((p) => p.id));
  };

  return (
    <div className="space-y-4">
      {/* Selected People */}
      {selectedProfiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProfiles.map((profile) => (
            <Badge key={profile.id} variant="secondary" className="gap-2 pr-1 pl-2">
              <Avatar className="w-5 h-5">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{profile.username}</span>
              <button
                onClick={() => handleRemoveProfile(profile.id)}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Search Results */}
      {isLoading && (
        <div className="text-sm text-muted-foreground text-center py-4">
          Searching...
        </div>
      )}

      {!isLoading && profiles.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleSelectProfile(profile)}
              disabled={selectedUserIds.includes(profile.id)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="font-medium">{profile.username}</p>
              </div>
              {selectedUserIds.includes(profile.id) && (
                <Badge variant="secondary">Tagged</Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {!isLoading && searchQuery.trim().replace(/^@+/, '').length >= 2 && profiles.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-4">
          No users found
        </div>
      )}
    </div>
  );
};
