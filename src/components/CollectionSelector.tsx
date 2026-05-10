import { useState } from 'react';
import { useCollections } from '@/hooks/useCollections';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Check, FolderPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CollectionSelectorProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CollectionSelector = ({ postId, open, onOpenChange }: CollectionSelectorProps) => {
  const { collections, addPostToCollection, removePostFromCollection, createCollection } = useCollections();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());

  const handleToggleCollection = async (collectionId: string, isAdded: boolean) => {
    if (isAdded) {
      await addPostToCollection(collectionId, postId);
      setSelectedCollections(prev => new Set(prev).add(collectionId));
    } else {
      await removePostFromCollection(collectionId, postId);
      setSelectedCollections(prev => {
        const next = new Set(prev);
        next.delete(collectionId);
        return next;
      });
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    const newCollection = await createCollection(
      newCollectionName,
      newCollectionDescription || undefined,
      isPrivate
    );

    if (newCollection) {
      await addPostToCollection(newCollection.id, postId);
      setSelectedCollections(prev => new Set(prev).add(newCollection.id));
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowCreateForm(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[9999]" onOpenAutoFocus={(e) => {
      }}>
        <DialogHeader>
          <DialogTitle>Save to Collection</DialogTitle>
        </DialogHeader>

        {!showCreateForm ? (
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4" />
              Create New Collection
            </Button>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {collections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No collections yet</p>
                    <p className="text-sm">Create one to organize your saved saintes</p>
                  </div>
                ) : (
                  collections.map(collection => (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleToggleCollection(collection.id, !selectedCollections.has(collection.id))}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{collection.name}</p>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground">{collection.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {collection.post_count || 0} saintes
                        </p>
                      </div>
                      <div className="ml-4">
                        {selectedCollections.has(collection.id) && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                placeholder="e.g., Dream Destinations"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description..."
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="private"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
              />
              <Label htmlFor="private" className="text-sm">
                Make this collection private
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCollectionName('');
                  setNewCollectionDescription('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className="flex-1"
              >
                Create & Add
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
