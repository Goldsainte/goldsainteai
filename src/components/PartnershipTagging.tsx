import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  account_type: string;
  is_verified: boolean;
}

interface PartnershipTaggingProps {
  onPartnershipChange: (brandId: string | null) => void;
  currentBrandId?: string | null;
}

export const PartnershipTagging = ({ onPartnershipChange, currentBrandId }: PartnershipTaggingProps) => {
  const [isPaidPartnership, setIsPaidPartnership] = useState(!!currentBrandId);
  const [searchQuery, setSearchQuery] = useState("");
  const [brands, setBrands] = useState<Profile[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPaidPartnership && searchQuery.length >= 2) {
      searchBrands();
    } else {
      setBrands([]);
    }
  }, [searchQuery, isPaidPartnership]);

  const searchBrands = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, account_type, is_verified")
        .or(`account_type.eq.business,account_type.eq.verified,is_verified.eq.true`)
        .ilike("username", `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error("Error searching brands:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    setIsPaidPartnership(checked);
    if (!checked) {
      setSelectedBrand(null);
      setSearchQuery("");
      onPartnershipChange(null);
    }
  };

  const handleSelectBrand = (brand: Profile) => {
    setSelectedBrand(brand);
    setSearchQuery(brand.username);
    setBrands([]);
    onPartnershipChange(brand.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="paid-partnership" className="text-sm font-medium">
          Paid Partnership
        </Label>
        <Checkbox
          id="paid-partnership"
          checked={isPaidPartnership}
          onCheckedChange={(checked) => { const v = checked === true; (handleToggle)(v); }}
        />
      </div>

      {isPaidPartnership && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Tag Brand Account
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for verified brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {selectedBrand && (
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-accent/50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedBrand.avatar_url || ""} />
                <AvatarFallback>{selectedBrand.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">@{selectedBrand.username}</p>
              </div>
              {selectedBrand.is_verified && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
            </div>
          )}

          {brands.length > 0 && !selectedBrand && (
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-2 space-y-1">
                {brands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => handleSelectBrand(brand)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-lg transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={brand.avatar_url || ""} />
                      <AvatarFallback>{brand.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">@{brand.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">{brand.account_type}</p>
                    </div>
                    {brand.is_verified && (
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {isPaidPartnership && !selectedBrand && (
            <p className="text-xs text-muted-foreground">
              Only verified, business, or creator accounts can be tagged. Brand must approve before label shows.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
