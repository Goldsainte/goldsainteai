import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Search } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface CollaboratorSelectorProps {
  selectedCollaborators: string[];
  onCollaboratorsChange: (collaborators: string[]) => void;
}

export const CollaboratorSelector = ({ 
  selectedCollaborators, 
  onCollaboratorsChange 
}: CollaboratorSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const searchUsers = async () => {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      
      // Filter out already selected users
      const filtered = (data || []).filter(
        profile => !selectedCollaborators.includes(profile.id)
      );
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (profile: Profile) => {
    const newCollaborators = [...selectedCollaborators, profile.id];
    onCollaboratorsChange(newCollaborators);
    setSelectedProfiles([...selectedProfiles, profile]);
    setSearchQuery("");
    setSearchResults([]);
    toast.success(`Added ${profile.username} as collaborator`);
  };

  const handleRemoveUser = (userId: string) => {
    const newCollaborators = selectedCollaborators.filter(id => id !== userId);
    onCollaboratorsChange(newCollaborators);
    setSelectedProfiles(selectedProfiles.filter(p => p.id !== userId));
  };

  return (
    <div className="space-y-3">
      <Label>Invite Collaborators</Label>
      
      {/* Selected Collaborators */}
      {selectedProfiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProfiles.map(profile => (
            <div
              key={profile.id}
              className="flex items-center gap-2 bg-secondary rounded-full pl-1 pr-3 py-1"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {profile.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{profile.username}</span>
              <button
                onClick={() => handleRemoveUser(profile.id)}
                className="hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users to collaborate with..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
          {searchResults.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleSelectUser(profile)}
              className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-sm">
                  {profile.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{profile.username}</span>
            </button>
          ))}
        </div>
      )}

      {searching && (
        <p className="text-xs text-muted-foreground">Searching...</p>
      )}

      {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
        <p className="text-xs text-muted-foreground">No users found</p>
      )}

      <p className="text-xs text-muted-foreground">
        Collaborators will receive an invite and the post will appear on both profiles once accepted
      </p>
    </div>
  );
};
