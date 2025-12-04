import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TripBuilderForm } from "@/components/trips/TripBuilderForm";

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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#E5DFC6]">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-[#0a2225] hover:bg-[#FDF9F0] rounded-full px-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="w-12 h-0.5 bg-[#C7A962] mb-2" />
                <h1 className="font-secondary text-2xl font-semibold text-[#0a2225]">
                  {editId ? "Edit Trip" : "Create Ready to Book Trip"}
                </h1>
                <p className="text-sm text-[#6B7280] mt-1">
                  Craft an unforgettable experience for the marketplace
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {editId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="border-[#E5DFC6] hover:bg-[#FDF9F0] rounded-full px-5"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-4 py-8">
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
