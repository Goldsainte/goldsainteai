-- ============================================================================
-- Rename the 10 Goldsainte Concierge desks: brand + place, monogram handles
-- ============================================================================
-- "Goldsainte Concierge — Mediterranean Europe" → "Goldsainte Santorini"
-- (@gs.santorini). Region taxonomy reads corporate; places read luxury.
-- Bios are untouched — they already carry the honest "Run by the Goldsainte
-- team" attribution and describe the full regional coverage.
--
-- Each UPDATE matches on the desk's CURRENT username, so this is safe to
-- run more than once: after the first run the old usernames no longer
-- match and every statement quietly updates zero rows.
-- ============================================================================

update public.profiles set display_name = 'Goldsainte Bangkok',     full_name = 'Goldsainte Bangkok',     username = 'gs.bangkok'     where username = 'concierge.southeastasia';
update public.profiles set display_name = 'Goldsainte Santorini',   full_name = 'Goldsainte Santorini',   username = 'gs.santorini'   where username = 'concierge.mediterranean';
update public.profiles set display_name = 'Goldsainte Nairobi',     full_name = 'Goldsainte Nairobi',     username = 'gs.nairobi'     where username = 'concierge.eastafrica';
update public.profiles set display_name = 'Goldsainte Cusco',       full_name = 'Goldsainte Cusco',       username = 'gs.cusco'       where username = 'concierge.andean';
update public.profiles set display_name = 'Goldsainte Kyoto',       full_name = 'Goldsainte Kyoto',       username = 'gs.kyoto'       where username = 'concierge.japankorea';
update public.profiles set display_name = 'Goldsainte Reykjavík',   full_name = 'Goldsainte Reykjavík',   username = 'gs.reykjavik'   where username = 'concierge.nordic';
update public.profiles set display_name = 'Goldsainte Marrakech',   full_name = 'Goldsainte Marrakech',   username = 'gs.marrakech'   where username = 'concierge.mena';
update public.profiles set display_name = 'Goldsainte Nassau',      full_name = 'Goldsainte Nassau',      username = 'gs.nassau'      where username = 'concierge.caribbean';
update public.profiles set display_name = 'Goldsainte Costa Rica',  full_name = 'Goldsainte Costa Rica',  username = 'gs.costarica'   where username = 'concierge.centralamerica';
update public.profiles set display_name = 'Goldsainte Queenstown',  full_name = 'Goldsainte Queenstown',  username = 'gs.queenstown'  where username = 'concierge.oceania';

-- Verify: should return the 10 desks with their new names and handles.
select display_name, username, home_base
from public.profiles
where username like 'gs.%'
order by display_name;
