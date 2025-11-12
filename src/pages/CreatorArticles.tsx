import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  publish_date: string;
  created_at: string;
  read_time_minutes: number;
  hero_image_url: string;
}

export default function CreatorArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get creator ID
      const { data: creator } = await supabase
        .from("journal_creators" as any)
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!creator) {
        setArticles([]);
        return;
      }

      const { data, error } = await supabase
        .from("journal_articles" as any)
        .select("id, slug, title, dek, status, publish_date, created_at, read_time_minutes, hero_image_url")
        .eq("creator_id", (creator as any).id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles((data as any) || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast({
        title: "Error",
        description: "Failed to load articles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      // Delete article (blocks cascade automatically via ON DELETE CASCADE)
      const { error } = await supabase
        .from("journal_articles" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Article deleted",
        description: "Your article has been deleted",
      });

      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>My Articles | Goldsainte Journal</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-secondary text-4xl text-primary mb-2">
                My Articles
              </h1>
              <p className="text-muted-foreground">
                Manage your journal articles
              </p>
            </div>
            <Link to="/creator-articles/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Article
              </Button>
            </Link>
          </div>

          {/* Articles List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted aspect-[4/3] rounded-xl mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                No articles yet
              </p>
              <p className="text-muted-foreground mb-6">
                Create your first article to get started
              </p>
              <Link to="/creator-articles/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Article
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-background border border-border rounded-xl overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {article.hero_image_url && (
                      <img
                        src={article.hero_image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div
                      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${
                        article.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {article.status === "published" ? "Published" : "Draft"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {article.status === "published" && article.publish_date
                        ? `Published ${formatDistanceToNow(
                            new Date(article.publish_date),
                            { addSuffix: true }
                          )}`
                        : `Created ${formatDistanceToNow(
                            new Date(article.created_at),
                            { addSuffix: true }
                          )}`}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {article.status === "published" && (
                        <Link to={`/journal/${article.slug}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      <Link to={`/creator-articles/edit/${article.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(article.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
