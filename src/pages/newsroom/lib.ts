import { supabase } from "@/integrations/supabase/client";

export const BASE_URL = "https://goldsainte.ai";

export const COMPANY_BOILERPLATE_LONG =
  "Goldsainte is an AI-powered travel marketplace connecting travelers with vetted travel creators and independent travel agents. Founded in Charlotte, North Carolina, Goldsainte combines editorial storytelling with concierge-grade booking — every itinerary is custom-designed, transparently priced, and protected on-platform. The company is reimagining how modern travelers discover, plan, and book unforgettable experiences.";

export const COMPANY_BOILERPLATE_MEDIUM =
  "Goldsainte is an AI-powered travel marketplace based in Charlotte, NC, connecting travelers with vetted creators and agents to design custom, transparently priced trips — all booked and protected on-platform.";

export const COMPANY_BOILERPLATE_SHORT =
  "Goldsainte is an AI-powered travel marketplace where travelers commission custom trips from vetted creators and agents.";

export type NewsroomArticle = {
  id: string;
  slug: string;
  type: "press_release" | "news" | "announcement";
  title: string;
  subtitle: string | null;
  excerpt: string;
  body: string;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  hero_image_credit: string | null;
  author_id: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  updated_at: string;
  created_at: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  category: string | null;
  tags: string[] | null;
  dateline_location: string | null;
  press_contact_name: string | null;
  press_contact_email: string | null;
  author?: NewsroomAuthor | null;
};

export type NewsroomAuthor = {
  id: string;
  slug: string;
  full_name: string;
  title: string;
  bio: string;
  avatar_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  quote: string | null;
  expertise: string[] | null;
  signature_image_url?: string | null;
};

export function articlePath(a: Pick<NewsroomArticle, "type" | "slug">) {
  const segment = a.type === "press_release" ? "press-releases" : "news";
  return `/newsroom/${segment}/${a.slug}`;
}

export function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function fetchPublishedArticles(opts?: { type?: string; limit?: number }) {
  let q = (supabase as any)
    .from("newsroom_articles")
    .select("*, author:newsroom_authors(id, slug, full_name, title, avatar_url, bio, expertise, quote, signature_image_url, linkedin_url, twitter_url)")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (opts?.type) q = q.eq("type", opts.type);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as NewsroomArticle[];
}

export async function fetchArticleBySlug(slug: string) {
  const { data, error } = await (supabase as any)
    .from("newsroom_articles")
    .select("*, author:newsroom_authors(id, slug, full_name, title, avatar_url, bio, expertise, quote, signature_image_url, linkedin_url, twitter_url)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as NewsroomArticle | null;
}

export async function fetchAuthors() {
  const { data, error } = await (supabase as any)
    .from("newsroom_authors")
    .select("id, slug, full_name, title, avatar_url, bio, expertise, quote, signature_image_url, linkedin_url, twitter_url")
    .order("full_name");
  if (error) throw error;
  return (data || []) as NewsroomAuthor[];
}

export async function fetchRelatedArticles(opts: { category: string | null; excludeId: string; limit?: number }) {
  let q = (supabase as any)
    .from("newsroom_articles")
    .select("id, slug, type, title, excerpt, published_at, category, hero_image_url")
    .eq("status", "published")
    .neq("id", opts.excludeId)
    .order("published_at", { ascending: false })
    .limit(opts.limit ?? 3);
  if (opts.category) q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as Pick<NewsroomArticle, "id" | "slug" | "type" | "title" | "excerpt" | "published_at" | "category" | "hero_image_url">[];
}

export const EXTERNAL_PRESS: { outlet: string; title: string; url: string; date: string }[] = [];
