import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Compass, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TripBuilderForm } from "@/components/trips/TripBuilderForm";
import { BackButton } from "@/components/ui/BackButton";

export default function TripBuilderPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAgent, isCreator, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [saving, setSaving] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      navigate("/auth?mode=signin");
      return;
    }
    if (!isAgent && !isCreator) {
      toast.error("Only agents and creators can access the Trip Builder");
      navigate("/");
      return;
    }
  }, [user, isAgent, isCreator, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (editId && user) {
      loadTrip(editId);
    }
  }, [editId, user]);

  const loadTrip = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("packaged_trips")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Check ownership
      if (data.agent_id !== user?.id && data.creator_id !== user?.id) {
        toast.error("You don't have permission to edit this trip");
        navigate("/trip-builder");
        return;
      }
      
      setTripData(data);
    } catch (error: any) {
      toast.error("Failed to load trip: " + error.message);
      navigate("/trip-builder");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSave = async (formData: any, status: "draft" | "published") => {
    if (!user) return;

    try {
      setSaving(true);
      
      const slug = formData.slug || generateSlug(formData.title);
      
      const tripPayload = {
        ...formData,
        slug,
        status,
        creator_type: isAgent ? "agent" : "creator",
        agent_id: isAgent ? user.id : null,
        creator_id: isCreator ? user.id : null,
        published_at: status === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (editId) {
        const { error } = await supabase
          .from("packaged_trips")
          .update(tripPayload)
          .eq("id", editId);

        if (error) throw error;
        toast.success(status === "published" ? "Trip published!" : "Draft saved");
      } else {
        const { data, error } = await supabase
          .from("packaged_trips")
          .insert(tripPayload)
          .select()
          .single();

        if (error) throw error;
        toast.success(status === "published" ? "Trip published!" : "Draft saved");
        
        // Redirect to edit mode with the new ID
        navigate(`/trip-builder?edit=${data.id}`, { replace: true });
      }
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (editId) {
      window.open(`/trip/${tripData?.slug || editId}`, "_blank");
    } else {
      toast.info("Save the trip first to preview it");
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C7A962]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      {/* Editorial Header */}
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        {/* Back button - own row */}
        <div className="mb-6">
          <BackButton 
            label="Back to Dashboard" 
            to={isAgent ? "/agent-dashboard" : isCreator ? "/creator-dashboard" : "/marketplace"} 
          />
        </div>

        {/* Gold accent line */}
        <div className="w-16 h-0.5 bg-[#C7A962] mb-6" />

        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-[#E5DFC6] mb-4">
          <Compass className="h-4 w-4 text-[#C7A962]" />
          <span className="text-sm font-medium text-[#6B7280] tracking-wide">
            Trip Builder
          </span>
        </div>

        {/* Large serif title with italic brand */}
        <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225] tracking-tight">
          {editId ? "Edit Trip" : "Trip Builder"} by <em>Goldsainte AI</em>
        </h1>

        {/* Descriptive caption */}
        <p className="mt-3 text-[#6B7280] text-base max-w-xl leading-relaxed">
          Create ready-to-book experiences for the marketplace. 
          Your curated trips inspire travelers and earn you commissions.
        </p>

        {/* Preview button for edit mode */}
        {editId && (
          <div className="mt-6">
            <Button 
              variant="outline" 
              onClick={handlePreview} 
              className="rounded-full px-6 border-[#E5DFC6] hover:bg-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Trip
            </Button>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <TripBuilderForm
          initialData={tripData}
          onSave={handleSave}
          saving={saving}
          isEditing={!!editId}
        />
      </div>
    </div>
  );
}
