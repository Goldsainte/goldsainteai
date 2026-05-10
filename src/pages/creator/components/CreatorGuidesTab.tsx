import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Eye, Trash2, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

type Guide = {
  id: string;
  title: string;
  destination: string;
  price: number;
  currency: string;
  status: string;
  cover_image_url: string | null;
};

export function CreatorGuidesTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("itinerary_products")
      .select("id, title, destination, price, currency, status, cover_image_url")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });
    setGuides((data as Guide[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this guide? This cannot be undone.")) return;
    const { error } = await supabase.from("itinerary_products").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete: " + error.message);
      return;
    }
    toast.success("Guide deleted");
    setGuides((g) => g.filter((x) => x.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-secondary text-xl text-[#0a2225]">Your Guides</h2>
        <Button
          onClick={() => navigate("/itinerary-builder")}
          className="rounded-full bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Create New Guide
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#6B7280] text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : guides.length === 0 ? (
        <Card className="border-dashed border-2 border-[#E5DFC6] bg-transparent rounded-2xl p-10 text-center">
          <BookOpen className="h-6 w-6 text-[#C7A962] mx-auto" />
          <p className="mt-3 font-secondary text-lg text-[#0a2225]">No guides yet</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Package your travel knowledge into a sellable digital guide.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {guides.map((g) => (
            <Card key={g.id} className="border border-[#E5DFC6] bg-white rounded-2xl p-4 flex items-center gap-4">
              {g.cover_image_url ? (
                <img
                  src={g.cover_image_url}
                  alt={g.title}
                  className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-[#E5DFC6] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#0a2225] truncate">{g.title || "Untitled"}</p>
                <p className="text-xs text-[#6B7280] mt-0.5 truncate">{g.destination}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm text-[#0a2225]">
                    {g.currency === "USD" ? "$" : ""}{Number(g.price).toFixed(0)} {g.currency}
                  </span>
                  <span
                    className={
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider " +
                      (g.status === "published"
                        ? "bg-[#0c4d47]/10 text-[#0c4d47]"
                        : "bg-[#E5DFC6]/60 text-[#6B7280]")
                    }
                  >
                    {g.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link to={`/itinerary-builder?edit=${g.id}`}>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                </Link>
                <Link to={`/itinerary-guide/${g.id}`}>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(g.id)}
                  className="rounded-full text-[#9A9384] hover:text-[#0a2225]"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}