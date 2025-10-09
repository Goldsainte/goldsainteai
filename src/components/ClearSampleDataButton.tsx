import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const ClearSampleDataButton = () => {
  const [loading, setLoading] = useState(false);

  const clearSampleData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to clear data");
        return;
      }

      // Delete all posts that don't belong to the current user
      const { error } = await supabase
        .from("travel_posts")
        .delete()
        .neq("user_id", user.id);

      if (error) throw error;

      toast.success("Sample videos removed successfully!");
      window.location.reload();
    } catch (error: any) {
      console.error("Error clearing sample data:", error);
      toast.error(error.message || "Failed to clear sample data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="w-4 h-4 mr-2" />
          Remove Sample Videos
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Sample Videos?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove all videos that were not uploaded by you. Your own videos will remain untouched. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={clearSampleData} disabled={loading}>
            {loading ? "Removing..." : "Remove Sample Videos"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
