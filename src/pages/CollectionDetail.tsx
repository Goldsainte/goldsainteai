import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCollections } from '@/hooks/useCollections';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Grid3x3, Lock, Globe, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function CollectionDetail() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { collections, getCollectionPosts, updateCollection, deleteCollection, removePostFromCollection } = useCollections();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: true
  });

  const collection = collections.find(c => c.id === collectionId);

  useEffect(() => {
    if (collectionId) {
      loadPosts();
    }
  }, [collectionId]);

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description || '',
        isPrivate: collection.is_private
      });
    }
  }, [collection]);

  const loadPosts = async () => {
    if (!collectionId) return;
    setIsLoading(true);
    const data = await getCollectionPosts(collectionId);
    setPosts(data.map((item: any) => item.travel_posts));
    setIsLoading(false);
  };

  const handleUpdateCollection = async () => {
    if (!collection || !formData.name.trim()) return;

    await updateCollection(collection.id, {
      name: formData.name,
      description: formData.description,
      is_private: formData.isPrivate
    });
    setShowEditDialog(false);
  };

  const handleDeleteCollection = async () => {
    if (!collection) return;
    
    if (confirm('Are you sure you want to delete this collection?')) {
      await deleteCollection(collection.id);
      navigate('/collections');
    }
  };

  const handleRemovePost = async (postId: string) => {
    if (!collectionId) return;
    await removePostFromCollection(collectionId, postId);
    await loadPosts();
  };

  if (!collection) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Collection not found</h2>
            <Button onClick={() => navigate('/collections')}>
              Back to Collections
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/collections')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{collection.name}</h1>
                {collection.is_private ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {collection.description && (
                <p className="text-muted-foreground mb-2">{collection.description}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteCollection} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Collection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Grid3x3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-6">
              Posts you save to this collection will appear here
            </p>
            <Button onClick={() => navigate('/travel-feed')}>
              Browse Posts
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group relative aspect-square cursor-pointer overflow-hidden"
                onClick={() => navigate(`/travel-feed?postId=${post.id}`)}
              >
                <img
                  src={post.thumbnail_url || post.video_url}
                  alt={post.caption || 'Post'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-white text-center">
                    <p className="text-lg font-semibold">{post.like_count} likes</p>
                    <p className="text-sm">{post.comment_count} comments</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePost(post.id);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-black/90 rounded-full p-2"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                placeholder="e.g., Dream Destinations"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="private"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked as boolean })}
              />
              <Label htmlFor="private" className="text-sm">
                Make this collection private
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCollection}
                disabled={!formData.name.trim()}
                className="flex-1"
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
