import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Moon, Star, Instagram, Linkedin, Facebook, Link2, Globe, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PartnerMediaGallery } from "@/components/PartnerMediaGallery";

// ============================================================================
// PartnerProfileFora v2 — 1:1 replica of foratravel.com/advisor/{slug},
// corrected against the founder's live screenshots (Jul 15, 10:16 PM):
//   • Two-column layout: STICKY left identity card (rounded portrait photo,
//     logo chip overlapping, name, tier line, based-in / trips-starting-at
//     facts, contact button) — right column scrolls past it.
//   • Business name is the right column's H1.
//   • Ask us about → Our story (READ MORE) → Travel style (READ MORE) →
//     Stay connected → Reviews (n) as 2-col cards with gold stars +
//     "travel to {destination}" → See-all pill → Travel ideas (n) as
//     image-left rows with tag pills + Explore → Travel photos 2-col grid.
// kind="agent" tonight; creators reuse with kind="creator" — one skeleton.
// ============================================================================

export type PartnerKind = "agent" | "creator";

export interface PartnerReview {
  id: string;
  reviewerName: string;
  destination?: string | null;
  rating: number;
  createdAt: string;
  comment: string | null;
}

interface TravelIdea {
  id: string;
  title: string;
  slug: string;
  destination: string | null;
  cover_image_url: string | null;
  description?: string | null;
  href: string;
  views?: number;
}

export interface PartnerProfileForaProps {
  kind: PartnerKind;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  logoUrl?: string | null;
  businessName?: string | null;
  tierLabel?: string | null;
  location?: string | null;
  startingPricePerNight?: number | null;
  askUsAbout: string[];
  story?: string | null;
  travelStyle?: string | null;
  photos: string[];
  social: {
    tiktok?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    facebook?: string | null;
    pinterest?: string | null;
    website?: string | null;
  };
  reviews: PartnerReview[];
  reviewCount: number;
  ctaLabel: string;
  onCta: () => void;
  /** Owner-only controls (Edit public profile / Travel guides). Rendered on
   *  the sticky card when the signed-in viewer owns this profile. */
  ownerActions?: { label: string; onClick: () => void }[];
  /** Influence strip on the sticky card (creators: followers / avg views /
   *  trips) — the signal agents don't have. */
  stats?: { label: string; value: string }[];
  /** Content-first center band (creators: media feed + inspired trips). */
  contentSlot?: React.ReactNode;
  /** Suppress the built-in bottom media gallery when contentSlot renders it. */
  hideBottomGallery?: boolean;
}

const H = "text-[13px] font-semibold uppercase tracking-[0.16em] text-[#7A7151]";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-[#C7A962] text-[#C7A962]" : "text-[#C7A962]/30"}`}
        />
      ))}
    </span>
  );
}

function ReadMore({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 320;
  return (
    <div>
      <p className={`whitespace-pre-line leading-relaxed text-[#0a2225] ${!open && long ? "line-clamp-4" : ""}`}>
        {text}
      </p>
      {long && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0a2225] underline underline-offset-4"
        >
          Read more
        </button>
      )}
    </div>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="text-[#0a2225] transition-colors hover:text-[#0c4d47]"
    >
      {children}
    </a>
  );
}

export function PartnerProfileFora(props: PartnerProfileForaProps) {
  const {
    kind, userId, name, avatarUrl, logoUrl, businessName, tierLabel, location,
    startingPricePerNight, askUsAbout, story, travelStyle, photos, social,
    reviews, reviewCount, ctaLabel, onCta, ownerActions, contentSlot, hideBottomGallery, stats,
  } = props;
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllIdeas, setShowAllIdeas] = useState(false);
  const [ideas, setIdeas] = useState<TravelIdea[]>([]);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 4);
  const visibleIdeas = showAllIdeas ? ideas : ideas.slice(0, 3);
  const igHandle = social.instagram?.replace(/^@/, "");
  const ttHandle = social.tiktok?.replace(/^@/, "");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Fora-model: Travel ideas are editorial GUIDES first; bookable trips
      // remain the fallback until the author has written guides.
      const { data: guides } = await supabase
        .from("partner_guides")
        .select("id, title, slug, hero_image_url, tags, statement, view_count")
        .eq("author_id", userId)
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(24);
      if (cancelled) return;
      if (cancelled) return;
      setIdeas(
        ((guides as any[]) ?? []).map((g: any) => ({
          id: g.id,
          title: g.title,
          slug: g.slug,
          destination: (g.tags ?? [])[0] ?? null,
          cover_image_url: g.hero_image_url,
          description: g.statement,
          views: g.view_count ?? 0,
          href: `/guides/${g.slug}`,
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8">
      <div className="gap-10 lg:grid lg:grid-cols-[360px_1fr]">
        {/* ── Sticky identity card ─────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-[#F5F0E0]/70 p-3">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="aspect-[4/5] w-full rounded-2xl object-cover" />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-[#0c4d47]/10 font-secondary text-6xl text-[#0c4d47]">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={businessName || "logo"}
                  className="absolute bottom-4 left-4 h-20 w-20 rounded-2xl border border-[#E5DFC6] bg-white object-contain p-1 shadow"
                />
              )}
            </div>

            <div className="px-4 pb-5 pt-6">
              <h2 className="font-secondary text-3xl text-[#0a2225]">{name}</h2>
              {tierLabel && (
                <p className="mt-1 text-[13px] uppercase tracking-[0.18em] text-[#8D6B2F]">{tierLabel}</p>
              )}

              <div className="mt-5 divide-y divide-[#E5DFC6] border-y border-[#E5DFC6]">
                {location && (
                  <p className="flex items-center gap-2.5 py-4 text-[16px] text-[#0a2225]">
                    <MapPin className="h-5 w-5 shrink-0 text-[#0a2225]" /> Based in {location}
                  </p>
                )}
                {startingPricePerNight != null && startingPricePerNight > 0 && (
                  <p className="flex items-center gap-2.5 py-4 text-[16px] text-[#0a2225]">
                    <Moon className="h-5 w-5 shrink-0 text-[#0a2225]" /> Trips starting at $
                    {Number(startingPricePerNight).toLocaleString()}/night
                  </p>
                )}
              </div>

              {stats && stats.length > 0 && (
                <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-white/70 p-4 text-center">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <p className="font-secondary text-xl text-[#0a2225]">{s.value}</p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-[#0a2225]/60">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={onCta}
                className="mt-6 w-full rounded-full bg-[#0c4d47] px-6 py-4 text-[15px] font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225]"
              >
                {ctaLabel}
              </button>
              {ownerActions && ownerActions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {ownerActions.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={a.onClick}
                      className="w-full rounded-full border border-[#0a2225]/25 px-6 py-3 text-[14px] font-medium text-[#0a2225] transition-colors hover:bg-white"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrolling column ─────────────────────────────────────────── */}
        <div className="mt-10 min-w-0 lg:mt-0">
          {businessName && (
            <h1 className="font-secondary text-5xl leading-tight text-[#0a2225] md:text-6xl">{businessName}</h1>
          )}

          {askUsAbout.length > 0 && (
            <section className="mt-10">
              <h3 className={H}>Ask us about</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {askUsAbout.map((tag) => (
                  <span key={tag} className="rounded-full bg-[#F5F0E0] px-5 py-2.5 text-[15px] text-[#0a2225]">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {story && (
            <section className="mt-10">
              <h3 className={`${H} mb-3`}>Our story</h3>
              <ReadMore text={story} />
            </section>
          )}

          {travelStyle && (
            <section className="mt-10">
              <h3 className={`${H} mb-3`}>Travel style</h3>
              <ReadMore text={travelStyle} />
            </section>
          )}

          {(ttHandle || igHandle || social.linkedin || social.facebook || social.pinterest || social.website) && (
            <section className="mt-10">
              <h3 className={`${H} mb-4`}>Stay connected</h3>
              <div className="flex items-center gap-5">
                {ttHandle && (
                  <SocialIcon href={`https://www.tiktok.com/@${ttHandle}`} label="TikTok">
                    <Music2 className="h-6 w-6" />
                  </SocialIcon>
                )}
                {igHandle && (
                  <SocialIcon href={`https://www.instagram.com/${igHandle}`} label="Instagram">
                    <Instagram className="h-6 w-6" />
                  </SocialIcon>
                )}
                {social.linkedin && (
                  <SocialIcon href={social.linkedin} label="LinkedIn">
                    <Linkedin className="h-6 w-6" />
                  </SocialIcon>
                )}
                {social.facebook && (
                  <SocialIcon href={social.facebook} label="Facebook">
                    <Facebook className="h-6 w-6" />
                  </SocialIcon>
                )}
                {social.pinterest && (
                  <SocialIcon href={social.pinterest} label="Pinterest">
                    <Link2 className="h-6 w-6" />
                  </SocialIcon>
                )}
                {social.website && (
                  <SocialIcon href={social.website} label="Website">
                    <Globe className="h-6 w-6" />
                  </SocialIcon>
                )}
              </div>
            </section>
          )}

          {contentSlot}

          {/* Reviews */}
          <section className="mt-14">
            <h2 className="font-secondary text-3xl text-[#0a2225]">Reviews ({reviewCount})</h2>
            {visibleReviews.length === 0 ? (
              <p className="mt-4 text-[15px] text-[#6B7280]">No reviews yet.</p>
            ) : (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {visibleReviews.map((r) => (
                  <article key={r.id} className="rounded-3xl bg-[#F5F0E0]/70 p-6">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0a2225] text-[15px] font-semibold text-[#f7f3ea]">
                        {r.reviewerName[0]?.toUpperCase() || "G"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[17px] font-semibold text-[#0a2225]">{r.reviewerName}</p>
                        {r.destination && (
                          <p className="font-secondary italic text-[15px] text-[#0a2225]/80">
                            travel to {r.destination}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Stars rating={r.rating} />
                      <span className="text-[13px] text-[#6B7280]">
                        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-3 line-clamp-5 leading-relaxed text-[#0a2225]">{r.comment}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
            {reviewCount > 4 && !showAllReviews && (
              <button
                type="button"
                onClick={() => setShowAllReviews(true)}
                className="mt-7 rounded-full border border-[#0a2225]/30 px-7 py-3.5 text-[15px] font-medium text-[#0a2225] transition-colors hover:bg-white"
              >
                See all {reviewCount} reviews
              </button>
            )}
          </section>

          {/* Travel ideas */}
          <section className="mt-14">
            <h2 className="font-secondary text-3xl text-[#0a2225]">Travel ideas ({ideas.length})</h2>
            {ideas.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-8 text-center">
                <p className="font-secondary text-lg text-[#0a2225]">Trips coming soon</p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {kind === "agent"
                    ? "This specialist is building their trip collection."
                    : "This creator is building their trip collection."}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-10">
                {visibleIdeas.map((t) => (
                  <div key={t.id} className="flex flex-col gap-6 md:flex-row">
                    {t.cover_image_url && (
                      <img
                        src={t.cover_image_url}
                        alt={t.title}
                        loading="lazy"
                        className="aspect-[4/3] w-full rounded-3xl object-cover md:w-[45%]"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-secondary text-2xl leading-snug text-[#0a2225] md:text-3xl">{t.title}</h3>
                      {(t.destination || (t.views ?? 0) > 0) && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {t.destination && (
                            <span className="rounded-full bg-[#F5F0E0] px-4 py-1.5 text-[13px] text-[#0a2225]">
                              {t.destination}
                            </span>
                          )}
                          {(t.views ?? 0) > 0 && (
                            <span className="text-[13px] text-[#0a2225]/55">
                              {(t.views as number).toLocaleString()} views
                            </span>
                          )}
                        </div>
                      )}
                      {t.description && (
                        <p className="mt-3 line-clamp-3 leading-relaxed text-[#0a2225]/85">{t.description}</p>
                      )}
                      <Link
                        to={t.href}
                        className="mt-4 inline-block rounded-full border border-[#0a2225]/30 px-6 py-2.5 text-[14px] font-medium text-[#0a2225] transition-colors hover:bg-white"
                      >
                        Explore
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {ideas.length > 3 && !showAllIdeas && (
              <button
                type="button"
                onClick={() => setShowAllIdeas(true)}
                className="mt-8 rounded-full border border-[#0a2225]/30 px-7 py-3.5 text-[15px] font-medium text-[#0a2225] transition-colors hover:bg-white"
              >
                See all {ideas.length} travel ideas
              </button>
            )}
          </section>

          {kind === "agent" && (
            <section className="mt-14">
              <ProfileTripsGrid creatorId={userId} creatorType="agent" title="My trips & tours" />
            </section>
          )}

          {/* Travel photos */}
          {photos.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-6 font-secondary text-3xl text-[#0a2225]">Travel photos</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {photos.map((src) => (
                  <img key={src} src={src} alt="Travel" loading="lazy" className="w-full rounded-3xl object-cover" />
                ))}
              </div>
            </section>
          )}
          {!hideBottomGallery && <PartnerMediaGallery userId={userId} />}
        </div>
      </div>
    </div>
  );
}

export default PartnerProfileFora;
