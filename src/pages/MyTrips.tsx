import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ItineraryBuilder } from "@/components/ItineraryBuilder";
import { ItineraryTimeline } from "@/components/ItineraryTimeline";
import { TravelDocumentUpload } from "@/components/TravelDocumentUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Calendar, FileText, Share2, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

export default function MyTrips() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    fetchItineraries(user.id);
  };

  const fetchItineraries = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trip_itineraries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItineraries(data || []);
    } catch (error) {
      console.error("Error fetching itineraries:", error);
      toast({
        title: "Error",
        description: "Failed to load your trips",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItinerary = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trip_itineraries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Trip deleted",
        description: "Your trip has been deleted successfully",
      });

      fetchItineraries(user.id);
    } catch (error) {
      console.error("Error deleting itinerary:", error);
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "secondary";
      case "active": return "default";
      case "completed": return "outline";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading your trips...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Trips</h1>
            <p className="text-muted-foreground">
              Manage your travel itineraries, documents, and plans
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Trip</DialogTitle>
              </DialogHeader>
              <ItineraryBuilder
                jobId=""
                userId={user?.id || ""}
                onComplete={() => {
                  setShowCreateDialog(false);
                  fetchItineraries(user.id);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {itineraries.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No trips yet</h3>
            <p className="text-muted-foreground mb-6">
              Start planning your next adventure by creating your first trip itinerary
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Trip
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {itineraries.map((itinerary) => (
              <Card key={itinerary.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{itinerary.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {itinerary.destination}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(itinerary.status)}>
                      {itinerary.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(itinerary.start_date), "MMM d")} - {format(new Date(itinerary.end_date), "MMM d, yyyy")}
                    </div>
                    {itinerary.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {itinerary.description}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setSelectedItinerary(itinerary)}
                        className="flex-1"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteItinerary(itinerary.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedItinerary && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedItinerary.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <MapPin className="h-4 w-4" />
                    {selectedItinerary.destination}
                    <span className="mx-2">•</span>
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedItinerary.start_date), "MMM d")} - {format(new Date(selectedItinerary.end_date), "MMM d, yyyy")}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSelectedItinerary(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="timeline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="documents">
                    <FileText className="mr-2 h-4 w-4" />
                    Documents
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="timeline" className="mt-6">
                  <ItineraryTimeline itineraryId={selectedItinerary.id} />
                </TabsContent>
                <TabsContent value="documents" className="mt-6">
                  <TravelDocumentUpload
                    itineraryId={selectedItinerary.id}
                    userId={user?.id || ""}
                    onUploadComplete={() => {
                      toast({
                        title: "Document uploaded",
                        description: "Your travel document has been saved",
                      });
                    }}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
