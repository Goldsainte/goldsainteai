import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TripPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  location?: string;
  taken_at?: string;
  user_id: string;
  agent_id?: string;
  created_at: string;
}

interface TripPhotosGalleryProps {
  agentId?: string;
  limit?: number;
}

export const TripPhotosGallery = ({ agentId, limit = 12 }: TripPhotosGalleryProps) => {
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [agentId]);

  const fetchPhotos = async () => {
    try {
      let query = supabase
        .from('trip_photos')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching trip photos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No trip photos available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.photo_url}
              alt={photo.caption || 'Trip photo'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {photo.location && (
                  <div className="flex items-center gap-1 text-white text-xs mb-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{photo.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Trip Photo</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <img
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.caption || 'Trip photo'}
                className="w-full rounded-lg"
              />
              {selectedPhoto.caption && (
                <p className="text-sm">{selectedPhoto.caption}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {selectedPhoto.location && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedPhoto.location}
                  </Badge>
                )}
                {selectedPhoto.taken_at && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedPhoto.taken_at).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
