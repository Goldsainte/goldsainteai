import { useState } from 'react';
import { useCollections } from '@/hooks/useCollections';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Plus, Grid3x3, Lock, Globe, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

export default function Collections() {
  const navigate = useNavigate();
  const { collections, isLoading, createCollection, updateCollection, deleteCollection } = useCollections();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: true
  });

  const handleCreateCollection = async () => {
    if (!formData.name.trim()) return;

    await createCollection(formData.name, formData.description || undefined, formData.isPrivate);
    setShowCreateDialog(false);
    setFormData({ name: '', description: '', isPrivate: true });
  };

  const handleUpdateCollection = async () => {
    if (!editingCollection || !formData.name.trim()) return;

    await updateCollection(editingCollection.id, {
      name: formData.name,
      description: formData.description,
      is_private: formData.isPrivate
    });
    setEditingCollection(null);
    setFormData({ name: '', description: '', isPrivate: true });
  };

  const handleDeleteCollection = async (id: string) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      await deleteCollection(id);
    }
  };

  const openEditDialog = (collection: any) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      isPrivate: collection.is_private
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Collections</h1>
            <p className="text-muted-foreground">Organize your saved posts into collections</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-16">
            <Grid3x3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
            <p className="text-muted-foreground mb-6">
              Start organizing your saved posts by creating collections
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Collection
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map(collection => (
              <div
                key={collection.id}
                className="group relative aspect-square rounded-lg border bg-card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/collections/${collection.id}`)}
              >
                {collection.cover_image_url ? (
                  <img
                    src={collection.cover_image_url}
                    alt={collection.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Grid3x3 className="h-16 w-16 text-primary/40" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="bg-black/50 hover:bg-black/70">
                        <MoreVertical className="h-4 w-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(collection);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCollection(collection.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{collection.name}</h3>
                    {collection.is_private ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Globe className="h-4 w-4" />
                    )}
                  </div>
                  {collection.description && (
                    <p className="text-sm text-white/80 mb-2 line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                  <p className="text-sm text-white/60">
                    {collection.post_count || 0} posts
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingCollection}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingCollection(null);
            setFormData({ name: '', description: '', isPrivate: true });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? 'Edit Collection' : 'Create New Collection'}
            </DialogTitle>
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
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingCollection(null);
                  setFormData({ name: '', description: '', isPrivate: true });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={editingCollection ? handleUpdateCollection : handleCreateCollection}
                disabled={!formData.name.trim()}
                className="flex-1"
              >
                {editingCollection ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
