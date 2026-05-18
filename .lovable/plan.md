# Goldsainte Newsroom Build Plan

A corporate newsroom at `/newsroom` (Stripe / Airbnb / American Airlines style), SEO-tuned for Google Search + Google News, with editorial CMS and seed content. Public, no auth.

## 1. Database (single migration)

New tables in `public`:
- **`newsroom_authors`** — slug, full_name, title, bio, avatar_url, email, linkedin_url, twitter_url.
- **`newsroom_articles`** — slug (unique), type (`press_release|news|announcement`), title, subtitle, excerpt, body (Markdown), hero_image_url/alt/credit, author_id → authors, status (`draft|published|archived`), published_at, SEO fields (meta_title, meta_description, og_image_url, canonical_url), category, tags[], dateline_location, press_contact_name, press_contact_email.
- **`press_inquiries`** — reporter_name, publication, email, phone, topic, deadline, message, created_at, handled bool.

Indexes: published_at DESC (partial: status='published'), type (partial), slug.

RLS:
- Articles + authors: public SELECT (articles gated by `status='published'`).
- Admin-only INSERT/UPDATE/DELETE via existing `has_role(auth.uid(),'admin')` SECURITY DEFINER helper.
- Press inquiries: public INSERT (anon allowed), admin SELECT only.

Triggers: `updated_at` autopopulate via existing `update_updated_at_column()`.

Storage: create public bucket `newsroom-media` (logos, headshots, hero images, media-kit ZIP) with admin-only write policies.

## 2. Routes (added to `src/App.tsx`)

```text
/newsroom                              → NewsroomLanding
/newsroom/press-releases/:slug         → ArticleDetail (type=press_release)
/newsroom/news/:slug                   → ArticleDetail (type=news)
/newsroom/media-kit                    → MediaKit
/newsroom/company-facts                → CompanyFacts
/newsroom/leadership                   → Leadership
/newsroom/editorial-policy             → EditorialPolicy
/newsroom/press-contact                → PressContact
/newsroom/archive                      → Archive
/admin/newsroom                        → AdminNewsroomList   (AdminGuard)
/admin/newsroom/new                    → AdminArticleEditor
/admin/newsroom/:id/edit               → AdminArticleEditor
/admin/newsroom/authors                → AdminAuthors
```

## 3. Frontend pages (luxury editorial: cream bg, dark green CTA, serif headers)

- **Landing**: eyebrow + H1 + subtitle, dual CTA (mailto press, email capture), featured most-recent press release, three-column grid (Recent Press Releases / Company News / In the Press), footer link cluster to Media Kit / Facts / Leadership / Editorial Policy.
- **ArticleDetail**: type badge → H1 → subtitle → dateline+date → hero img + credit → markdown body (rendered via `marked` + DOMPurify) → "About Goldsainte" boilerplate → press contact block. Includes `<Helmet>` head + JSON-LD `NewsArticle` schema.
- **MediaKit**: logo grid (PNG/SVG, light/dark, 3 sizes), brand colors with copy-to-clipboard, typography list, founder headshots, product screenshots, 50/100/200-word boilerplate blocks, "Download full kit (ZIP)" button (storage signed URL).
- **CompanyFacts**: structured fact sheet (Founded, HQ Charlotte NC, Founders, Description, Mission, Markets, User types, Investment, Contact). Includes `Organization` JSON-LD.
- **Leadership**: founder cards with photo, bio, LinkedIn, quote, expertise.
- **EditorialPolicy**: required sections for Google News (integrity, funding/sponsorship disclosure, corrections, author guidelines, diversity).
- **PressContact**: zod-validated form → inserts into `press_inquiries` + invokes `send-transactional-email` with new `press-inquiry-received` template (to press@goldsainte.com).
- **Archive**: paginated chronological list, filter by type/year.

Shared: `NewsroomLayout` (header w/ secondary nav for newsroom sub-pages, footer reuse).

## 4. SEO

- Install `react-helmet-async`; wrap app in `<HelmetProvider>` in `src/main.tsx` if not present.
- Remove `<link rel="canonical">` from `index.html` to avoid double canonicals.
- Per-article: `<title>`, meta description, canonical, full OG + Twitter card tags, `article:published_time`, JSON-LD `NewsArticle` (headline, image[], datePublished, dateModified, author Person, publisher Organization with logo, mainEntityOfPage, articleSection, keywords).
- Landing/section pages: `CollectionPage` JSON-LD + breadcrumbs.
- **Sitemap edge function** `sitemap-newsroom` → returns Google News–compliant XML (`xmlns:news`) from published articles. Exposed at `/newsroom-sitemap.xml` via a Vite middleware redirect AND linked from `public/robots.txt`. Add a small client route `/newsroom-sitemap.xml` is not viable — instead update `public/robots.txt` with the edge function URL directly and a rewrite note; primary URL is the edge function's public URL, and we'll also add a `<link rel="sitemap">` reference.
- Update `public/robots.txt`: `Allow: /newsroom`, add `Sitemap:` line.
- Extend the project's main `scripts/generate-sitemap.ts` to also include newsroom routes for the regular sitemap.

## 5. Admin CMS (`/admin/newsroom`)

- Gated by existing `AdminGuard`.
- List view: filter by status/type, search by title, columns (title, type, status, published_at, author).
- Editor: title, slug (auto from title, editable), type, subtitle, excerpt, hero image upload (storage), SEO fields, category, tags chips, dateline, press contact, **Markdown body** via `@uiw/react-md-editor`, status, scheduled `published_at`, "Save draft" / "Publish" / "Preview" buttons. Preview opens article route in new tab with draft preview token.
- Author management page: CRUD founder/author records.

## 6. Seed content (3 articles + 1 author via insert tool after migration)

1. **Press release** — "Goldsainte Launches AI-Powered Travel Marketplace" (~800 words, dateline CHARLOTTE, NC).
2. **News/essay** — "Why We Built Goldsainte: A Founder's Note" by Andre (~900 words).
3. **News/analysis** — "The State of the Modern Travel Marketplace" (~1000 words).

Hero images: generate 3 editorial photos via imagegen, store to `newsroom-media` bucket.

## 7. Email

New transactional template `press-inquiry-received` (acknowledgement to reporter) + admin notification to `press@goldsainte.com` using existing `send-transactional-email`. Registered in `_shared/transactional-email-templates/registry.ts`.

## 8. Dependencies to add

- `react-helmet-async`
- `marked` + `dompurify` + `@types/dompurify`
- `@uiw/react-md-editor` (admin only, lazy-loaded)

## 9. Out of scope / clarifying notes

- "Subscribe to updates" email-capture wired to a new `newsroom_subscribers` table (double opt-in not implemented — single insert + confirmation email).
- "In the Press" external coverage links: stored as a small static array for v1 (no DB), can be promoted to a table later.
- Google News inclusion requires manual submission in Google Publisher Center after launch — not automated.

## Technical notes

- Markdown rendering: server-side trust boundary is the admin role; still sanitize with DOMPurify before `dangerouslySetInnerHTML`.
- Slug uniqueness enforced at DB + auto-suggested on input.
- All public reads cached via React Query (`staleTime: 5min`).
- All copy follows project memory: serif headers, cream bg #f7f3ea, dark green CTA #0c4d47, gold accents.

Approve and I'll execute the migration first, then build pages, admin, SEO, and seed.