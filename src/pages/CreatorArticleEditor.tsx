import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/journal/ImageUpload";
import { BlockEditor } from "@/components/journal/BlockEditor";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface Block {
  id: string;
  block_type: string;
  content: any;
}

export default function CreatorArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [dek, setDek] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroImageAlt, setHeroImageAlt] = useState("");
  const [heroImageCredit, setHeroImageCredit] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const { data: article, error } = await supabase
        .from("journal_articles" as any)
        .select("*, blocks:journal_article_blocks(*)")
        .eq("id", id)
        .single();

      if (error) throw error;

      setTitle((article as any).title);
      setDek((article as any).dek);
      setHeroImageUrl((article as any).hero_image_url);
      setHeroImageAlt((article as any).hero_image_alt);
      setHeroImageCredit((article as any).hero_image_credit);
      setCategories((article as any).categories || []);
      setStatus((article as any).status);
      setBlocks((article as any).blocks || []);
    } catch (error) {
      console.error("Error fetching article:", error);
      toast({
        title: "Error",
        description: "Failed to load article",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateArticle = () => {
    if (!title.trim()) {
      toast({
        title: "Validation error",
        description: "Title is required",
        variant: "destructive",
      });
      return false;
    }

    if (!dek.trim()) {
      toast({
        title: "Validation error",
        description: "Subheadline (dek) is required",
        variant: "destructive",
      });
      return false;
    }

    if (!heroImageUrl) {
      toast({
        title: "Validation error",
        description: "Hero image is required",
        variant: "destructive",
      });
      return false;
    }

    if (blocks.length === 0) {
      toast({
        title: "Validation error",
        description: "Article must have at least one content block",
        variant: "destructive",
      });
      return false;
    }

    // Calculate word count
    const wordCount = blocks
      .filter((b) => ["paragraph", "h2", "h3"].includes(b.block_type))
      .reduce((count, block) => {
        const text = block.content.text || "";
        return count + text.split(/\s+/).filter((w: string) => w).length;
      }, 0);

    if (wordCount < 300) {
      toast({
        title: "Validation error",
        description: "Article must be at least 300 words",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const calculateReadTime = () => {
    const wordCount = blocks
      .filter((b) => ["paragraph", "h2", "h3"].includes(b.block_type))
      .reduce((count, block) => {
        const text = block.content.text || "";
        return count + text.split(/\s+/).filter((w: string) => w).length;
      }, 0);
    return Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute
  };

  const handleSave = async (publishNow: boolean = false) => {
    if (publishNow && !validateArticle()) return;

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get or create creator
      let creatorId: string;
      const { data: existingCreator } = await supabase
        .from("journal_creators" as any)
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingCreator) {
        creatorId = (existingCreator as any).id;
      } else {
        const { data: profile } = await supabase
          .from("profiles" as any)
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();

        const { data: newCreator, error: creatorError } = await supabase
          .from("journal_creators" as any)
          .insert({
            user_id: user.id,
            name: (profile as any)?.username || "Anonymous",
            slug: crypto.randomUUID(),
            avatar_url: (profile as any)?.avatar_url,
          })
          .select()
          .single();

        if (creatorError) throw creatorError;
        creatorId = (newCreator as any).id;
      }

      // Generate slug
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const articleData = {
        title,
        slug: `${slug}-${Date.now()}`,
        dek,
        hero_image_url: heroImageUrl,
        hero_image_alt: heroImageAlt,
        hero_image_credit: heroImageCredit,
        creator_id: creatorId,
        categories,
        read_time_minutes: calculateReadTime(),
        status: publishNow ? "published" : "draft",
        publish_date: publishNow ? new Date().toISOString() : null,
      };

      let articleId: string;

      if (id) {
        // Update existing article
        const { error: updateError } = await supabase
          .from("journal_articles" as any)
          .update(articleData as any)
          .eq("id", id);

        if (updateError) throw updateError;
        articleId = id;

        // Delete old blocks
        await supabase
          .from("journal_article_blocks" as any)
          .delete()
          .eq("article_id", id);
      } else {
        // Create new article
        const { data: newArticle, error: createError } = await supabase
          .from("journal_articles" as any)
          .insert(articleData as any)
          .select()
          .single();

        if (createError) throw createError;
        articleId = (newArticle as any).id;
      }

      // Insert blocks
      if (blocks.length > 0) {
        const blocksToInsert = blocks.map((block, index) => ({
          article_id: articleId,
          block_type: block.block_type,
          block_order: index,
          content: block.content,
        }));

        const { error: blocksError } = await supabase
          .from("journal_article_blocks" as any)
          .insert(blocksToInsert as any);

        if (blocksError) throw blocksError;
      }

      toast({
        title: publishNow ? "Article published!" : "Draft saved",
        description: publishNow
          ? "Your article is now live"
          : "Your article has been saved as a draft",
      });

      navigate("/creator-articles");
    } catch (error) {
      console.error("Error saving article:", error);
      toast({
        title: "Error",
        description: "Failed to save article",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>
          {id ? "Edit Article" : "Create Article"} | Goldsainte Journal
        </title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/creator-articles")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Articles
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving}>
                <Send className="w-4 h-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>

          {/* Editor Form */}
          <div className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter article title..."
                  className="text-2xl font-secondary"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Subheadline (Dek) *
                </label>
                <Textarea
                  value={dek}
                  onChange={(e) => setDek(e.target.value)}
                  placeholder="Brief description or subheadline..."
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Categories
                </label>
                <Input
                  value={categories.join(", ")}
                  onChange={(e) =>
                    setCategories(
                      e.target.value.split(",").map((c) => c.trim())
                    )
                  }
                  placeholder="Destinations, Inspiration, Food & Drink..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate with commas
                </p>
              </div>
            </div>

            {/* Hero Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Hero Image *</h3>
              <ImageUpload
                currentImageUrl={heroImageUrl}
                onImageUploaded={setHeroImageUrl}
              />
              <Input
                value={heroImageAlt}
                onChange={(e) => setHeroImageAlt(e.target.value)}
                placeholder="Alt text for accessibility"
              />
              <Input
                value={heroImageCredit}
                onChange={(e) => setHeroImageCredit(e.target.value)}
                placeholder="Photo credit (optional)"
              />
            </div>

            {/* Content Blocks */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Article Content</h3>
              <BlockEditor blocks={blocks} onChange={setBlocks} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
