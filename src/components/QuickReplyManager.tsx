import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Zap, Trash2, Edit2, Save, X } from "lucide-react";

interface QuickReply {
  id: string;
  title: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  usage_count: number;
}

interface QuickReplyManagerProps {
  agentId: string;
  onSelectTemplate?: (content: string) => void;
}

export const QuickReplyManager = ({ agentId, onSelectTemplate }: QuickReplyManagerProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<QuickReply[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    shortcut: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, [agentId]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("quick_reply_templates")
        .select("*")
        .eq("agent_id", agentId)
        .eq("is_active", true)
        .order("usage_count", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await (supabase as any)
          .from("quick_reply_templates")
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category || null,
            shortcut: formData.shortcut || null,
          })
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Template updated",
          description: "Quick reply template has been updated",
        });
      } else {
        const { error } = await (supabase as any)
          .from("quick_reply_templates")
          .insert({
            agent_id: agentId,
            title: formData.title,
            content: formData.content,
            category: formData.category || null,
            shortcut: formData.shortcut || null,
          });

        if (error) throw error;

        toast({
          title: "Template created",
          description: "Quick reply template has been created",
        });
      }

      setFormData({ title: "", content: "", category: "", shortcut: "" });
      setShowAddForm(false);
      setEditingId(null);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (template: QuickReply) => {
    setFormData({
      title: template.title,
      content: template.content,
      category: template.category || "",
      shortcut: template.shortcut || "",
    });
    setEditingId(template.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("quick_reply_templates")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Template deleted",
        description: "Quick reply template has been removed",
      });

      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUseTemplate = async (template: QuickReply) => {
    // Increment usage count
    await (supabase as any)
      .from("quick_reply_templates")
      .update({ usage_count: template.usage_count + 1 })
      .eq("id", template.id);

    if (onSelectTemplate) {
      onSelectTemplate(template.content);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Replies
            </CardTitle>
            <CardDescription>Manage your message templates</CardDescription>
          </div>
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              setFormData({ title: "", content: "", category: "", shortcut: "" });
            }}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>Template Title</Label>
              <Input
                placeholder="e.g., Welcome Message"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Message Content</Label>
              <Textarea
                placeholder="Enter your message template..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category (Optional)</Label>
                <Input
                  placeholder="e.g., Greetings"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Shortcut (Optional)</Label>
                <Input
                  placeholder="e.g., /welcome"
                  value={formData.shortcut}
                  onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {editingId ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setFormData({ title: "", content: "", category: "", shortcut: "" });
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {templates.map((template) => (
            <div key={template.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{template.title}</h4>
                    {template.category && (
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    )}
                    {template.shortcut && (
                      <Badge variant="outline" className="text-xs">
                        {template.shortcut}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{template.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Used {template.usage_count} {template.usage_count === 1 ? "time" : "times"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {templates.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates yet</p>
              <p className="text-sm">Create your first quick reply template</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
