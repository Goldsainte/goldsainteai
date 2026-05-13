create extension if not exists pg_net;
create extension if not exists pg_cron;

create or replace function public._email_fanout_post(payload jsonb)
returns void language plpgsql security definer set search_path = public, extensions, vault as $fn$
declare
  service_key text;
  fn_url text := 'https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/email-fanout';
begin
  begin
    select decrypted_secret into service_key
    from vault.decrypted_secrets where name = 'email_queue_service_role_key' limit 1;
  exception when others then service_key := null; end;
  if service_key is null then
    raise warning 'email_queue_service_role_key not in vault; skipping email fanout';
    return;
  end if;
  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||service_key),
    body := payload
  );
end $fn$;

create or replace function public._email_fanout_trigger()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare evt text := TG_ARGV[0];
begin
  perform public._email_fanout_post(jsonb_build_object(
    'event', evt,
    'record', to_jsonb(new),
    'old_record', case when tg_op='UPDATE' then to_jsonb(old) else null end
  ));
  return new;
end $fn$;

drop trigger if exists email_agent_app_created on public.agent_applications;
create trigger email_agent_app_created after insert on public.agent_applications
for each row execute function public._email_fanout_trigger('agent_application.created');

drop trigger if exists email_brand_app_created on public.brand_applications;
create trigger email_brand_app_created after insert on public.brand_applications
for each row execute function public._email_fanout_trigger('brand_application.created');

create or replace function public._email_app_approved_trigger()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare evt text;
begin
  if new.status='approved' and (old.status is distinct from 'approved') then
    if tg_table_name='agent_applications' then evt := 'agent_application.approved';
    else evt := 'brand_application.approved'; end if;
    perform public._email_fanout_post(jsonb_build_object('event',evt,'record',to_jsonb(new),'old_record',to_jsonb(old)));
  end if;
  return new;
end $fn$;

drop trigger if exists email_agent_app_approved on public.agent_applications;
create trigger email_agent_app_approved after update on public.agent_applications
for each row execute function public._email_app_approved_trigger();

drop trigger if exists email_brand_app_approved on public.brand_applications;
create trigger email_brand_app_approved after update on public.brand_applications
for each row execute function public._email_app_approved_trigger();

drop trigger if exists email_trip_request_created on public.trip_requests;
create trigger email_trip_request_created after insert on public.trip_requests
for each row execute function public._email_fanout_trigger('trip_request.created');

drop trigger if exists email_proposal_created on public.trip_proposals;
create trigger email_proposal_created after insert on public.trip_proposals
for each row execute function public._email_fanout_trigger('trip_proposal.created');

create or replace function public._email_proposal_status_trigger()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare evt text;
begin
  if new.status is distinct from old.status then
    if new.status='accepted' then evt := 'trip_proposal.accepted';
    elsif new.status='declined' then evt := 'trip_proposal.declined';
    elsif new.status='withdrawn' then evt := 'trip_proposal.withdrawn';
    else return new; end if;
    perform public._email_fanout_post(jsonb_build_object('event',evt,'record',to_jsonb(new),'old_record',to_jsonb(old)));
  end if;
  return new;
end $fn$;

drop trigger if exists email_proposal_status on public.trip_proposals;
create trigger email_proposal_status after update on public.trip_proposals
for each row execute function public._email_proposal_status_trigger();

drop trigger if exists email_inquiry_created on public.agent_inquiries;
create trigger email_inquiry_created after insert on public.agent_inquiries
for each row execute function public._email_fanout_trigger('agent_inquiry.created');

drop trigger if exists email_trip_booking_created on public.trip_bookings;
create trigger email_trip_booking_created after insert on public.trip_bookings
for each row execute function public._email_fanout_trigger('trip_booking.created');

create or replace function public._email_booking_payout_trigger()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.payout_status='completed' and (old.payout_status is distinct from 'completed') then
    perform public._email_fanout_post(jsonb_build_object('event','booking.payout_paid','record',to_jsonb(new),'old_record',to_jsonb(old)));
  end if;
  return new;
end $fn$;

drop trigger if exists email_booking_payout on public.bookings;
create trigger email_booking_payout after update on public.bookings
for each row execute function public._email_booking_payout_trigger();

create or replace function public._email_trip_published_trigger()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.status='published' and (tg_op='INSERT' or old.status is distinct from 'published') then
    perform public._email_fanout_post(jsonb_build_object('event','packaged_trip.published','record',to_jsonb(new)));
  end if;
  return new;
end $fn$;

drop trigger if exists email_trip_published_ins on public.packaged_trips;
create trigger email_trip_published_ins after insert on public.packaged_trips
for each row execute function public._email_trip_published_trigger();

drop trigger if exists email_trip_published_upd on public.packaged_trips;
create trigger email_trip_published_upd after update on public.packaged_trips
for each row execute function public._email_trip_published_trigger();

create or replace function public._email_identity_trigger()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.status is distinct from old.status and new.status in ('verified','approved','rejected','failed') then
    perform public._email_fanout_post(jsonb_build_object('event','identity_verification.updated','record',to_jsonb(new),'old_record',to_jsonb(old)));
  end if;
  return new;
end $fn$;

drop trigger if exists email_identity_status on public.customer_verifications;
create trigger email_identity_status after update on public.customer_verifications
for each row execute function public._email_identity_trigger();

drop trigger if exists email_dispute_opened on public.disputes;
create trigger email_dispute_opened after insert on public.disputes
for each row execute function public._email_fanout_trigger('dispute.opened');

do $blk$
declare
  service_key text;
  fn_url text := 'https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/email-fanout';
  msg_url text := 'https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/dispatch-message-email';
begin
  begin
    select decrypted_secret into service_key from vault.decrypted_secrets where name='email_queue_service_role_key' limit 1;
  exception when others then service_key := null; end;
  if service_key is null then
    raise warning 'email_queue_service_role_key missing; skipping cron schedule';
    return;
  end if;

  perform cron.unschedule(jobname) from cron.job where jobname in ('email-trip-reminders','email-review-requests','email-message-dispatch');

  perform cron.schedule('email-trip-reminders','0 9 * * *', format(
    'select net.http_post(url:=%L, headers:=jsonb_build_object(''Content-Type'',''application/json'',''Authorization'',''Bearer %s''), body:=''{"event":"cron.trip_reminders"}''::jsonb);',
    fn_url, service_key));

  perform cron.schedule('email-review-requests','0 10 * * *', format(
    'select net.http_post(url:=%L, headers:=jsonb_build_object(''Content-Type'',''application/json'',''Authorization'',''Bearer %s''), body:=''{"event":"cron.review_requests"}''::jsonb);',
    fn_url, service_key));

  perform cron.schedule('email-message-dispatch','* * * * *', format(
    'select net.http_post(url:=%L, headers:=jsonb_build_object(''Content-Type'',''application/json'',''Authorization'',''Bearer %s''), body:=''{}''::jsonb);',
    msg_url, service_key));
end $blk$;