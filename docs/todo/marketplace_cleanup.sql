-- Marketplace data hygiene (Workstream C) — run in the Supabase SQL editor (prod).
-- Generated 2026-06-29 from a read-only audit of published packaged_trips (33 total).
--
-- Strategy: ARCHIVE (status = 'archived'), not DELETE — reversible, preserves history,
-- and the marketplace only queries status = 'published', so archived rows disappear
-- from public view immediately. (Swap to DELETE only if you want the short slugs freed.)
--
-- Each archived stub has 0 bookings, single-digit views, AND a richer high-booking
-- sibling that we KEEP:
--   amalfi-coast        -> keep amalfi-coast-dolce-vita   (143 bookings)
--   bali                -> keep bali-wellness-retreat     (178)
--   cape-town           -> keep cape-town-winelands       (178)
--   kyoto               -> keep kyoto-cultural-immersion  (234)
--   marrakech           -> keep marrakech-desert-magic    (167)
--   patagonia           -> keep patagonia-epic-adventure  (98)
--   santorini           -> keep santorini-sunset-escape   (89)
--
-- NOTE: swiss-alps is the ONLY Swiss Alps listing (a solo empty stub, not a dup) —
-- excluded here. Decide separately: leave it, replace it, or archive it (uncomment §4).

-- ── 1. PREVIEW — what §2 will archive (run first; expect 7 rows, all booking_count = 0) ──
select slug, title, destination, status, booking_count, view_count
from packaged_trips
where slug in ('amalfi-coast','bali','cape-town','kyoto','marrakech','patagonia','santorini')
order by destination;

-- ── 2. ARCHIVE the 7 duplicate stubs (guarded by booking_count = 0 → never touches a real trip) ──
update packaged_trips
set status = 'archived'
where slug in ('amalfi-coast','bali','cape-town','kyoto','marrakech','patagonia','santorini')
  and booking_count = 0
  and status = 'published';

-- ── 3. TEST PACKAGE — defensive; not publicly visible now, archive if it still exists ──
update packaged_trips
set status = 'archived'
where status <> 'archived'
  and (slug = 'zzz-test-deposit-flow' or title ilike '%delete me%' or title ilike 'TEST %');

-- ── 4. (OPTIONAL) Swiss Alps solo stub — uncomment only if you want it gone too ──
-- update packaged_trips set status = 'archived'
-- where slug = 'swiss-alps' and booking_count = 0 and status = 'published';

-- ── 5. VERIFY — no destination should have more than one published listing (expect 0 rows) ──
select destination, count(*) as published_count
from packaged_trips
where status = 'published'
group by destination
having count(*) > 1
order by destination;
